-- === enums ===
create type role_status as enum ('draft','radar_draft','confirmed','published','archived');
create type role_question_visibility as enum ('public','private');
create type radar_subject_type as enum ('role','student');
create type radar_source as enum ('ai_initial','ai_chat','manual_edit');
create type radar_status as enum ('draft','confirmed');

-- === core tables ===
create table skill_axes (
  id uuid primary key default gen_random_uuid(),
  axis_key text unique not null check (axis_key ~ '^[a-z0-9_]+$'),
  display_name text not null,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- seed v1 axes
insert into skill_axes (axis_key, display_name, description) values
  ('analytical','Analytical','Ability to break down complex problems'),
  ('communication','Communication','Written & verbal clarity'),
  ('leadership','Leadership','Influence, mentoring, initiative'),
  ('execution','Execution','Ship reliably and on time'),
  ('creativity','Creativity','Original thinking, design sense'),
  ('technical','Technical','Coding / engineering depth'),
  ('commercial','Commercial','Market & business awareness'),
  ('ownership','Ownership','Accountability and follow-through'),
  ('domain','Domain Expertise','Industry/functional knowledge');

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  profile_id uuid references profiles(id) unique,
  created_at timestamptz default now()
);

create table company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  profile_id uuid not null references profiles(id),
  role text default 'member',
  created_at timestamptz default now(),
  unique (company_id, profile_id)
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  title text not null,
  division text,
  location text,
  work_mode text, -- remote/hybrid/on-site
  start_date date,
  end_date date,
  description text,
  responsibilities text[],
  requirements text[],
  compensation_min numeric,
  compensation_max numeric,
  public_notes jsonb default '{}'::jsonb,
  private_notes jsonb default '{}'::jsonb,
  status role_status not null default 'draft',
  created_at timestamptz default now(),
  posted_at timestamptz
);

create table role_questions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  prompt text not null,
  visibility role_question_visibility not null,
  section text not null check (section in ('public_basics','public_q','private_q')),
  answer_type text not null default 'text',
  created_at timestamptz default now()
);

create table role_answers (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id) on delete cascade,
  question_id uuid not null references role_questions(id),
  answer_value_int int,
  answer_text text,
  answer_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (role_id, question_id)
);

create table radar_snapshots (
  id uuid primary key default gen_random_uuid(),
  subject_type radar_subject_type not null,
  subject_id uuid not null,
  role_id uuid references roles(id),
  source radar_source not null,
  status radar_status not null default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  constraint role_snapshot_subject check (
    (subject_type = 'role' and role_id = subject_id)
    or (subject_type = 'student' and role_id is null)
  )
);

create table radar_scores (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references radar_snapshots(id) on delete cascade,
  axis_id uuid not null references skill_axes(id),
  score_0_100 numeric not null check (score_0_100 between 0 and 100),
  weight_0_1 numeric check (weight_0_1 between 0 and 1),
  min_required_0_100 numeric check (min_required_0_100 between 0 and 100),
  confidence_0_1 numeric check (confidence_0_1 between 0 and 1),
  reason text,
  unique (snapshot_id, axis_id)
);

create table radar_evidence (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references radar_snapshots(id) on delete cascade,
  axis_id uuid not null references skill_axes(id),
  evidence_text text not null,
  evidence_source text check (evidence_source in ('questionnaire','document','chat')),
  ref_id uuid,
  created_at timestamptz default now()
);

create table ai_threads (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id) on delete cascade,
  created_by uuid not null references profiles(id),
  created_at timestamptz default now()
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references ai_threads(id) on delete cascade,
  sender text not null check (sender in ('company','ai')),
  content jsonb not null,
  snapshot_id uuid references radar_snapshots(id),
  created_at timestamptz default now()
);

-- optional future student table
create table student_profiles (
  id uuid primary key references profiles(id),
  preferred_roles text[]
);

-- === public views for students ===
create view roles_public_view as
select
  r.id,
  r.title,
  r.division,
  r.location,
  r.work_mode,
  r.start_date,
  r.end_date,
  r.description,
  r.responsibilities,
  r.requirements,
  r.compensation_min,
  r.compensation_max,
  r.posted_at,
  c.name as company_name
from roles r
join companies c on c.id = r.company_id
where r.status = 'published';

create view role_public_answers_view as
select
  ra.role_id,
  rq.slug,
  rq.prompt,
  ra.answer_text,
  ra.answer_value_int,
  ra.answer_json
from role_answers ra
join role_questions rq on rq.id = ra.question_id
join roles r on r.id = ra.role_id
where rq.visibility = 'public' and r.status = 'published';

