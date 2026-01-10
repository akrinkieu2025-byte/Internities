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

  const normalizeJson = (val) => {
    if (val === null || val === undefined) return null;
    try {
      return JSON.stringify(val);
    } catch (_e) {
      return String(val);
    }
  };

  const normalize = (arr) =>
    (arr || [])
      .map((a) => ({
        question_id: String(a.question_id || ''),
        answer_value_int: a.answer_value_int === null || a.answer_value_int === undefined ? null : Number(a.answer_value_int),
        answer_text: a.answer_text === null || a.answer_text === undefined ? null : String(a.answer_text).trim(),
        answer_json: normalizeJson(a.answer_json),
      }))
      .sort((a, b) => a.question_id.localeCompare(b.question_id));

  const incomingNormalized = normalize(answers);

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from('role_answers')
    .select('question_id, answer_value_int, answer_text, answer_json')
    .eq('role_id', roleId);
  if (existingErr) return serverError(existingErr.message);

  const existingNormalized = normalize(existing);

  const sameLength = incomingNormalized.length === existingNormalized.length;
  const sameContent =
    sameLength && JSON.stringify(incomingNormalized) === JSON.stringify(existingNormalized);

  if (sameContent) {
    return NextResponse.json({ ok: true, changed: false });
  }

  // TODO: validate auth user is member of company owning this role
  // answers format: [{ question_id, answer_value_int, answer_text, answer_json }]

  const payload = answers.map((a) => ({
    role_id: roleId,
    question_id: a.question_id,
    answer_value_int: a.answer_value_int === null || a.answer_value_int === undefined ? null : Number(a.answer_value_int),
    answer_text: a.answer_text === null || a.answer_text === undefined ? null : String(a.answer_text).trim(),
    answer_json: a.answer_json ?? null,
  }));

  const { error } = await supabaseAdmin.from('role_answers').upsert(payload, { onConflict: 'role_id,question_id' });
  if (error) return serverError(error.message);

  return NextResponse.json({ ok: true, changed: true });
}
