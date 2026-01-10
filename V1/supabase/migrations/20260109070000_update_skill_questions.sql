-- Update answer types per latest questionnaire spec
update role_questions
set answer_type = 'slider_percent'
where slug in (
  'writing_presenting_intensity',
  'responsibility_level',
  'analytical_thinking',
  'creativity_level',
  'communication_ability',
  'leadership_mindset'
);

update role_questions
set answer_type = 'select'
where slug in (
  'workplace_environment',
  'industry_experience'
);
