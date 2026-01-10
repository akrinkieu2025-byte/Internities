-- Ensure ordering: required_hard_skills (14), nice_to_have_hard_skills (15), required_soft_skills (16), experience_with_tools (17)
update role_questions set display_order = 14 where slug = 'required_hard_skills';
update role_questions set display_order = 15 where slug = 'nice_to_have_hard_skills';
update role_questions set display_order = 16 where slug = 'required_soft_skills';
update role_questions set display_order = 17 where slug = 'experience_with_tools';
