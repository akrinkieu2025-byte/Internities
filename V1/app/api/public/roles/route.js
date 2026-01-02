import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });

  const { data, error } = await supabaseAdmin.from('roles_public_view').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roles: data });
}
