-- Migrate radar_evidence to reference skill_axis_versions (new axis library)
-- Keeps legacy axis_id nullable for backward compatibility.

alter table radar_evidence drop constraint if exists radar_evidence_axis_id_fkey;
alter table radar_evidence alter column axis_id drop not null;

alter table radar_evidence add column if not exists axis_version_id uuid references skill_axis_versions(id);

update radar_evidence re
set axis_version_id = (
  select sav.id
  from skill_axes sa
  join skill_axis_versions sav on sav.axis_key = sa.axis_key and sav.status = 'active'
  where sa.id = re.axis_id
  order by sav.version desc
  limit 1
)
where re.axis_id is not null
  and re.axis_version_id is null;

alter table radar_evidence add constraint radar_evidence_axis_ref_present check (axis_id is not null or axis_version_id is not null);

create index if not exists radar_evidence_axis_version_id_idx on radar_evidence(axis_version_id);
