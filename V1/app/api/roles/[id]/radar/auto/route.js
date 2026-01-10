import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

// Default to the requested GPT-5.2 model; allow override via env
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2-2025-12-11';
const OPENAI_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const MAX_AXES = 10;
const MIN_AXES = 10;

function buildHeuristicRadar(respMap, activeAxes) {
  const textValues = Object.values(respMap || {}).filter(Boolean).join(' ');
  const charCount = textValues.length;
  const scoreBonus = Math.min(40, Math.floor(charCount / 80));
  const baseScore = 55 + scoreBonus;
  const axesList = (activeAxes || []).map((a) => a.axis_key);
  const fallback = ['analytical', 'communication', 'leadership', 'execution', 'creativity', 'technical', 'commercial', 'ownership', 'domain', 'teamwork'];
  const merged = [...axesList, ...fallback];
  const unique = Array.from(new Set(merged));
  const axes = unique.slice(0, Math.max(MIN_AXES, MAX_AXES));
  return axes.map((axis_key) => ({
    axis_key,
    score_0_100: Math.max(30, Math.min(100, baseScore)),
    reason: 'Auto-generated from questionnaire responses (heuristic placeholder)',
  }));
}

async function getActiveAxes() {
  const { data, error } = await supabaseAdmin
    .from('skill_axes_latest')
    .select('axis_version_id, axis_key, display_name')
    .order('axis_key', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({ id: row.axis_version_id, axis_key: row.axis_key, display_name: row.display_name }));
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
      status: 'confirmed',
      created_by: profileId,
    })
    .select('id')
    .single();
  if (snapErr) throw new Error(snapErr.message);

  const rows = radar.map((item) => {
    const axisVersionId = axisMap.get(item.axis_key);
    if (!axisVersionId) throw new Error(`Unknown axis_key: ${item.axis_key}`);
    return {
      snapshot_id: snapshot.id,
      axis_version_id: axisVersionId,
      score_0_100: item.score_0_100,
      weight_0_1: item.weight_0_5 === undefined ? null : item.weight_0_5 / 5,
      min_required_0_100: item.min_required_0_100 ?? null,
      reason: item.reason ?? null,
    };
  });

  if (rows.length > 0) {
    const { error: scoresErr } = await supabaseAdmin.from('radar_scores').insert(rows);
    if (scoresErr) throw new Error(scoresErr.message);
  }

  // Demote other confirmed snapshots for this role
  await supabaseAdmin
    .from('radar_snapshots')
    .update({ status: 'draft' })
    .eq('subject_type', 'role')
    .eq('subject_id', roleId)
    .eq('status', 'confirmed')
    .neq('id', snapshot.id);
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
      const weight_0_5 = item.weight_0_5 === undefined ? null : clamp(Number(item.weight_0_5), 0, 5);
      const must_have = item.must_have === undefined ? null : Boolean(item.must_have);
      const min_required_0_100 = item.min_required_0_100 === undefined ? null : clamp(Number(item.min_required_0_100), 0, 100);
      const reason = (item.reason || '').toString().trim() || 'Generated from AI';
      return { axis_key, score_0_100, reason, weight_0_5, must_have, min_required_0_100 };
    })
    .filter(Boolean);

  if (cleaned.length < MIN_AXES) {
    const used = new Set(cleaned.map((c) => c.axis_key));
    for (const axis_key of activeAxisKeys) {
      if (cleaned.length >= MIN_AXES) break;
      if (used.has(axis_key)) continue;
      cleaned.push({
        axis_key,
        score_0_100: 60,
        reason: 'Filled to minimum axes',
        weight_0_5: null,
        must_have: null,
        min_required_0_100: null,
      });
    }
  }

  return cleaned.slice(0, MAX_AXES);
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
          reason: { type: 'string' },
          weight_0_5: { type: 'number' },
          must_have: { type: 'boolean' },
          min_required_0_100: { type: 'number' },
        },
        // Some providers require all declared properties to be listed in "required" for json_schema
        required: ['axis_key', 'score_0_100', 'reason'],
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

