import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

const MIN_AXES = 6;
const MAX_AXES = 10;
const OPENAI_MODEL = process.env.OPENAI_MODEL_CHAT || process.env.OPENAI_MODEL || 'gpt-5.2-2025-12-11';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

async function getActiveAxes() {
  const { data, error } = await supabaseAdmin
    .from('skill_axes')
    .select('id, axis_key, display_name')
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function loadRole(roleId) {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('id, title, status, description, responsibilities, requirements, public_notes, private_notes')
    .eq('id', roleId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function loadBestSnapshot(roleId) {
  // Align with role detail page: simply take the most recent snapshot for the role
  const { data: snapshot, error: snapErr } = await supabaseAdmin
    .from('radar_snapshots')
    .select('id, status, source, created_at')
    .eq('subject_type', 'role')
    .eq('subject_id', roleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (snapErr && snapErr.code !== 'PGRST116') throw new Error(snapErr.message);
  if (!snapshot) return { snapshot: null, scores: [] };

  const { data: scores, error: scoresErr } = await supabaseAdmin
    .from('radar_scores')
    .select('axis_id, score_0_100, weight_0_1, min_required_0_100, confidence_0_1, reason, skill_axes(axis_key, display_name)')
    .eq('snapshot_id', snapshot.id)
    .order('axis_id', { ascending: true });
  if (scoresErr) throw new Error(scoresErr.message);
  return { snapshot, scores: scores || [] };
}

function ensureAxisCount(axes, activeAxes) {
  const activeMap = new Map(activeAxes.map((a) => [a.axis_key, a]));
  const seen = new Set();
  const filtered = [];
  for (const item of axes || []) {
    const axisKey = String(item.axis_key || '').trim();
    if (!axisKey || !activeMap.has(axisKey)) continue;
    if (seen.has(axisKey)) continue;
    seen.add(axisKey);
    filtered.push(item);
    if (filtered.length >= MAX_AXES) break;
  }

  const needed = Math.max(MIN_AXES - filtered.length, 0);
  if (needed > 0) {
    for (const axis of activeAxes) {
      if (filtered.length >= MIN_AXES) break;
      if (seen.has(axis.axis_key)) continue;
      filtered.push({ axis_key: axis.axis_key, label: axis.display_name, score_0_100: 60 });
    }
  }

  return filtered.slice(0, MAX_AXES);
}

function sanitizeRadar(raw, activeAxes) {
  const activeMap = new Map(activeAxes.map((a) => [a.axis_key, a]));
  const prepared = ensureAxisCount(raw || [], activeAxes).map((item) => {
    const axisKey = String(item.axis_key || '').trim();
    const axisMeta = activeMap.get(axisKey) || {};
    const rationale = item.rationale || item.reason || 'AI suggestion';
    return {
      axis_key: axisKey,
      label: String(item.label || item.display_name || axisMeta.display_name || axisKey).trim(),
      score_0_100: clamp(Number(item.score_0_100 ?? item.score) || 0, 0, 100),
      min_required_0_100: item.min_required_0_100 === undefined ? null : clamp(Number(item.min_required_0_100), 0, 100),
      confidence_0_1: item.confidence_0_1 === undefined ? null : clamp(Number(item.confidence_0_1), 0, 1),
      rationale,
    };
  });

  return prepared;
}

function stripCodeFences(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/```json|```/gi, '').trim();
}

function tryParse(candidate) {
  if (candidate === undefined || candidate === null) return null;
  if (typeof candidate === 'object') return candidate;
  if (typeof candidate !== 'string') return null;
  const cleaned = stripCodeFences(candidate);
  try {
    return JSON.parse(cleaned);
  } catch (_e) {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_err) {
        return null;
      }
    }
    return null;
  }
}

function radarToText(radar) {
  return (radar || [])
    .map((a) => `${a.axis_key}: score ${a.score_0_100 ?? 'n/a'}`)
    .join('\n');
}

const radarChatSchema = {
  name: 'radar_chat_update',
  schema: {
    type: 'object',
    properties: {
      reply: { type: 'string' },
      radar: {
        type: 'object',
        properties: {
          rationale: { type: 'string' },
          axes: {
            type: 'array',
            minItems: MIN_AXES,
            maxItems: MAX_AXES,
            items: {
              type: 'object',
              properties: {
                axis_key: { type: 'string' },
                label: { type: 'string' },
                score_0_100: { type: 'number' },
                rationale: { type: 'string' },
              },
              required: ['axis_key', 'label', 'score_0_100', 'rationale'],
              additionalProperties: false,
            },
          },
        },
        required: ['rationale', 'axes'],
        additionalProperties: false,
      },
    },
    required: ['reply', 'radar'],
    additionalProperties: false,
  },
  strict: true,
};

async function callOpenAI({ role, radar, messages }) {
  if (!OPENAI_KEY) throw new Error('OpenAI key missing');
  const baseContext = `Role: ${role.title}\nStatus: ${role.status}\nDescription: ${role.description || ''}\nResponsibilities: ${(role.responsibilities || []).join('; ')}\nRequirements: ${(role.requirements || []).join('; ')}\nCurrent radar (axis, score):\n${radarToText(radar)}`;

  const chatMessages = [
    {
      role: 'system',
      content:
        'You help hiring managers rebalance a skill radar. Always return JSON matching the given schema. Keep axes concise (6-10) and scores 0-100. Prefer the provided active axes; do not invent new ones. Include a helpful natural language reply explaining your changes.',
    },
    { role: 'user', content: baseContext },
    ...(messages || []).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || ''),
    })),
  ];

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: chatMessages,
      temperature: 0.3,
      max_completion_tokens: 900,
      response_format: { type: 'json_schema', json_schema: radarChatSchema },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const message = json?.choices?.[0]?.message;
  const candidatePayloads = [
    message?.parsed,
    message?.content?.[0]?.json,
    message?.content,
    Array.isArray(message?.content)
      ? message.content
          .map((p) => {
            if (typeof p?.json === 'object') return p.json;
            if (typeof p?.text === 'string') return p.text;
            return null;
          })
          .filter(Boolean)
          .join('\n')
      : null,
  ].filter((v) => v !== undefined && v !== null && v !== '');

  const parsed = candidatePayloads.map(tryParse).find((p) => p) || null;
  if (!parsed) throw new Error('Could not parse AI response');
  return parsed;
}

