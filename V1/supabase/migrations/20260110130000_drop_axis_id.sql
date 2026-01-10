-- Drop legacy axis_id column from radar_scores now that axis_version_id is used everywhere
alter table if exists radar_scores drop column if exists axis_id;
