import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMember } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });
const MAX_AXES = 10;

async function getActiveAxes() {
  const { data, error } = await supabaseAdmin
    .from('skill_axes_latest')
    .select('axis_version_id, axis_key')
    .order('axis_key', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({ id: row.axis_version_id, axis_key: row.axis_key }));
}

function buildHeuristicRadar(respMap, activeAxes) {
  const textValues = Object.values(respMap || {}).filter(Boolean).join(' ');
  const charCount = textValues.length;
  const scoreBonus = Math.min(40, Math.floor(charCount / 80)); // more text -> slightly higher score, capped
  const baseScore = 55 + scoreBonus;

  const axesFromDb = (activeAxes || []).slice(0, MAX_AXES).map((a) => a.axis_key);
  const fallbackAxes = [
    'analytical',
    'communication',
    'leadership',
    'execution',
    'creativity',
    'technical',
    'commercial',
    'ownership',
    'domain',
  ];
  const axes = axesFromDb.length > 0 ? axesFromDb.slice(0, 10) : fallbackAxes;

  return axes.map((axis_key) => ({
    axis_key,
    score_0_100: Math.max(30, Math.min(100, baseScore)),
    confidence_0_1: 0.55,
    reason: 'Auto-generated from questionnaire responses (heuristic placeholder)',
  }));
}

async function insertRadarDraft({ roleId, profileId, radar }) {
  const axes = (await getActiveAxes()).slice(0, MAX_AXES);
  if (axes.length === 0) return null;

  const axisMap = new Map(axes.map((a) => [a.axis_key, a.id]));

  const { data: snapshot, error: snapErr } = await supabaseAdmin
    .from('radar_snapshots')
    .insert({
      subject_type: 'role',
      subject_id: roleId,
      role_id: roleId,
      source: 'ai_initial',
      status: 'draft',
      created_by: profileId,
    })
    .select('id')
    .single();
  if (snapErr) throw new Error(snapErr.message);

  const rows = (radar || []).map((item) => {
    const axisId = axisMap.get(item.axis_key);
    if (!axisId) throw new Error(`Unknown axis_key: ${item.axis_key}`);
    return {
      snapshot_id: snapshot.id,
      axis_version_id: axisId,
      score_0_100: item.score_0_100,
      weight_0_1: item.weight_0_5 === undefined ? item.weight_0_1 ?? null : item.weight_0_5 / 5,
      min_required_0_100: item.min_required_0_100 ?? null,
      confidence_0_1: item.confidence_0_1 ?? null,
      reason: item.reason ?? null,
    };
  });

  if (rows.length > 0) {
    const { error: scoresErr } = await supabaseAdmin.from('radar_scores').insert(rows);
    if (scoresErr) throw new Error(scoresErr.message);
  }
  return snapshot.id;
}

