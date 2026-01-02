-- Add company profile fields and storage bucket for private logos

alter table companies
  add column if not exists industry text,
  add column if not exists industry_other text,
  add column if not exists logo_path text,
  add column if not exists website text,
  add column if not exists hq_location text,
  add column if not exists updated_at timestamptz default now();

-- Trigger to keep updated_at current
create or replace function set_companies_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_companies_updated_at'
  ) then
    create trigger set_companies_updated_at
    before update on companies
    for each row execute function set_companies_updated_at();
  end if;
end;
$$;

-- Private bucket for company logos
insert into storage.buckets (id, name, public)
values ('company-logos-private', 'company-logos-private', false)
on conflict (id) do nothing;
