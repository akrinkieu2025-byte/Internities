import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2-2025-12-11';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

function buildHeuristicRadar(respMap) {
  const textValues = Object.values(respMap || {}).filter(Boolean).join(' ');
  const charCount = textValues.length;
  const scoreBonus = Math.min(40, Math.floor(charCount / 80));
  const baseScore = 55 + scoreBonus;
  const axes = ['analytical','communication','leadership','execution','creativity','technical','commercial','ownership','domain'];
  return axes.map((axis_key) => ({
    axis_key,
    score_0_100: Math.max(30, Math.min(100, baseScore)),
    confidence_0_1: 0.55,
    reason: 'Auto-generated from questionnaire responses (heuristic placeholder)',
  }));
}

async function getActiveAxes() {
  const { data, error } = await supabaseAdmin
    .from('skill_axes')
    .select('id, axis_key')
    .eq('is_active', true);
  if (error) throw new Error(error.message);
  return data || [];
}

async function insertSnapshotWithScores({ roleId, profileId, radar }) {
  const axes = await getActiveAxes();
  const axisMap = new Map(axes.map((a) => [a.axis_key, a.id]));

  const { data: snapshot, error: snapErr } = await supabaseAdmin
    .from('radar_snapshots')
    .insert({
      subject_type: 'role',
      subject_id: roleId,
      role_id: roleId,
      source: 'ai_initial',
      status: 'draft',
      created_by: profileId,
    })
    .select('id')
    .single();
  if (snapErr) throw new Error(snapErr.message);

  const rows = radar.map((item) => {
    const axisId = axisMap.get(item.axis_key);
    if (!axisId) throw new Error(`Unknown axis_key: ${item.axis_key}`);
    return {
      snapshot_id: snapshot.id,
      axis_id: axisId,
      score_0_100: item.score_0_100,
      weight_0_1: item.weight_0_1 ?? null,
      min_required_0_100: item.min_required_0_100 ?? null,
      confidence_0_1: item.confidence_0_1 ?? null,
      reason: item.reason ?? null,
    };
  });

  if (rows.length > 0) {
    const { error: scoresErr } = await supabaseAdmin.from('radar_scores').insert(rows);
    if (scoresErr) throw new Error(scoresErr.message);
  }
  return snapshot.id;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function validateRadar(raw, activeAxisKeys) {
  if (!Array.isArray(raw)) throw new Error('AI response not an array');
  const cleaned = raw
    .map((item) => {
      const axis_key = String(item.axis_key || '').trim();
      if (!axis_key || !activeAxisKeys.has(axis_key)) return null;
      const score_0_100 = clamp(Number(item.score_0_100), 0, 100);
      const confidence_0_1 = item.confidence_0_1 === undefined ? null : clamp(Number(item.confidence_0_1), 0, 1);
      const reason = (item.reason || '').toString().trim() || 'Generated from AI';
      return { axis_key, score_0_100, confidence_0_1, reason };
    })
    .filter(Boolean);
  return cleaned;
}

const radarSchema = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          axis_key: { type: 'string' },
          score_0_100: { type: 'number' },
          confidence_0_1: { type: 'number' },
          reason: { type: 'string' },
        },
        // Some providers require all declared properties to be listed in "required" for json_schema
        required: ['axis_key', 'score_0_100', 'confidence_0_1', 'reason'],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: ['scores'],
  additionalProperties: false,
};

function stripCodeFences(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/```json|```/gi, '').trim();
}

function pickFirstParsed(candidateList) {
  const tryParse = (text) => {
    if (text === undefined || text === null) return null;
    if (typeof text === 'object') return text; // already JSON
    if (typeof text !== 'string') return null;
    const cleaned = stripCodeFences(text);
    try {
      return JSON.parse(cleaned);
    } catch (_e) {
      const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (_e2) {
          return null;
        }
      }
      return null;
    }
  };

  for (const candidate of candidateList) {
    const parsed = tryParse(candidate);
    if (parsed) return parsed;
  }
  return null;
}

