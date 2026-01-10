import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

const MIN_AXES = 6;
const MAX_AXES = 10;

const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

async function loadRoleStatus(roleId) {
  const { data, error } = await supabaseAdmin.from('roles').select('status').eq('id', roleId).single();
  if (error) throw new Error(error.message);
  return data?.status;
}

async function getActiveAxes() {
  const { data, error } = await supabaseAdmin
    .from('skill_axes_latest')
    .select('axis_version_id, axis_key, display_name')
    .order('axis_key', { ascending: true });
  if (error) throw new Error(error.message);
  const byKey = new Map((data || []).map((row) => [row.axis_key, { id: row.axis_version_id, axis_key: row.axis_key, display_name: row.display_name }]));
  return byKey;
}

function sanitizeRadar(raw, axisMap) {
  const seen = new Set();
  const list = [];
  for (const item of raw || []) {
    const axisKey = String(item.axis_key || '').trim();
    if (!axisKey || !axisMap.has(axisKey)) continue;
    if (seen.has(axisKey)) continue;
    seen.add(axisKey);
    list.push({
      axis_key: axisKey,
      score_0_100: clamp(Number(item.score_0_100 ?? item.score) || 0, 0, 100),
      min_required_0_100: item.min_required_0_100 === undefined ? null : clamp(Number(item.min_required_0_100), 0, 100),
      confidence_0_1: item.confidence_0_1 === undefined ? null : clamp(Number(item.confidence_0_1), 0, 1),
      rationale: item.rationale || item.reason || null,
      weight_0_5: item.weight_0_5 === undefined ? null : clamp(Number(item.weight_0_5), 0, 5),
      must_have: item.must_have === undefined ? null : Boolean(item.must_have),
    });
    if (list.length >= MAX_AXES) break;
  }

  const needed = Math.max(MIN_AXES - list.length, 0);
  if (needed > 0) {
    for (const [axisKey] of axisMap) {
      if (list.length >= MIN_AXES) break;
      if (seen.has(axisKey)) continue;
      seen.add(axisKey);
      list.push({ axis_key: axisKey, score_0_100: 60, weight_0_1: 1, rationale: null });
    }
  }

  return list.slice(0, MAX_AXES);
}

async function upsertDraftSnapshot({ roleId, profileId, radar, axisMap }) {
  const { data: existing } = await supabaseAdmin
    .from('radar_snapshots')
    .select('id, status')
    .eq('subject_type', 'role')
    .eq('subject_id', roleId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let snapshotId = existing?.id;
  if (!snapshotId) {
    const { data, error } = await supabaseAdmin
      .from('radar_snapshots')
      .insert({
        subject_type: 'role',
        subject_id: roleId,
        role_id: roleId,
        source: 'ai_chat',
        status: 'draft',
        created_by: profileId,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    snapshotId = data.id;
  }

  // Replace existing scores
  await supabaseAdmin.from('radar_scores').delete().eq('snapshot_id', snapshotId);

  const rows = radar.map((item) => {
    const axisMeta = axisMap.get(item.axis_key);
    if (!axisMeta) throw new Error(`Unknown axis_key: ${item.axis_key}`);
    return {
      snapshot_id: snapshotId,
      axis_version_id: axisMeta.id,
      score_0_100: item.score_0_100,
      weight_0_1: item.weight_0_5 === undefined ? null : item.weight_0_5 / 5,
      min_required_0_100: item.min_required_0_100,
      confidence_0_1: item.confidence_0_1,
      reason: item.rationale,
    };
  });

  if (rows.length > 0) {
    const { error: insertErr } = await supabaseAdmin.from('radar_scores').insert(rows);
    if (insertErr) throw new Error(insertErr.message);
  }

  return snapshotId;
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
  const incomingRadar = Array.isArray(body?.radar) ? body.radar : [];
  if (incomingRadar.length === 0) return badRequest('radar array required');

  try {
    const status = await loadRoleStatus(roleId);
    if (status === 'archived') return NextResponse.json({ error: 'Role is archived. Un-archive to save radar.' }, { status: 403 });

    const axisMap = await getActiveAxes();
    const radar = sanitizeRadar(incomingRadar, axisMap);
    if (radar.length < MIN_AXES) return badRequest('Not enough valid axes to save');

    const snapshotId = await upsertDraftSnapshot({ roleId, profileId, radar, axisMap });

    return NextResponse.json({ ok: true, snapshot_id: snapshotId, axes: radar.length });
  } catch (e) {
    return serverError(e.message);
  }
}
