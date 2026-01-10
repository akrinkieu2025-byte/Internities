import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

export async function GET(request) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');
  const { searchParams } = new URL(request.url);
  const axisType = searchParams.get('axis_type');
  const roleFamily = searchParams.get('role_family');
  const locale = searchParams.get('locale') || 'en';
  const status = searchParams.get('status') || 'active';

  try {
    const query = supabaseAdmin
      .from('skill_axes_latest')
      .select('axis_version_id, axis_key, axis_type, role_families, synonyms, rubric, evidence_types, assessment_options, version, status, typical_roles, locale, display_name, definition, not_definition')
      .eq('status', status)
      .eq('locale', locale)
      .order('axis_key', { ascending: true });

    if (axisType) query.eq('axis_type', axisType);
    if (roleFamily) query.contains('role_families', [roleFamily]);

    const { data, error } = await query;
    if (error) return serverError(error.message);

    return NextResponse.json({ ok: true, axes: data || [] });
  } catch (e) {
    return serverError(e.message);
  }
}
