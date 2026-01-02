import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

async function getActiveAxes() {
  const { data, error } = await supabaseAdmin
    .from('skill_axes')
    .select('id, axis_key')
    .eq('is_active', true);
  if (error) throw new Error(error.message);
  const map = new Map(data.map((a) => [a.axis_key, a.id]));
  return map;
}

async function insertSnapshotWithScores({ roleId, profileId, source, radar }) {
  const axisMap = await getActiveAxes();

  const { data: snapshot, error: snapErr } = await supabaseAdmin
    .from('radar_snapshots')
    .insert({
      subject_type: 'role',
      subject_id: roleId,
      role_id: roleId,
      source,
      status: 'draft',
      created_by: profileId,
    })
    .select('id')
    .single();
  if (snapErr) throw new Error(snapErr.message);

  const scoreRows = radar.map((item) => {
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

  const { error: scoresErr } = await supabaseAdmin.from('radar_scores').insert(scoreRows);
  if (scoresErr) throw new Error(scoresErr.message);
  return snapshot.id;
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
  const radar = body?.radar;
  if (!Array.isArray(radar) || radar.length === 0) {
    return badRequest('radar array required (AI integration to be added)');
  }

  // TODO: integrate AI call here when ready: fetch role + answers, craft prompt, validate JSON output
  try {
    const snapshotId = await insertSnapshotWithScores({ roleId, profileId, source: 'ai_initial', radar });
    return NextResponse.json({ ok: true, snapshot_id: snapshotId });
  } catch (e) {
    return serverError(e.message);
  }
}
