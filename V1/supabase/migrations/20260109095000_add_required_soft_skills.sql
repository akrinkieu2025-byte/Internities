-- Add required_soft_skills question
insert into role_questions (slug, prompt, visibility, section, answer_type, display_order, created_at)
values ('required_soft_skills', 'Required Soft Skills', 'private', 'skills_requirements', 'bullet_builder_weighted', 17, now())
on conflict (slug) do update set
  prompt = excluded.prompt,
  visibility = excluded.visibility,
  section = excluded.section,
  answer_type = excluded.answer_type,
  display_order = excluded.display_order;
