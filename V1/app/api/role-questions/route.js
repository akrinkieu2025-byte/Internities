import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

const seeds = [
  { slug: 'title', prompt: 'Position title', visibility: 'public', section: 'public_basics', answer_type: 'text' },
  { slug: 'division', prompt: 'Division / function', visibility: 'public', section: 'public_basics', answer_type: 'text' },
  { slug: 'location', prompt: 'Location (remote/hybrid/on-site)', visibility: 'public', section: 'public_basics', answer_type: 'text' },
  { slug: 'dates', prompt: 'Start and end dates', visibility: 'public', section: 'public_basics', answer_type: 'text' },
  { slug: 'description', prompt: 'Short description', visibility: 'public', section: 'public_basics', answer_type: 'long_text' },
  { slug: 'responsibilities', prompt: 'Responsibilities (bullets)', visibility: 'public', section: 'public_basics', answer_type: 'long_text' },
  { slug: 'requirements', prompt: 'Requirements (bullets)', visibility: 'public', section: 'public_basics', answer_type: 'long_text' },
  { slug: 'comp_range', prompt: 'Optional compensation range', visibility: 'public', section: 'public_basics', answer_type: 'text' },
  { slug: 'work_on', prompt: 'What you will work on', visibility: 'public', section: 'public_q', answer_type: 'long_text' },
  { slug: 'success', prompt: 'What success looks like', visibility: 'public', section: 'public_q', answer_type: 'long_text' },
  { slug: 'team_style', prompt: 'Team style / culture (high-level)', visibility: 'public', section: 'public_q', answer_type: 'long_text' },
  { slug: 'min_gpa', prompt: 'Minimum GPA', visibility: 'private', section: 'private_q', answer_type: 'text' },
  { slug: 'target_universities', prompt: 'Target universities', visibility: 'private', section: 'private_q', answer_type: 'long_text' },
  { slug: 'visa', prompt: 'Visa eligibility', visibility: 'private', section: 'private_q', answer_type: 'text' },
  { slug: 'team_structure', prompt: 'Team structure details', visibility: 'private', section: 'private_q', answer_type: 'long_text' },
  { slug: 'interview_style', prompt: 'Interview style', visibility: 'private', section: 'private_q', answer_type: 'long_text' },
  { slug: 'must_have_nice_to_have', prompt: 'Must-have vs nice-to-have preferences', visibility: 'private', section: 'private_q', answer_type: 'long_text' },
  { slug: 'internal_notes', prompt: 'Other internal screening notes', visibility: 'private', section: 'private_q', answer_type: 'long_text' },
];

export async function GET() {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');

  const { data: existing, error: findErr } = await supabaseAdmin
    .from('role_questions')
    .select('*')
    .order('section', { ascending: true })
    .order('created_at', { ascending: true });
  if (findErr) return serverError(findErr.message);

  if (existing && existing.length > 0) {
    return NextResponse.json({ questions: existing });
  }

  const { error: seedErr } = await supabaseAdmin
    .from('role_questions')
    .upsert(seeds, { onConflict: 'slug' });
  if (seedErr) return serverError(seedErr.message);

  const { data: seeded, error: seededErr } = await supabaseAdmin
    .from('role_questions')
    .select('*')
    .order('section', { ascending: true })
    .order('created_at', { ascending: true });
  if (seededErr) return serverError(seededErr.message);

  return NextResponse.json({ questions: seeded });
}
