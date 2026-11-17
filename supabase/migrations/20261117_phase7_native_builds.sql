-- Phase 7: additive build queue + authenticated round-trip diagnostics
alter table public.build_jobs add column if not exists platform text not null default 'android' check(platform in ('android','ios'));
alter table public.build_jobs add column if not exists artifact_key text;
alter table public.build_jobs add column if not exists github_dispatch_at timestamptz;
create index if not exists build_jobs_project_created_idx on public.build_jobs(project_id,created_at desc);
grant select,insert on public.build_jobs to authenticated;
drop policy if exists build_jobs_owner_insert on public.build_jobs;
create policy build_jobs_owner_insert on public.build_jobs for insert to authenticated
with check (status='queued' and artifact_url is null and artifact_key is null and
exists (select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
create table if not exists public.studio_auth_checks(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 nonce uuid not null,
 created_at timestamptz not null default now()
);
alter table public.studio_auth_checks enable row level security;
grant select,insert,delete on public.studio_auth_checks to authenticated;
create policy studio_auth_check_read on public.studio_auth_checks for select to authenticated using (owner_id=(select auth.uid()));
create policy studio_auth_check_write on public.studio_auth_checks for insert to authenticated with check (owner_id=(select auth.uid()));
create policy studio_auth_check_delete on public.studio_auth_checks for delete to authenticated using (owner_id=(select auth.uid()));
