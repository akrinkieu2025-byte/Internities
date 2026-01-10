import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

export async function GET(_request, { params }) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');
  const roleId = params?.id;
  if (!roleId) return NextResponse.json({ error: 'Role id required' }, { status: 400 });

  let profileId;
  try {
    profileId = await getProfileIdFromAuth(_request.headers);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
  }

  const { data: role, error: roleErr } = await supabaseAdmin.from('roles').select('*').eq('id', roleId).single();
  if (roleErr) return serverError(roleErr.message);

  const { data: membership, error: memErr } = await supabaseAdmin
    .from('company_members')
    .select('id')
    .eq('company_id', role.company_id)
    .eq('profile_id', profileId)
    .maybeSingle();
  if (memErr) return serverError(memErr.message);
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Latest radar snapshot + scores
  const { data: snapshot, error: snapErr } = await supabaseAdmin
    .from('radar_snapshots')
    .select('id, created_at, status, source')
    .eq('subject_type', 'role')
    .eq('subject_id', roleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let scores = [];
  if (snapErr && snapErr.code !== 'PGRST116') {
    return serverError(snapErr.message);
  }
  if (snapshot) {
    const { data: scoreRows, error: scoreErr } = await supabaseAdmin
      .from('radar_scores')
      .select(
        `axis_version_id, score_0_100, weight_0_1, min_required_0_100, confidence_0_1, reason,
         skill_axis_versions:axis_version_id (
           axis_key,
           skill_axis_localizations (locale, display_name)
         )`
      )
      .eq('snapshot_id', snapshot.id);
    if (scoreErr) return serverError(scoreErr.message);
    scores = (scoreRows || []).map((s) => {
      const locs = s.skill_axis_versions?.skill_axis_localizations || [];
      const en = locs.find((l) => l.locale === 'en') || locs[0] || null;
      const displayName = en?.display_name || s.skill_axis_versions?.axis_key || null;
      return {
        ...s,
        axis_key: s.skill_axis_versions?.axis_key,
        skill_axes: { axis_key: s.skill_axis_versions?.axis_key, display_name: displayName },
      };
    });
  }

  return NextResponse.json({ role, radar: snapshot ? { snapshot, scores } : null });
}

export async function DELETE(_request, { params }) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');
  const roleId = params?.id;
  if (!roleId) return badRequest('Role id required');

  let profileId;
  try {
    profileId = await getProfileIdFromAuth(_request.headers);
    await assertCompanyMemberForRole(profileId, roleId);
  } catch (e) {
    const msg = e.message || 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg.startsWith('Forbidden') ? 403 : 401 });
  }

  // Collect related records to cascade-delete manually
  const { data: snapshots, error: snapListErr } = await supabaseAdmin
    .from('radar_snapshots')
    .select('id')
    .eq('subject_type', 'role')
    .eq('subject_id', roleId);
  if (snapListErr) return serverError(snapListErr.message);
  const snapshotIds = (snapshots || []).map((s) => s.id);

  const { data: threads, error: threadErr } = await supabaseAdmin
    .from('ai_threads')
    .select('id')
    .eq('role_id', roleId);
  if (threadErr) return serverError(threadErr.message);
  const threadIds = (threads || []).map((t) => t.id);

  // Delete radar scores/evidence then snapshots
  if (snapshotIds.length > 0) {
    const { error: scoreDelErr } = await supabaseAdmin
      .from('radar_scores')
      .delete()
      .in('snapshot_id', snapshotIds);
    if (scoreDelErr) return serverError(scoreDelErr.message);

    const { error: evidDelErr } = await supabaseAdmin
      .from('radar_evidence')
      .delete()
      .in('snapshot_id', snapshotIds);
    if (evidDelErr) return serverError(evidDelErr.message);

    const { error: snapDelErr } = await supabaseAdmin
      .from('radar_snapshots')
      .delete()
      .in('id', snapshotIds);
    if (snapDelErr) return serverError(snapDelErr.message);
  }

  // Delete AI messages then threads
  if (threadIds.length > 0) {
    const { error: msgDelErr } = await supabaseAdmin
      .from('ai_messages')
      .delete()
      .in('thread_id', threadIds);
    if (msgDelErr) return serverError(msgDelErr.message);

    const { error: threadDelErr } = await supabaseAdmin
      .from('ai_threads')
      .delete()
      .in('id', threadIds);
    if (threadDelErr) return serverError(threadDelErr.message);
  }

  // Delete answers
  const { error: ansDelErr } = await supabaseAdmin
    .from('role_answers')
    .delete()
    .eq('role_id', roleId);
  if (ansDelErr) return serverError(ansDelErr.message);

  // Finally delete the role
  const { error: roleDelErr } = await supabaseAdmin
    .from('roles')
    .delete()
    .eq('id', roleId);
  if (roleDelErr) return serverError(roleDelErr.message);

  return NextResponse.json({ ok: true, deleted: roleId });
}
