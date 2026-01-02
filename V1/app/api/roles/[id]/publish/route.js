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

  const { data: confirmed, error: confErr } = await supabaseAdmin
    .from('radar_snapshots')
    .select('id')
    .eq('subject_type', 'role')
    .eq('subject_id', roleId)
    .eq('status', 'confirmed')
    .limit(1)
    .maybeSingle();
  if (confErr) return serverError(confErr.message);
  if (!confirmed) return badRequest('No confirmed radar snapshot found');

  const { error: updErr } = await supabaseAdmin
    .from('roles')
    .update({ status: 'published', posted_at: new Date().toISOString() })
    .eq('id', roleId);
  if (updErr) return serverError(updErr.message);

  return NextResponse.json({ ok: true, published: roleId });
}
