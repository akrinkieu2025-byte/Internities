import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

export async function POST(req, { params }) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');
  const roleId = params?.id;
  if (!roleId) return badRequest('Missing role id');

  let snapshotIds = [];
  try {
    const body = await req.json();
    snapshotIds = Array.isArray(body?.snapshot_ids) ? body.snapshot_ids.filter(Boolean) : [];
  } catch (_e) {
    return badRequest('Invalid body');
  }

  if (snapshotIds.length === 0) return badRequest('No snapshot ids provided');

  try {
    const profileId = await getProfileIdFromAuth(req.headers);
    await assertCompanyMemberForRole(profileId, roleId);
  } catch (e) {
    const msg = e.message || 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg.startsWith('Forbidden') ? 403 : 401 });
  }

  // Verify snapshots belong to the role and none are confirmed
  const { data: snapshots, error: fetchErr } = await supabaseAdmin
    .from('radar_snapshots')
    .select('id, status')
    .in('id', snapshotIds)
    .eq('subject_type', 'role')
    .eq('subject_id', roleId);

  if (fetchErr) return serverError(fetchErr.message);
  if (!snapshots || snapshots.length === 0) return badRequest('No matching snapshots found');

  const confirmed = snapshots.find((s) => s.status === 'confirmed');
  if (confirmed) return badRequest('Confirmed snapshot cannot be deleted');

  const idsToDelete = snapshots.map((s) => s.id);

  // Delete scores and evidence first, then snapshots
  const { error: scoreDelErr } = await supabaseAdmin
    .from('radar_scores')
    .delete()
    .in('snapshot_id', idsToDelete);
  if (scoreDelErr) return serverError(scoreDelErr.message);

  const { error: evidDelErr } = await supabaseAdmin
    .from('radar_evidence')
    .delete()
    .in('snapshot_id', idsToDelete);
  if (evidDelErr) return serverError(evidDelErr.message);

  const { error: snapDelErr } = await supabaseAdmin
    .from('radar_snapshots')
    .delete()
    .in('id', idsToDelete);
  if (snapDelErr) return serverError(snapDelErr.message);

  return NextResponse.json({ ok: true, deleted: idsToDelete });
}
