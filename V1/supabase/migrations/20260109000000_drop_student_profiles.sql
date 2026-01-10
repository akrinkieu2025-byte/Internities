-- Drop unused student_profiles table
-- Safe to rerun: IF EXISTS and CASCADE for dependent objects

drop table if exists student_profiles cascade;