function toList(val) {
  if (!val) return null;
  return String(val)
    .split(/\n|,/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseYesNo(val) {
  if (typeof val !== 'string') return null;
  const v = val.trim().toLowerCase();
  if (v === 'yes' || v === 'y' || v === 'true') return true;
  if (v === 'no' || v === 'n' || v === 'false') return false;
  return null;
}

function parseDateRange(val) {
  if (!val) return { start_date: null, end_date: null };
  if (typeof val === 'object') {
    const { start, end } = val;
    return parseDateRange(`${start || ''} to ${end || ''}`);
  }
  if (typeof val !== 'string') return { start_date: null, end_date: null };
  const parts = val.split(/\s+to\s+/i).map((p) => p.trim());
  const [startRaw, endRaw] = parts;
  const toISODate = (s) => {
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };
  return { start_date: toISODate(startRaw), end_date: toISODate(endRaw) };
}

export async function POST(request) {
  if (!supabaseAdmin) return serverError('Supabase admin not configured');

  let profileId;
  try {
    profileId = await getProfileIdFromAuth(request.headers);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return badRequest('Invalid JSON');

  const { company_id: inputCompanyId, responses } = body;
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return badRequest('responses array is required');
  }

  // Determine company_id
  let companyId = inputCompanyId;
  if (companyId) {
    try {
      await assertCompanyMember(profileId, companyId);
    } catch (e) {
      const msg = e.message || 'Unauthorized';
      return NextResponse.json({ error: msg }, { status: msg.startsWith('Forbidden') ? 403 : 401 });
    }
  } else {
    const { data: memberships, error: memErr } = await supabaseAdmin
      .from('company_members')
      .select('company_id')
      .eq('profile_id', profileId);
    if (memErr) return serverError(memErr.message);
    if (!memberships || memberships.length === 0) return badRequest('No company membership found');
    companyId = memberships[0].company_id;
  }

  const slugs = responses.map((r) => r.slug).filter(Boolean);
  if (slugs.length === 0) return badRequest('responses.slug is required');

  const { data: questions, error: qErr } = await supabaseAdmin
    .from('role_questions')
    .select('*')
    .in('slug', slugs);
  if (qErr) return serverError(qErr.message);

  const respMap = responses.reduce((acc, r) => {
    acc[r.slug] = r.value ?? '';
    return acc;
  }, {});

  const { start_date, end_date } = parseDateRange(respMap.start_date || respMap.dates);

  // Map Stage 0 fields to role record + notes
  const responsibilities = toList(respMap.key_responsibilities);
  const requirements = toList(respMap.learning_outcomes);

  const publicNotes = {
    industry: respMap.industry || null,
    internship_type: respMap.internship_type || null,
    public_min_requirements: toList(respMap.public_min_requirements),
    residency_requirements: toList(respMap.residency_requirements),
    right_to_work: toList(respMap.right_to_work),
    required_documents: toList(respMap.required_documents),
    is_paid: parseYesNo(respMap.is_paid),
  };

  const hardCriteria = {
    enrolled_currently: parseYesNo(respMap.enrolled_currently),
    degree_level: respMap.degree_level || null,
    study_progress: respMap.study_progress || null,
    fields_of_study: toList(respMap.fields_of_study),
    minimum_gpa: respMap.minimum_gpa || null,
    academic_credit_required: parseYesNo(respMap.academic_credit_required),
    language_requirements: toList(respMap.language_requirements),
  };

  const skillsRequirements = {
    top_responsibilities: responsibilities,
    work_structure: respMap.work_structure || null,
    expected_autonomy: respMap.expected_autonomy || null,
    stakeholder_exposure: respMap.stakeholder_exposure || null,
    writing_presenting_intensity: respMap.writing_presenting_intensity || null,
    responsibility_level: respMap.responsibility_level || null,
    workplace_environment: respMap.workplace_environment || null,
    analytical_thinking: respMap.analytical_thinking || null,
    creativity_level: respMap.creativity_level || null,
    communication_ability: respMap.communication_ability || null,
    industry_experience: respMap.industry_experience || null,
    leadership_mindset: respMap.leadership_mindset || null,
    required_hard_skills: toList(respMap.required_hard_skills),
    nice_to_have_hard_skills: toList(respMap.nice_to_have_hard_skills),
    required_soft_skills: toList(respMap.required_soft_skills),
    experience_with_tools: toList(respMap.experience_with_tools),
    success_definition: respMap.success_definition || null,
    top_succeeding_traits: toList(respMap.top_succeeding_traits),
    top_failing_reasons: toList(respMap.top_failing_reasons),
    ideal_candidate_background: toList(respMap.ideal_candidate_background),
    further_requirements: respMap.further_requirements || null,
  };

  const privateNotes = {
    duration_weeks: respMap.duration_weeks || null,
    hours_per_week: respMap.hours_per_week || null,
    application_deadline: respMap.application_deadline || null,
    hard_criteria: hardCriteria,
    skills_requirements: skillsRequirements,
  };

  const rolePayload = {
    company_id: companyId,
    title: respMap.role_title || respMap.title || 'Untitled role',
    division: respMap.department_name || respMap.division || null,
    location: respMap.office_location || respMap.location || null,
    work_mode: respMap.workplace_type || respMap.work_mode || null,
    description: respMap.company_overview || respMap.description || null,
    responsibilities,
    requirements,
    start_date,
    end_date,
    public_notes: publicNotes,
    private_notes: privateNotes,
    status: 'draft',
  };

  const { data: role, error: roleErr } = await supabaseAdmin
    .from('roles')
    .insert(rolePayload)
    .select()
    .single();
  if (roleErr) return serverError(roleErr.message);

  const answerRows = questions
    .map((q) => {
      const value = respMap[q.slug];
      if (value === undefined || value === null) return null;
      return {
        role_id: role.id,
        question_id: q.id,
        answer_text: String(value),
      };
    })
    .filter(Boolean);

  if (answerRows.length > 0) {
    const { error: ansErr } = await supabaseAdmin.from('role_answers').upsert(answerRows, {
      onConflict: 'role_id,question_id',
    });
    if (ansErr) return serverError(ansErr.message);
  }

  // Create an initial radar draft with heuristic scores so the role detail has something to show
  try {
    const activeAxes = await getActiveAxes();
    const radar = buildHeuristicRadar(respMap, activeAxes);
    await insertRadarDraft({ roleId: role.id, profileId, radar });
  } catch (e) {
    console.warn('radar draft generation failed', e.message);
  }

  return NextResponse.json({ role, answers_written: answerRows.length });
}
