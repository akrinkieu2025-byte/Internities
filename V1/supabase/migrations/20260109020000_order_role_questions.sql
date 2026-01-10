-- Ensure questionnaire questions preserve CSV ordering using an explicit display_order
begin;

alter table role_questions add column if not exists display_order int not null default 0;

-- Stage 0 (role_description)
update role_questions set display_order = 1  where slug = 'role_title';
update role_questions set display_order = 2  where slug = 'industry';
update role_questions set display_order = 3  where slug = 'department_name';
update role_questions set display_order = 4  where slug = 'office_location';
update role_questions set display_order = 5  where slug = 'workplace_type';
update role_questions set display_order = 6  where slug = 'internship_type';
update role_questions set display_order = 7  where slug = 'start_date';
update role_questions set display_order = 8  where slug = 'duration_weeks';
update role_questions set display_order = 9  where slug = 'hours_per_week';
update role_questions set display_order = 10 where slug = 'is_paid';
update role_questions set display_order = 11 where slug = 'company_overview';
update role_questions set display_order = 12 where slug = 'key_responsibilities';
update role_questions set display_order = 13 where slug = 'learning_outcomes';
update role_questions set display_order = 14 where slug = 'required_documents';
update role_questions set display_order = 15 where slug = 'application_deadline';
update role_questions set display_order = 16 where slug = 'public_min_requirements';
update role_questions set display_order = 17 where slug = 'residency_requirements';
update role_questions set display_order = 18 where slug = 'right_to_work';

-- Stage 1 (hard_criteria)
update role_questions set display_order = 1 where slug = 'enrolled_currently';
update role_questions set display_order = 2 where slug = 'degree_level';
update role_questions set display_order = 3 where slug = 'study_progress';
update role_questions set display_order = 4 where slug = 'fields_of_study';
update role_questions set display_order = 5 where slug = 'minimum_gpa';
update role_questions set display_order = 6 where slug = 'academic_credit_required';
update role_questions set display_order = 7 where slug = 'language_requirements';

-- Stage 2 (skills_requirements)
update role_questions set display_order = 1  where slug = 'primary_work_type';
update role_questions set display_order = 2  where slug = 'top_responsibilities';
update role_questions set display_order = 3  where slug = 'work_structure';
update role_questions set display_order = 4  where slug = 'expected_autonomy';
update role_questions set display_order = 5  where slug = 'stakeholder_exposure';
update role_questions set display_order = 6  where slug = 'writing_presenting_intensity';
update role_questions set display_order = 7  where slug = 'responsibility_level';
update role_questions set display_order = 8  where slug = 'workplace_environment';
update role_questions set display_order = 9  where slug = 'analytical_thinking';
update role_questions set display_order = 10 where slug = 'creativity_level';
update role_questions set display_order = 11 where slug = 'communication_ability';
update role_questions set display_order = 12 where slug = 'industry_experience';
update role_questions set display_order = 13 where slug = 'leadership_mindset';
update role_questions set display_order = 14 where slug = 'required_hard_skills';
update role_questions set display_order = 15 where slug = 'nice_to_have_hard_skills';
update role_questions set display_order = 16 where slug = 'experience_with_tools';
update role_questions set display_order = 17 where slug = 'success_definition';
update role_questions set display_order = 18 where slug = 'top_succeeding_traits';
update role_questions set display_order = 19 where slug = 'top_failing_reasons';
update role_questions set display_order = 20 where slug = 'ideal_candidate_background';
update role_questions set display_order = 21 where slug = 'further_requirements';

-- Default any unassigned rows to the end
update role_questions set display_order = 999 where display_order = 0;
alter table role_questions alter column display_order set default 999;

commit;