async function ensureThread(roleId, profileId, providedId) {
  if (providedId) {
    const { data, error } = await supabaseAdmin
      .from('ai_threads')
      .select('id')
      .eq('id', providedId)
      .eq('role_id', roleId)
      .single();
    if (!error && data) return data.id;
  }

  const { data, error } = await supabaseAdmin
    .from('ai_threads')
    .insert({ role_id: roleId, created_by: profileId })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function logMessages(threadId, userPayload, aiPayload) {
  try {
    if (!threadId) return;
    const rows = [
      { sender: 'company', content: userPayload },
      { sender: 'ai', content: aiPayload },
    ].map((row) => ({ ...row, thread_id: threadId }));
    await supabaseAdmin.from('ai_messages').insert(rows);
  } catch (e) {
    console.warn('Failed to log AI chat messages', e.message);
  }
}

function sanitizeForClient(radar) {
  return radar.map((a) => ({
    axis_key: a.axis_key,
    label: a.label,
    score_0_100: a.score_0_100,
    min_required_0_100: a.min_required_0_100,
    confidence_0_1: a.confidence_0_1,
    rationale: a.rationale,
  }));
}

export async function GET(_req, { params }) {
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

  try {
    const [role, activeAxes, radar] = await Promise.all([
      loadRole(roleId),
      getActiveAxes(),
      loadBestSnapshot(roleId),
    ]);

    const baseRadarRaw = (radar.scores || []).map((s) => ({
      axis_key: s.skill_axes?.axis_key,
      label: s.skill_axes?.display_name,
      score_0_100: Number(s.score_0_100),
      rationale: s.reason,
    }));

    const workingRadar = sanitizeRadar(baseRadarRaw, activeAxes);

    return NextResponse.json({
      role,
      snapshot: radar.snapshot,
      radar: sanitizeForClient(workingRadar),
      active_axes: activeAxes,
      canSave: role.status !== 'archived',
    });
  } catch (e) {
    return serverError(e.message);
  }
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

  const body = await _req.json().catch(() => null);
  const userMessages = Array.isArray(body?.messages) ? body.messages : [];
  const incomingRadar = Array.isArray(body?.radar) ? body.radar : [];
  const providedThreadId = body?.thread_id || null;

  if (userMessages.length === 0) {
    return badRequest('messages array required');
  }

  try {
    const [role, activeAxes, baseline] = await Promise.all([
      loadRole(roleId),
      getActiveAxes(),
      loadBestSnapshot(roleId),
    ]);

    const fallbackRadarRaw = (baseline.scores || []).map((s) => ({
      axis_key: s.skill_axes?.axis_key,
      label: s.skill_axes?.display_name,
      score_0_100: Number(s.score_0_100),
      rationale: s.reason,
    }));
    const workingRadar = sanitizeRadar(incomingRadar.length ? incomingRadar : fallbackRadarRaw, activeAxes);

    let aiReply = 'I could not adjust the radar right now, please try again.';
    let aiRadar = workingRadar;
    let modelUsed = OPENAI_MODEL;
    let fallbackReason = null;

    try {
      const aiResponse = await callOpenAI({ role, radar: workingRadar, messages: userMessages });
      aiReply = aiResponse.reply || aiReply;
      aiRadar = sanitizeRadar(aiResponse?.radar?.axes || workingRadar, activeAxes);
      modelUsed = OPENAI_MODEL;
    } catch (err) {
      fallbackReason = err.message || 'AI call failed';
      console.warn('Radar chat AI failed:', err.message);
    }

    let threadId = null;
    try {
      threadId = await ensureThread(roleId, profileId, providedThreadId);
      await logMessages(threadId, { messages: userMessages, radar: workingRadar }, { reply: aiReply, radar: aiRadar });
    } catch (e) {
      console.warn('Thread/logging issue:', e.message);
    }

    return NextResponse.json({
      ok: true,
      reply: aiReply,
      radar: sanitizeForClient(aiRadar),
      model: modelUsed,
      thread_id: threadId,
      fallbackReason,
    });
  } catch (e) {
    return serverError(e.message);
  }
}
