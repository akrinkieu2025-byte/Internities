update role_questions 
set answer_type = 'slider_pair_percent' 
where slug = 'writing_presenting_intensity';

update role_questions 
set answer_type = 'slider_percent' 
where slug in (
  'responsibility_level',
  'analytical_thinking',
  'creativity_level',
  'communication_ability',
  'leadership_mindset'
);

update role_questions 
set answer_type = 'select' 
where slug in ('workplace_environment', 'industry_experience');

update role_questions 
set answer_type = 'bullet_weighted' 
where slug in (
  'required_hard_skills',
  'nice_to_have_hard_skills',
  'experience_with_tools'
);

update role_questions 
set answer_type = 'bullet_3' 
where slug in (
  'top_succeeding_traits',
  'top_failing_reasons'
);

update role_questions 
set answer_type = 'text_example' 
where slug = 'success_definition';
