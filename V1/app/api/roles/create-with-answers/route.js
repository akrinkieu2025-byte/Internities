import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getProfileIdFromAuth, assertCompanyMember } from '@/lib/apiAuth';

const badRequest = (msg) => NextResponse.json({ error: msg }, { status: 400 });
const serverError = (msg) => NextResponse.json({ error: msg }, { status: 500 });

async function getActiveAxes() {
  const { data, error } = await supabaseAdmin
    .from('skill_axes')
    .select('id, axis_key')
    .eq('is_active', true);
  if (error) throw new Error(error.message);
  return data || [];
}

function buildHeuristicRadar(respMap) {
  const textValues = Object.values(respMap || {}).filter(Boolean).join(' ');
  const charCount = textValues.length;
  const scoreBonus = Math.min(40, Math.floor(charCount / 80)); // more text -> slightly higher score, capped
  const baseScore = 55 + scoreBonus;

  const axes = [
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

  return axes.map((axis_key) => ({
    axis_key,
    score_0_100: Math.max(30, Math.min(100, baseScore)),
    confidence_0_1: 0.55,
    reason: 'Auto-generated from questionnaire responses (heuristic placeholder)',
  }));
}

async function insertRadarDraft({ roleId, profileId, radar }) {
  const axes = await getActiveAxes();
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
      axis_id: axisId,
      score_0_100: item.score_0_100,
      weight_0_1: item.weight_0_1 ?? null,
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
  return val
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
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

  const { start_date, end_date } = parseDateRange(respMap.dates);

  const rolePayload = {
    company_id: companyId,
    title: respMap.title || 'Untitled role',
    division: respMap.division || null,
    location: respMap.location || null,
    work_mode: respMap.location || null,
    description: respMap.description || null,
    responsibilities: toList(respMap.responsibilities),
    requirements: toList(respMap.requirements),
    start_date,
    end_date,
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
    const radar = buildHeuristicRadar(respMap);
    await insertRadarDraft({ roleId: role.id, profileId, radar });
  } catch (e) {
    console.warn('radar draft generation failed', e.message);
  }

  return NextResponse.json({ role, answers_written: answerRows.length });
}
