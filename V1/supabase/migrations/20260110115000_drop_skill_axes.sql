-- Remove legacy skill_axes table and legacy axis_id columns

-- radar_scores: drop legacy column and require axis_version_id
alter table radar_scores drop constraint if exists radar_scores_axis_ref_present;
alter table radar_scores drop column if exists axis_id;
alter table radar_scores alter column axis_version_id set not null;
-- ensure FK exists (created earlier)
alter table radar_scores drop constraint if exists radar_scores_axis_version_id_fkey;
alter table radar_scores add constraint radar_scores_axis_version_id_fkey foreign key (axis_version_id) references skill_axis_versions(id);

-- radar_evidence: drop legacy column and require axis_version_id
alter table radar_evidence drop constraint if exists radar_evidence_axis_ref_present;
alter table radar_evidence drop column if exists axis_id;
alter table radar_evidence alter column axis_version_id set not null;
alter table radar_evidence drop constraint if exists radar_evidence_axis_version_id_fkey;
alter table radar_evidence add constraint radar_evidence_axis_version_id_fkey foreign key (axis_version_id) references skill_axis_versions(id);

-- Drop legacy skill_axes table and its policy
drop policy if exists skill_axes_read on skill_axes;
drop table if exists skill_axes cascade;
