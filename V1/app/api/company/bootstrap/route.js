import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth } from '@/lib/apiAuth';

const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

function inferCompanyName(email) {
  if (!email) return 'My Company';
  const [, domain] = email.split('@');
  if (!domain) return 'My Company';
  const base = domain.split('.')[0];
  if (!base) return 'My Company';
  return `${base.charAt(0).toUpperCase()}${base.slice(1)} Co`;
}

export async function POST(request) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');

  let profileId;
  try {
    profileId = await getProfileIdFromAuth(request.headers);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
  }

  // Fetch profile for email and existing company
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('id', profileId)
    .single();
  if (profileError) return serverError(profileError.message);

  let company;
  const { data: existing, error: findError } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (findError) return serverError(findError.message);
  if (existing) {
    company = existing;
  } else {
    const name = inferCompanyName(profile?.email);
    const { data: created, error: createError } = await supabaseAdmin
      .from('companies')
      .insert({ name, profile_id: profileId })
      .select()
      .single();
    if (createError) return serverError(createError.message);
    company = created;
  }

  // Ensure membership as admin
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('company_members')
    .upsert({ company_id: company.id, profile_id: profileId, role: 'admin' }, { onConflict: 'company_id,profile_id' })
    .select()
    .single();
  if (memberError) return serverError(memberError.message);

  return NextResponse.json({ company, membership });
}
