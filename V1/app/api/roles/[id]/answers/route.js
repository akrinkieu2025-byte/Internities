import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMemberForRole } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

export async function POST(_req, { params }) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');
  const roleId = params?.id;
  if (!roleId) return badRequest('Missing role id');

  let profileId;
  try {
    profileId = await getProfileIdFromAuth(_req.headers);
    await assertCompanyMemberForRole(profileId, roleId);
  } catch (e) {
    const msg = e.message || 'Unauthorized';
    return NextResponse.json({ error: msg }, { status: msg.startsWith('Forbidden') ? 403 : 401 });
  }

  let body;
  try {
    body = await _req.json();
  } catch (e) {
    return badRequest('Invalid JSON');
  }

  const answers = Array.isArray(body?.answers) ? body.answers : [];
  if (!answers.length) return badRequest('answers array required');

  // TODO: validate auth user is member of company owning this role
  // answers format: [{ question_id, answer_value_int, answer_text, answer_json }]

  const payload = answers.map((a) => ({
    role_id: roleId,
    question_id: a.question_id,
    answer_value_int: a.answer_value_int ?? null,
    answer_text: a.answer_text ?? null,
    answer_json: a.answer_json ?? null,
  }));

  const { error } = await supabaseAdmin.from('role_answers').upsert(payload, { onConflict: 'role_id,question_id' });
  if (error) return serverError(error.message);

  return NextResponse.json({ ok: true });
}
