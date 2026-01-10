update role_questions 
set answer_type = 'slider_percent' 
where slug in ('work_structure', 'expected_autonomy');
