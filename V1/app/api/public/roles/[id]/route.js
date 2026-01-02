import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(_req, { params }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
  const id = params?.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: role, error: roleError } = await supabase
    .from('roles_public_view')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 });
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: answers, error: ansError } = await supabase
    .from('role_public_answers_view')
    .select('*')
    .eq('role_id', id);
  if (ansError) return NextResponse.json({ error: ansError.message }, { status: 500 });

  return NextResponse.json({ role, answers });
}