async function callOpenAI({ role, answers, axes, model = OPENAI_MODEL }) {
  const legacyKey = process.env.OPENAI_KEY || process.env.OPENAI_TOKEN;
  const rawKey = process.env.OPENAI_API_KEY;
  const trimmedKey = rawKey?.trim();
  if (rawKey && rawKey.length !== trimmedKey?.length) {
    console.warn('[WARN] OPENAI_API_KEY contained surrounding whitespace and was trimmed');
  }
  if (legacyKey) {
    console.warn('[WARN] Legacy OpenAI key env present (OPENAI_KEY/OPENAI_TOKEN) but unused; please remove');
  }

  if (!trimmedKey) throw new Error('OpenAI key missing (OPENAI_API_KEY)');

  const qa = answers
    .map((a) => `- ${a.role_questions?.slug || a.question_id}: ${a.answer_text || ''}`)
    .join('\n');
  const axisCatalog = axes
    .map((a) => `${a.axis_key}${a.display_name ? ` (${a.display_name})` : ''}`)
    .join('; ');

  const messages = [
    {
      role: 'system',
      content:
        'You are an assessor who scores role requirements into a skill radar. Select the 10 most relevant axes (or fewer) from the provided catalog; never invent new axes. Respond ONLY with JSON matching: {"scores":[{"axis_key": string, "score_0_100": number, "reason": string}]}. Do not return more than 10 items. Scores must be 0-100.',
    },
    {
      role: 'user',
      content: `Axis catalog (choose up to 10 most relevant): ${axisCatalog}\nRole title: ${role.title}\nDescription: ${role.description || ''}\nResponsibilities: ${(role.responsibilities || []).join('; ')}\nRequirements: ${(role.requirements || []).join('; ')}\nAnswers:\n${qa}`,
    },
  ];

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${trimmedKey}`,
  };

  console.log('[DEBUG] OpenAI Config:', {
    present: !!trimmedKey,
    length: trimmedKey?.length || 0,
    startsWith: trimmedKey ? trimmedKey.slice(0, 8) : null,
    last4: trimmedKey ? trimmedKey.slice(-4) : null,
    hasWhitespace: /\s/.test(trimmedKey || ''),
    legacyVarsPresent: {
      OPENAI_KEY: !!process.env.OPENAI_KEY,
      OPENAI_TOKEN: !!process.env.OPENAI_TOKEN,
    },
    model,
  });

  if ('OpenAI-Organization' in headers) {
    throw new Error('Unexpected OpenAI-Organization header present; aborting request');
  }
  if ('OpenAI-Project' in headers) {
    throw new Error('Unexpected OpenAI-Project header present; aborting request');
  }

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_completion_tokens: 700,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
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
  const validated = validateRadar(arr, activeKeys).slice(0, MAX_AXES);
  if (validated.length === 0) throw new Error('AI returned no valid axes');
  return validated;
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
  let modelUsed = OPENAI_MODEL;
  try {
    radar = await callOpenAI({ role, answers: answers || [], axes, model: OPENAI_MODEL });
    radar = (radar || []).slice(0, MAX_AXES);
  } catch (e) {
    strategy = 'fallback';
    fallbackReason = `AI unavailable: ${e?.message?.slice(0, 180) || 'unknown error'}; used heuristic radar`;
    console.warn('AI radar generation failed, falling back. Reason:', e?.message);
    radar = buildHeuristicRadar(respMap, axes);
  }
  try {
    const snapshotId = await insertSnapshotWithScores({ roleId, profileId, radar });
    return NextResponse.json({ ok: true, snapshot_id: snapshotId, strategy, model: modelUsed, fallbackReason });
  } catch (e) {
    return serverError(e.message);
  }
}
