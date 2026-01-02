import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

export async function POST(_req, { params }) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');
  const roleId = params?.id;
  if (!roleId) return badRequest('Missing role id');

  try {
    const profileId = await getProfileIdFromAuth(_req.headers);
    await assertCompanyMemberForRole(profileId, roleId);
  } catch (e) {
    const msg = e.message || 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg.startsWith('Forbidden') ? 403 : 401 });
  }

  const { data: snapshot, error: snapErr } = await supabaseAdmin
    .from('radar_snapshots')
    .select('id')
    .eq('subject_type', 'role')
    .eq('subject_id', roleId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapErr) return serverError(snapErr.message);
  if (!snapshot) return badRequest('No draft snapshot to confirm');

  const { error: updateErr } = await supabaseAdmin
    .from('radar_snapshots')
    .update({ status: 'confirmed' })
    .eq('id', snapshot.id);
  if (updateErr) return serverError(updateErr.message);

  // Unconfirm any previously confirmed snapshots for this role
  await supabaseAdmin
    .from('radar_snapshots')
    .update({ status: 'draft' })
    .eq('subject_type', 'role')
    .eq('subject_id', roleId)
    .eq('status', 'confirmed')
    .neq('id', snapshot.id);

  return NextResponse.json({ ok: true, confirmed_snapshot_id: snapshot.id });
}
