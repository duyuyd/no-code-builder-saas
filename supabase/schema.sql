-- Run in Supabase SQL Editor for a new project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  constraint platform_setting_key_nonempty check (length(trim(key)) > 0)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  path text not null default '/' check (path ~ '^/[^?#]*$'),
  ui_tree jsonb not null default '[]'::jsonb check (jsonb_typeof(ui_tree) = 'array'),
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);

-- Future asynchronous build queue. No worker is claimed to be deployed.
create table if not exists public.build_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  artifact_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_pages_project on public.pages(project_id);
create index if not exists idx_build_jobs_project on public.build_jobs(project_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.increment_page_version()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.version = old.version + 1;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.platform_settings;
create trigger settings_touch before update on public.platform_settings
for each row execute function public.touch_updated_at();

drop trigger if exists pages_version on public.pages;
create trigger pages_version before update on public.pages
for each row execute function public.increment_page_version();

drop trigger if exists jobs_touch on public.build_jobs;
create trigger jobs_touch before update on public.build_jobs
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.platform_settings enable row level security;
alter table public.projects enable row level security;
alter table public.pages enable row level security;
alter table public.build_jobs enable row level security;

-- Explicit grants; users may edit their display name but cannot self-promote roles.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

grant select on public.platform_settings to anon, authenticated;
grant insert, update, delete on public.platform_settings to authenticated;

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.pages to authenticated;
grant select on public.build_jobs to authenticated;

create policy "profile_read" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profile_edit_display_name" on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "settings_read" on public.platform_settings for select to anon, authenticated
using (true);
create policy "settings_insert_admin" on public.platform_settings for insert to authenticated
with check ((select public.is_admin()));
create policy "settings_update_admin" on public.platform_settings for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "settings_delete_admin" on public.platform_settings for delete to authenticated
using ((select public.is_admin()));

create policy "project_read" on public.projects for select to authenticated
using (owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "project_create" on public.projects for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy "project_edit" on public.projects for update to authenticated
using (owner_id = (select auth.uid()) or (select public.is_admin()))
with check (owner_id = (select auth.uid()) or (select public.is_admin()));
create policy "project_delete" on public.projects for delete to authenticated
using (owner_id = (select auth.uid()) or (select public.is_admin()));

create policy "page_read" on public.pages for select to authenticated
using (exists (
  select 1 from public.projects p where p.id = project_id
    and (p.owner_id = (select auth.uid()) or (select public.is_admin()))
));
create policy "page_create" on public.pages for insert to authenticated
with check (exists (
  select 1 from public.projects p where p.id = project_id
    and p.owner_id = (select auth.uid())
));
create policy "page_edit" on public.pages for update to authenticated
using (exists (
  select 1 from public.projects p where p.id = project_id
    and (p.owner_id = (select auth.uid()) or (select public.is_admin()))
))
with check (exists (
  select 1 from public.projects p where p.id = project_id
    and (p.owner_id = (select auth.uid()) or (select public.is_admin()))
));
create policy "page_delete" on public.pages for delete to authenticated
using (exists (
  select 1 from public.projects p where p.id = project_id
    and (p.owner_id = (select auth.uid()) or (select public.is_admin()))
));

create policy "job_read" on public.build_jobs for select to authenticated
using (exists (
  select 1 from public.projects p where p.id = project_id
    and (p.owner_id = (select auth.uid()) or (select public.is_admin()))
));

-- Only deployer-defined initial configuration; runtime application reads from DB.
insert into public.platform_settings (key, value)
values
  ('site_title', '"No-Code Builder SaaS"'::jsonb),
  ('primary_color', '"#ea580c"'::jsonb)
on conflict (key) do nothing;

-- After signing up, set YOUR actual account to admin once in SQL Editor:
-- update public.profiles set role='admin'
-- where id=(select id from auth.users where email='YOUR_EMAIL' limit 1);
