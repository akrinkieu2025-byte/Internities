import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  if (!supabase) return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

  const { data, error } = await supabase.from('roles_public_view').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roles: data });
}
