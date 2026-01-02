import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth } from '@/lib/apiAuth';

const BUCKET = 'company-logos-private';
const SIGNED_URL_TTL = 60 * 60; // seconds

const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

const isComplete = (company) => {
  if (!company) return false;
  const hasIndustry = Boolean(company.industry) && (company.industry !== 'Other' || company.industry_other);
  return Boolean(company.name) && hasIndustry && Boolean(company.logo_path);
};

async function findCompanyForProfile(profileId) {
  // First, look for membership
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('company_members')
    .select('company_id, companies!inner(id, name, industry, industry_other, logo_path, website, hq_location, created_at, updated_at)')
    .eq('profile_id', profileId)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw new Error(membershipError.message || 'Failed to load company');
  if (membership?.companies) return membership.companies;

  // Fallback: company owned by this profile
  const { data: owned, error: ownedError } = await supabaseAdmin
    .from('companies')
    .select('id, name, industry, industry_other, logo_path, website, hq_location, created_at, updated_at')
    .eq('profile_id', profileId)
    .limit(1)
    .maybeSingle();

  if (ownedError) throw new Error(ownedError.message || 'Failed to load owned company');
  return owned || null;
}

async function signLogoPath(path) {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) return null;
  return data?.signedUrl || null;
}

export async function GET(request) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');

  try {
    const profileId = await getProfileIdFromAuth(request.headers);
    const company = await findCompanyForProfile(profileId);

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const signedLogoUrl = await signLogoPath(company.logo_path);
    return NextResponse.json({ company, signedLogoUrl, isComplete: isComplete(company) });
  } catch (err) {
    const message = err?.message || 'Unexpected error';
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const profileId = await getProfileIdFromAuth(request.headers);
    const company = await findCompanyForProfile(profileId);
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const patch = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.industry !== undefined) patch.industry = body.industry;
    if (body.industry_other !== undefined) patch.industry_other = body.industry_other;
    if (body.website !== undefined) patch.website = body.website;
    if (body.hq_location !== undefined) patch.hq_location = body.hq_location;
    if (body.logo_path !== undefined) patch.logo_path = body.logo_path;

    if (Object.keys(patch).length === 0) {
      const signedLogoUrl = await signLogoPath(company.logo_path);
      return NextResponse.json({ company, signedLogoUrl });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('companies')
      .update(patch)
      .eq('id', company.id)
      .select('id, name, industry, industry_other, logo_path, website, hq_location, created_at, updated_at')
      .single();

    if (error) return serverError(error.message || 'Failed to update company');

    const signedLogoUrl = await signLogoPath(updated.logo_path);
    return NextResponse.json({ company: updated, signedLogoUrl, isComplete: isComplete(updated) });
  } catch (err) {
    const message = err?.message || 'Unexpected error';
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