async function callOpenAI({ role, answers, axes }) {
  if (!OPENAI_KEY) throw new Error('OpenAI key missing');

  const qa = answers
    .map((a) => `- ${a.role_questions?.slug || a.question_id}: ${a.answer_text || ''}`)
    .join('\n');
  const axisList = axes.map((a) => a.axis_key).join(', ');

  const messages = [
    {
      role: 'system',
      content:
        'You are an assessor who scores role requirements into a skill radar. Respond ONLY with JSON matching the schema: {"scores":[{"axis_key": string, "score_0_100": number, "confidence_0_1": number, "reason": string}]}. Ensure one entry per provided axis. Scores 0-100, confidence 0-1.',
    },
    {
      role: 'user',
      content: `Axes: ${axisList}\nRole title: ${role.title}\nDescription: ${role.description || ''}\nResponsibilities: ${(role.responsibilities || []).join('; ')}\nRequirements: ${(role.requirements || []).join('; ')}\nAnswers:\n${qa}`,
    },
  ];

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.3,
      // Some provider versions use max_completion_tokens instead of max_tokens
      max_completion_tokens: 700,
      // Use json_object for broader provider compatibility (Azure/OpenAI) and better well-formed payloads
      response_format: {
        type: 'json_object',
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const msg = json?.choices?.[0]?.message;

  const candidatePayloads = [
    msg?.parsed,
    msg?.content?.[0]?.json,
    msg?.content,
    Array.isArray(msg?.content)
      ? msg.content
          .map((p) => {
            if (typeof p?.json === 'object') return p.json;
            if (typeof p?.text === 'string') return p.text;
            return null;
          })
          .filter(Boolean)
          .join('\n')
      : null,
    json?.choices?.[0]?.message?.content?.[0]?.json,
    json?.choices?.[0]?.message?.content?.[0]?.text,
  ].filter((v) => v !== undefined && v !== null && v !== '');

  if (candidatePayloads.length === 0) throw new Error('No content from OpenAI');

  const parsed = pickFirstParsed(candidatePayloads);
  if (!parsed) {
    const sample = String(candidatePayloads[0]).slice(0, 320);
    throw new Error(`Failed to parse OpenAI JSON. Sample: ${sample}`);
  }

  const arr = Array.isArray(parsed) ? parsed : parsed.scores || parsed.data || parsed.radars || null;
  if (!arr) throw new Error('Unexpected JSON structure');

  const activeKeys = new Set(axes.map((a) => a.axis_key));
  const validated = validateRadar(arr, activeKeys);

  const byKey = new Map(validated.map((v) => [v.axis_key, v]));
  return axes.map((axis) => {
    if (byKey.has(axis.axis_key)) return byKey.get(axis.axis_key);
    return {
      axis_key: axis.axis_key,
      score_0_100: 55,
      confidence_0_1: 0.4,
      reason: 'Backfilled: missing from AI response',
    };
  });
}

export async function POST(_req, { params }) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');
  const roleId = params?.id;
  if (!roleId) return badRequest('Missing role id');

  let profileId;
  try {
    profileId = await getProfileIdFromAuth(_req.headers);
    await assertCompanyMemberForRole(profileId, roleId);
  } catch (e) {
    const msg = e.message || 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg.startsWith('Forbidden') ? 403 : 401 });
  }

  // Load answers to build radar
  const { data: answers, error: ansErr } = await supabaseAdmin
    .from('role_answers')
    .select('answer_text, question_id, role_questions!inner(slug)')
    .eq('role_id', roleId);
  if (ansErr) return serverError(ansErr.message);

  // Load role basics for context
  const { data: role, error: roleErr } = await supabaseAdmin
    .from('roles')
    .select('id,title,description,responsibilities,requirements')
    .eq('id', roleId)
    .single();
  if (roleErr) return serverError(roleErr.message);

  const respMap = (answers || []).reduce((acc, a) => {
    const slug = a?.role_questions?.slug;
    if (slug) acc[slug] = a.answer_text || '';
    return acc;
  }, {});

  const axes = await getActiveAxes();
  let radar;
  let strategy = 'ai';
  let fallbackReason = null;
  try {
    radar = await callOpenAI({ role, answers: answers || [], axes });
  } catch (e) {
    strategy = 'fallback';
    fallbackReason = e.message || 'Unknown error';
    console.warn('AI radar generation failed, falling back. Reason:', e.message);
    radar = buildHeuristicRadar(respMap);
  }
  try {
    const snapshotId = await insertSnapshotWithScores({ roleId, profileId, radar });
    return NextResponse.json({ ok: true, snapshot_id: snapshotId, strategy, model: OPENAI_MODEL, fallbackReason });
  } catch (e) {
    return serverError(e.message);
  }
}
