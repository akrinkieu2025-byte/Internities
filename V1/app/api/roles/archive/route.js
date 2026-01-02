import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

export async function POST(request) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');

  let roleId;
  try {
    const body = await request.json();
    roleId = body?.role_id;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!roleId) return NextResponse.json({ error: 'role_id is required' }, { status: 400 });

  let profileId;
  try {
    profileId = await getProfileIdFromAuth(request.headers);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
  }

  try {
    await assertCompanyMemberForRole(profileId, roleId);
  } catch (e) {
    const msg = e.message || 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg.startsWith('Forbidden') ? 403 : 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('roles')
    .update({ status: 'archived' })
    .eq('id', roleId)
    .select()
    .maybeSingle();

  if (error) return serverError(error.message || 'Failed to archive role');
  return NextResponse.json({ role: data });
}
