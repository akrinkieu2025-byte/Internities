import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth } from '@/lib/apiAuth';

const BUCKET = 'company-logos-private';
const SIGNED_URL_TTL = 60 * 60; // seconds

const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

async function findCompanyForProfile(profileId) {
  const { data: membership, error } = await supabaseAdmin
    .from('company_members')
    .select('company_id, companies!inner(id)')
    .eq('profile_id', profileId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message || 'Failed to load company');
  if (membership?.companies) return membership.companies;

  const { data: owned, error: ownedError } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('profile_id', profileId)
    .limit(1)
    .maybeSingle();

  if (ownedError) throw new Error(ownedError.message || 'Failed to load company');
  return owned || null;
}

async function signPath(path) {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) return null;
  return data?.signedUrl || null;
}

export async function POST(request) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');

  try {
    const profileId = await getProfileIdFromAuth(request.headers);
    const company = await findCompanyForProfile(profileId);
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG and JPEG are allowed' }, { status: 400 });
    }

    const maxSize = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File exceeds 2 MB limit' }, { status: 400 });
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const path = `${company.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) return serverError(uploadError.message || 'Failed to upload');

    const signedUrl = await signPath(path);

    return NextResponse.json({ path, signedUrl }, { status: 200 });
  } catch (err) {
    const message = err?.message || 'Unexpected error';
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
