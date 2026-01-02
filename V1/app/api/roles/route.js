import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMember } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

export async function POST(request) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');

  let profileId;
  try {
    profileId = await getProfileIdFromAuth(request.headers);
  } catch (e) {
    return serverError(e.message);
  }

  const body = await request.json().catch(() => null);
  if (!body) return badRequest('Invalid JSON');

  const { company_id, title, division, location, work_mode, start_date, end_date, description, responsibilities, requirements, compensation_min, compensation_max } = body;
  if (!company_id || !title) return badRequest('company_id and title are required');

  try {
    await assertCompanyMember(profileId, company_id);
  } catch (e) {
    const msg = e.message || 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg.startsWith('Forbidden') ? 403 : 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('roles')
    .insert({
      company_id,
      title,
      division,
      location,
      work_mode,
      start_date,
      end_date,
      description,
      responsibilities,
      requirements,
      compensation_min,
      compensation_max,
      status: 'draft',
    })
    .select()
    .single();

  if (error) return serverError(error.message);
  return NextResponse.json({ role: data });
}

export async function GET(request) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');

  let profileId;
  try {
    profileId = await getProfileIdFromAuth(request.headers);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  const { data: memberships, error: memErr } = await supabaseAdmin
    .from('company_members')
    .select('company_id')
    .eq('profile_id', profileId);
  if (memErr) return serverError(memErr.message);
  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ roles: [], counts: {} });
  }

  const companyIds = memberships.map((m) => m.company_id);
  let query = supabaseAdmin
    .from('roles')
    .select('*')
    .in('company_id', companyIds)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data: roles, error } = await query;
  if (error) return serverError(error.message);

  const counts = roles.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ roles, counts });
}
