-- Migrate radar_scores to reference skill_axis_versions (new library)
-- Keeps legacy axis_id nullable for backward compatibility.

-- Allow legacy axis_id to be null and drop old FK
alter table radar_scores drop constraint if exists radar_scores_axis_id_fkey;
alter table radar_scores alter column axis_id drop not null;

-- New reference to skill_axis_versions
alter table radar_scores add column if not exists axis_version_id uuid references skill_axis_versions(id);

-- Backfill axis_version_id from legacy axis_id/axis_key
update radar_scores rs
set axis_version_id = (
  select sav.id
  from skill_axes sa
  join skill_axis_versions sav on sav.axis_key = sa.axis_key and sav.status = 'active'
  where sa.id = rs.axis_id
  order by sav.version desc
  limit 1
)
where rs.axis_id is not null
  and rs.axis_version_id is null;

-- Ensure at least one reference is present
alter table radar_scores add constraint radar_scores_axis_ref_present check (axis_id is not null or axis_version_id is not null);

-- Index for faster joins
create index if not exists radar_scores_axis_version_id_idx on radar_scores(axis_version_id);
