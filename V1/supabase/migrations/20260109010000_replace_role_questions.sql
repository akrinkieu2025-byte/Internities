-- Replace role_questions with Stage 0/1/2 questionnaire and add section metadata
-- NOTE: This truncates role_questions and role_answers (cascades) to reseed.

begin;

-- Create section metadata table if not present
create table if not exists role_question_sections (
  key text primary key,
  title text not null,
  description text not null,
  display_order int not null default 0
);

-- Seed sections with descriptions shown before each block
insert into role_question_sections (key, title, description, display_order) values
  ('role_description', 'Role Description', 'Describe what the role is, where it is based, timelines, and what the company does.', 1),
  ('hard_criteria', 'Hard Criteria', 'Eligibility gates that must be satisfied before a candidate is evaluated (e.g., enrollment, degree level, GPA, visa/work authorization, language).', 2),
  ('skills_requirements', 'Skills & Requirements', 'Questions that drive the skill radar and expectations for how the work is done.', 3)
  on conflict (key) do update set title = excluded.title, description = excluded.description, display_order = excluded.display_order;

-- Relax old section check and enforce FK to sections
alter table role_questions drop constraint if exists role_questions_section_check;
alter table role_questions drop constraint if exists role_questions_section_fkey;

-- Remove prior questions/answers
truncate table role_answers cascade;
truncate table role_questions cascade;

-- Enforce FK to sections
alter table role_questions add constraint role_questions_section_fkey foreign key (section) references role_question_sections(key);

-- Seed Stage 0: Role Description (public/context)
insert into role_questions (slug, prompt, visibility, section, answer_type, created_at) values
  ('role_title', 'Role title', 'public', 'role_description', 'text', now()),
  ('industry', 'Industry', 'public', 'role_description', 'select', now()),
  ('department_name', 'Department name', 'public', 'role_description', 'text', now()),
  ('office_location', 'Office Location', 'public', 'role_description', 'location', now()),
  ('workplace_type', 'Workplace Type', 'public', 'role_description', 'select', now()),
  ('internship_type', 'Type of Internship', 'public', 'role_description', 'multi_select', now()),
  ('start_date', 'Start Date', 'public', 'role_description', 'date', now()),
  ('duration_weeks', 'Duration (weeks)', 'public', 'role_description', 'number', now()),
  ('hours_per_week', 'Hours per Week', 'public', 'role_description', 'slider', now()),
  ('is_paid', 'Is the Internship paid?', 'public', 'role_description', 'yes_no', now()),
  ('company_overview', 'What does your company do?', 'public', 'role_description', 'text_short', now()),
  ('key_responsibilities', 'Key Responsibilities', 'public', 'role_description', 'bullet_builder', now()),
  ('learning_outcomes', 'Learning Outcomes', 'public', 'role_description', 'bullet_builder', now()),
  ('required_documents', 'Required Documents', 'public', 'role_description', 'multi_select_text', now()),
  ('application_deadline', 'Application Deadline', 'public', 'role_description', 'date', now()),
  ('public_min_requirements', 'Public minimum requirements', 'public', 'role_description', 'bullet_builder', now()),
  ('residency_requirements', 'Residency Requirements', 'public', 'role_description', 'multi_select', now()),
  ('right_to_work', 'Applicant must have the Right to work in ...', 'public', 'role_description', 'multi_select', now());

-- Seed Stage 1: Hard Criteria (eligibility gates)
insert into role_questions (slug, prompt, visibility, section, answer_type, created_at) values
  ('enrolled_currently', 'Must be currently enrolled in University', 'private', 'hard_criteria', 'yes_no', now()),
  ('degree_level', 'Degree Level Accepted', 'private', 'hard_criteria', 'select', now()),
  ('study_progress', 'Accepted progress of studies', 'private', 'hard_criteria', 'select', now()),
  ('fields_of_study', 'Fields of study accepted', 'private', 'hard_criteria', 'multi_select', now()),
  ('minimum_gpa', 'Minimum GPA to be further evaluated', 'private', 'hard_criteria', 'slider_percent', now()),
  ('academic_credit_required', 'Academic Credit Required?', 'private', 'hard_criteria', 'toggle', now()),
  ('language_requirements', 'Language Requirements', 'private', 'hard_criteria', 'multi_select', now());

-- Seed Stage 2: Skills & Requirements (radar-driving)
insert into role_questions (slug, prompt, visibility, section, answer_type, created_at) values
  ('primary_work_type', 'Primary Work type', 'private', 'skills_requirements', 'multi_select', now()),
  ('top_responsibilities', 'Top 5 Responsibilities', 'private', 'skills_requirements', 'derived', now()),
  ('work_structure', 'How structured is the work?', 'private', 'skills_requirements', 'slider_1_5', now()),
  ('expected_autonomy', 'Expected Autonomy', 'private', 'skills_requirements', 'slider_1_5', now()),
  ('stakeholder_exposure', 'Stakeholder exposure level', 'private', 'skills_requirements', 'select', now()),
  ('writing_presenting_intensity', 'Writing & Presenting Intensity', 'private', 'skills_requirements', 'slider_pair_1_5', now()),
  ('responsibility_level', 'Responsibility Level', 'private', 'skills_requirements', 'slider_1_5', now()),
  ('workplace_environment', 'Workplace Environment', 'private', 'skills_requirements', 'select', now()),
  ('analytical_thinking', 'Analytical Thinking', 'private', 'skills_requirements', 'slider_1_5', now()),
  ('creativity_level', 'Creativity Level', 'private', 'skills_requirements', 'slider_1_5', now()),
  ('communication_ability', 'Communication Ability', 'private', 'skills_requirements', 'slider_1_5', now()),
  ('industry_experience', 'Required Industry Experience', 'private', 'skills_requirements', 'select', now()),
  ('leadership_mindset', 'Leadership Mindset', 'private', 'skills_requirements', 'slider_1_5', now()),
  ('required_hard_skills', 'Required Hard Skills', 'private', 'skills_requirements', 'bullet_builder_weighted', now()),
  ('nice_to_have_hard_skills', 'Nice to have hard skills', 'private', 'skills_requirements', 'bullet_builder_weighted', now()),
  ('experience_with_tools', 'Experience with Tools', 'private', 'skills_requirements', 'bullet_builder_weighted', now()),
  ('success_definition', 'What does success look like?', 'private', 'skills_requirements', 'text', now()),
  ('top_succeeding_traits', 'Top 3 traits of succeeding interns', 'private', 'skills_requirements', 'bullet_builder', now()),
  ('top_failing_reasons', 'Top 3 "failing" reasons', 'private', 'skills_requirements', 'bullet_builder', now()),
  ('ideal_candidate_background', 'Ideal Candidate Background', 'private', 'skills_requirements', 'bullet_builder', now()),
  ('further_requirements', 'Further Requirements/Comments', 'private', 'skills_requirements', 'text', now());

commit;
