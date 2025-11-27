import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase admin client using the Service Role key.
// IMPORTANT: set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL in your deployment environment.
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, email, role } = body || {};

    if (!id || !email || !role) {
      return NextResponse.json({ error: 'Missing id, email or role' }, { status: 400 });
    }

    // Insert profile using admin privileges (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([{ id, email, role }])
      .select()
      .single();

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
