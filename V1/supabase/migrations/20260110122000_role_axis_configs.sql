-- Role axis configs store company requirements per axis version

create table role_axis_configs (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id) on delete cascade,
  axis_version_id uuid not null references skill_axis_versions(id),
  weight_0_5 numeric not null default 1 check (weight_0_5 >= 0 and weight_0_5 <= 5),
  must_have boolean not null default false,
  min_required_0_100 numeric check (min_required_0_100 >= 0 and min_required_0_100 <= 100),
  rationale text,
  version_tag text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (role_id, axis_version_id)
);

create index if not exists role_axis_configs_role_id_idx on role_axis_configs(role_id);
create index if not exists role_axis_configs_axis_version_id_idx on role_axis_configs(axis_version_id);
