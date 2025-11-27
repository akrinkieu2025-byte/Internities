import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create the admin client lazily to avoid throwing at module import time
// when environment variables are not configured (which would break builds).
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, email, role } = body || {};

    if (!id || !email || !role) {
      return NextResponse.json({ error: 'Missing id, email or role' }, { status: 400 });
    }

    // Insert profile using admin privileges (bypasses RLS)
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error('[api/profiles] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin.from('profiles').insert([{ id, email, role }]).select().single();

    if (error) {
      console.error('[api/profiles] insert error:', error);
      return NextResponse.json({ error: error.message || 'Failed to insert profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: data }, { status: 200 });
  } catch (err) {
    console.error('[api/profiles] unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
