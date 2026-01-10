import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

const MIN_AXES = 6;
const MAX_AXES = 10;
const OPENAI_MODEL = process.env.OPENAI_MODEL_CHAT || process.env.OPENAI_MODEL || 'gpt-5.2-2025-12-11';
const OPENAI_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL || 'gpt-4o-mini';

const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

async function getActiveAxes() {
  const { data, error } = await supabaseAdmin
    .from('skill_axes_latest')
    .select('axis_version_id, axis_key, display_name, definition, not_definition')
    .order('axis_key', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    id: row.axis_version_id,
    axis_key: row.axis_key,
    display_name: row.display_name,
    definition: row.definition,
    not_definition: row.not_definition,
  }));
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

async function loadSnapshot(roleId, snapshotId) {
  const { data: snapshots, error: listErr } = await supabaseAdmin
    .from('radar_snapshots')
    .select('id, status, source, created_at')
    .eq('subject_type', 'role')
    .eq('subject_id', roleId)
    .order('created_at', { ascending: true });

  if (listErr && listErr.code !== 'PGRST116') throw new Error(listErr.message);
  const snapshotsList = snapshots || [];
  if (snapshotsList.length === 0) return { snapshot: null, scores: [], version: null, total: 0 };

  let snapshot = null;
  if (snapshotId) {
    snapshot = snapshotsList.find((s) => s.id === snapshotId) || null;
  }
  if (!snapshot) {
    snapshot = snapshotsList[snapshotsList.length - 1]; // fallback to latest
  }

  const versionIndex = snapshotsList.findIndex((s) => s.id === snapshot.id);

  const { data: scores, error: scoresErr } = await supabaseAdmin
    .from('radar_scores')
    .select(
      `axis_version_id, score_0_100, weight_0_1, min_required_0_100, reason,
       skill_axis_versions:axis_version_id (
         axis_key,
         skill_axis_localizations (locale, display_name, definition, not_definition)
       )`
    )
    .eq('snapshot_id', snapshot.id)
    .order('axis_version_id', { ascending: true });
  if (scoresErr) throw new Error(scoresErr.message);
  const normalized = (scores || []).map((s) => {
    const locs = s.skill_axis_versions?.skill_axis_localizations || [];
    const en = locs.find((l) => l.locale === 'en') || locs[0] || null;
    const displayName = en?.display_name || s.skill_axis_versions?.axis_key || null;
    return {
      ...s,
      axis_key: s.skill_axis_versions?.axis_key,
      skill_axes: { axis_key: s.skill_axis_versions?.axis_key, display_name: displayName },
    };
  });
  return { snapshot, scores: normalized, version: versionIndex + 1, total: snapshotsList.length };
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

function sanitizeRadar(raw, activeAxes, fallbackRadar = []) {
  const activeMap = new Map(activeAxes.map((a) => [a.axis_key, a]));
  const current = new Map((fallbackRadar || []).map((a) => [a.axis_key, { ...a }]));
  const rejected = [];

  for (const item of raw || []) {
    const axisKey = String(item.axis_key || '').trim();
    if (!axisKey || !activeMap.has(axisKey)) {
      if (axisKey) rejected.push(axisKey);
      continue;
    }
    const axisMeta = activeMap.get(axisKey) || {};
    const rationale = item.rationale || item.reason || 'AI suggestion';
    const label = axisMeta.display_name || item.display_name || item.label || axisKey;
    current.set(axisKey, {
      axis_key: axisKey,
      label: String(label).trim(),
      score_0_100: clamp(Number(item.score_0_100 ?? item.score) || 0, 0, 100),
      min_required_0_100: item.min_required_0_100 === undefined ? null : clamp(Number(item.min_required_0_100), 0, 100),
      rationale,
    });
  }

  const prepared = ensureAxisCount(Array.from(current.values()), activeAxes);
  return { radar: prepared, rejectedInvalidAxes: rejected };
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

async function callOpenAI({ role, radar, messages, activeAxes, modelOverride }) {
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
  const axisCatalog = (activeAxes || []).map((a) => `${a.axis_key}${a.display_name ? ` (${a.display_name})` : ''}`).join('; ');
  const baseContext = `Role: ${role.title}\nStatus: ${role.status}\nDescription: ${role.description || ''}\nResponsibilities: ${(role.responsibilities || []).join('; ')}\nRequirements: ${(role.requirements || []).join('; ')}\nAvailable axes (catalog): ${axisCatalog}\nCurrent radar (axis, score):\n${radarToText(radar)}`;

  const chatMessages = [
    {
      role: 'system',
      content:
        'You help hiring managers rebalance a skill radar. Always return JSON matching the given schema. Keep axes concise (6-10) and scores 0-100. You MUST only use axes from the provided catalog; never invent or accept new axis names. If the user requests an axis that is not in the catalog, do NOT remove existing axes—instead, explain that the axis is unavailable, ask them to describe the skill, and suggest the closest catalog axis. You have the full catalog list above—use it. Include a helpful natural language reply explaining your changes.',
    },
    { role: 'user', content: baseContext },
    ...(messages || []).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || ''),
    })),
  ];

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${trimmedKey}`,
  };

  console.log('[DEBUG] OpenAI Chat Config:', {
    present: !!trimmedKey,
    length: trimmedKey?.length || 0,
    startsWith: trimmedKey ? trimmedKey.slice(0, 8) : null,
    last4: trimmedKey ? trimmedKey.slice(-4) : null,
    hasWhitespace: /\s/.test(trimmedKey || ''),
    legacyVarsPresent: {
      OPENAI_KEY: !!process.env.OPENAI_KEY,
      OPENAI_TOKEN: !!process.env.OPENAI_TOKEN,
    },
  });

  if ('OpenAI-Organization' in headers) {
    throw new Error('Unexpected OpenAI-Organization header present; aborting request');
  }
  if ('OpenAI-Project' in headers) {
    throw new Error('Unexpected OpenAI-Project header present; aborting request');
  }

  const tryModel = async (modelName) => {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: chatMessages,
        temperature: 0.3,
        max_completion_tokens: 900,
        response_format: { type: 'json_schema', json_schema: radarChatSchema },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  };

  let json;
  const primaryModel = modelOverride || OPENAI_MODEL;
  try {
    json = await tryModel(primaryModel);
  } catch (err) {
    const status = err?.status;
    const shouldFallback = status === 403 || status === 404;
    if (!shouldFallback) throw err;
    json = await tryModel(OPENAI_FALLBACK_MODEL);
  }

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
  parsed.model = json?.model || primaryModel;
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
    rationale: a.rationale,
  }));
}

export async function GET(_req, { params }) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');
  const roleId = params?.id;
  if (!roleId) return badRequest('Missing role id');
  const snapshotId = _req.nextUrl.searchParams.get('snapshot_id') || null;

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
      loadSnapshot(roleId, snapshotId),
    ]);

    const baseRadarRaw = (radar.scores || []).map((s) => ({
      axis_key: s.skill_axes?.axis_key,
      label: s.skill_axes?.display_name,
      score_0_100: Number(s.score_0_100),
      min_required_0_100: s.min_required_0_100 ?? null,
      weight_0_5: s.weight_0_1 === null || s.weight_0_1 === undefined ? null : s.weight_0_1 * 5,
      must_have: null,
      rationale: s.reason,
    }));

    const { radar: workingRadar } = sanitizeRadar(baseRadarRaw, activeAxes);

    return NextResponse.json({
      role,
      snapshot: radar.snapshot,
      version: radar.version,
      total_versions: radar.total,
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
  const snapshotId = _req.nextUrl.searchParams.get('snapshot_id') || null;

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
      loadSnapshot(roleId, snapshotId),
    ]);

    const fallbackRadarRaw = (baseline.scores || []).map((s) => ({
      axis_key: s.skill_axes?.axis_key,
      label: s.skill_axes?.display_name,
      score_0_100: Number(s.score_0_100),
      min_required_0_100: s.min_required_0_100 ?? null,
      weight_0_5: s.weight_0_1 === null || s.weight_0_1 === undefined ? null : s.weight_0_1 * 5,
      must_have: null,
      rationale: s.reason,
    }));
    const { radar: workingRadar } = sanitizeRadar(incomingRadar.length ? incomingRadar : fallbackRadarRaw, activeAxes);

    let aiReply = 'I could not adjust the radar right now, please try again.';
    let aiRadar = workingRadar;
    let modelUsed = OPENAI_MODEL;
    let fallbackReason = null;

    try {
      const aiResponse = await callOpenAI({ role, radar: workingRadar, messages: userMessages, activeAxes });
      aiReply = aiResponse.reply || aiReply;
      const { radar: cleaned, rejectedInvalidAxes } = sanitizeRadar(aiResponse?.radar?.axes || workingRadar, activeAxes, workingRadar);
      aiRadar = cleaned;
      if (rejectedInvalidAxes.length) {
        const list = rejectedInvalidAxes.slice(0, 5).join(', ');
        aiReply = `${aiReply}\n\nSkipped axes not in catalog: ${list}. Please describe the desired skill and I will suggest the closest axis from the library.`;
      }
      modelUsed = aiResponse?.model || OPENAI_MODEL;
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