-- === seed role questions ===
insert into role_questions (slug, prompt, visibility, section, answer_type) values
  -- public basics
  ('title', 'Position title', 'public', 'public_basics', 'text'),
  ('division', 'Division / function', 'public', 'public_basics', 'text'),
  ('location', 'Location (remote/hybrid/on-site)', 'public', 'public_basics', 'text'),
  ('dates', 'Start and end dates', 'public', 'public_basics', 'text'),
  ('description', 'Short description', 'public', 'public_basics', 'long_text'),
  ('responsibilities', 'Responsibilities (bullets)', 'public', 'public_basics', 'long_text'),
  ('requirements', 'Requirements (bullets)', 'public', 'public_basics', 'long_text'),
  ('comp_range', 'Optional compensation range', 'public', 'public_basics', 'text'),
  -- public questions
  ('work_on', 'What you will work on', 'public', 'public_q', 'long_text'),
  ('success', 'What success looks like', 'public', 'public_q', 'long_text'),
  ('team_style', 'Team style / culture (high-level)', 'public', 'public_q', 'long_text'),
  -- private questions
  ('min_gpa', 'Minimum GPA', 'private', 'private_q', 'text'),
  ('target_universities', 'Target universities', 'private', 'private_q', 'long_text'),
  ('visa', 'Visa eligibility', 'private', 'private_q', 'text'),
  ('team_structure', 'Team structure details', 'private', 'private_q', 'long_text'),
  ('interview_style', 'Interview style', 'private', 'private_q', 'long_text'),
  ('must_have_nice_to_have', 'Must-have vs nice-to-have preferences', 'private', 'private_q', 'long_text'),
  ('internal_notes', 'Other internal screening notes', 'private', 'private_q', 'long_text');

-- === RLS enablement ===
alter table roles enable row level security;
alter table role_answers enable row level security;
alter table radar_snapshots enable row level security;
alter table radar_scores enable row level security;
alter table radar_evidence enable row level security;
alter table companies enable row level security;
alter table company_members enable row level security;
alter table ai_threads enable row level security;
alter table ai_messages enable row level security;
alter table skill_axes enable row level security;

-- === RLS policies ===
-- companies: owners/members manage their company
create policy companies_owner_manage on companies
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- company members table
create policy members_manage on company_members
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- roles
create policy roles_company_crud on roles
  for all using (exists (
    select 1 from company_members cm
    where cm.company_id = roles.company_id and cm.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from company_members cm
    where cm.company_id = roles.company_id and cm.profile_id = auth.uid()
  ));

-- role answers
create policy answers_company_crud on role_answers
  for all using (exists (
    select 1 from roles r
    join company_members cm on cm.company_id = r.company_id
    where r.id = role_answers.role_id and cm.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from roles r
    join company_members cm on cm.company_id = r.company_id
    where r.id = role_answers.role_id and cm.profile_id = auth.uid()
  ));

-- radar snapshots/scores/evidence (role scope)
create policy radar_company_crud on radar_snapshots
  for all using (
    subject_type = 'role' and exists (
      select 1 from roles r
      join company_members cm on cm.company_id = r.company_id
      where r.id = radar_snapshots.subject_id and cm.profile_id = auth.uid()
    )
  )
  with check (
    subject_type = 'role' and exists (
      select 1 from roles r
      join company_members cm on cm.company_id = r.company_id
      where r.id = radar_snapshots.subject_id and cm.profile_id = auth.uid()
    )
  );

create policy radar_scores_company_crud on radar_scores
  for all using (exists (
    select 1 from radar_snapshots rs
    join roles r on r.id = rs.subject_id
    join company_members cm on cm.company_id = r.company_id
    where rs.id = radar_scores.snapshot_id and cm.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from radar_snapshots rs
    join roles r on r.id = rs.subject_id
    join company_members cm on cm.company_id = r.company_id
    where rs.id = radar_scores.snapshot_id and cm.profile_id = auth.uid()
  ));

create policy radar_evidence_company_crud on radar_evidence
  for all using (exists (
    select 1 from radar_snapshots rs
    join roles r on r.id = rs.subject_id
    join company_members cm on cm.company_id = r.company_id
    where rs.id = radar_evidence.snapshot_id and cm.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from radar_snapshots rs
    join roles r on r.id = rs.subject_id
    join company_members cm on cm.company_id = r.company_id
    where rs.id = radar_evidence.snapshot_id and cm.profile_id = auth.uid()
  ));

-- AI threads/messages
create policy ai_threads_company_crud on ai_threads
  for all using (exists (
    select 1 from roles r
    join company_members cm on cm.company_id = r.company_id
    where r.id = ai_threads.role_id and cm.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from roles r
    join company_members cm on cm.company_id = r.company_id
    where r.id = ai_threads.role_id and cm.profile_id = auth.uid()
  ));

create policy ai_messages_company_crud on ai_messages
  for all using (exists (
    select 1 from ai_threads t
    join roles r on r.id = t.role_id
    join company_members cm on cm.company_id = r.company_id
    where t.id = ai_messages.thread_id and cm.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from ai_threads t
    join roles r on r.id = t.role_id
    join company_members cm on cm.company_id = r.company_id
    where t.id = ai_messages.thread_id and cm.profile_id = auth.uid()
  ));

-- skill_axes read-only to authenticated
create policy skill_axes_read on skill_axes for select using (auth.uid() is not null);

-- views: grant select to authenticated (students use these)
grant select on roles_public_view to authenticated;
grant select on role_public_answers_view to authenticated;

-- optional: revoke direct selects from base tables for authenticated if needed
-- revoke select on roles, role_answers, radar_snapshots, radar_scores, radar_evidence from authenticated;