-- Additive only. Existing pages, projects and other tables remain intact.
create table if not exists public.studio_scenes (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 page_id uuid references public.pages(id) on delete set null,
 scene jsonb not null default '{"schemaVersion":1,"objects":[]}'::jsonb
   check (jsonb_typeof(scene)='object' and scene->>'schemaVersion'='1' and jsonb_typeof(scene->'objects')='array'),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.studio_timelines (
 id uuid primary key default gen_random_uuid(),
 scene_id uuid not null references public.studio_scenes(id) on delete cascade,
 timeline jsonb not null default '{"schemaVersion":1,"durationMs":0,"keyframes":[]}'::jsonb
   check (jsonb_typeof(timeline)='object' and timeline->>'schemaVersion'='1' and jsonb_typeof(timeline->'keyframes')='array'),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.studio_ai_prompts (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 page_id uuid references public.pages(id) on delete set null,
 created_by uuid not null default auth.uid() references auth.users(id),
 prompt text not null check (length(trim(prompt)) between 2 and 10000),
 proposal jsonb,
 status text not null default 'draft' check(status in ('draft','queued','proposed','approved','rejected','failed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists studio_scenes_project_idx on public.studio_scenes(project_id);
create index if not exists studio_timelines_scene_idx on public.studio_timelines(scene_id);
create index if not exists studio_ai_prompts_project_idx on public.studio_ai_prompts(project_id);
alter table public.studio_scenes enable row level security;
alter table public.studio_timelines enable row level security;
alter table public.studio_ai_prompts enable row level security;
grant select,insert,update on public.studio_scenes to authenticated;
grant select,insert,update on public.studio_timelines to authenticated;
grant select,insert,update on public.studio_ai_prompts to authenticated;
create policy "studio_scenes_owner_select" on public.studio_scenes for select to authenticated
 using (exists (select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
create policy "studio_scenes_owner_insert" on public.studio_scenes for insert to authenticated
 with check (exists (select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()))
 and (page_id is null or exists (select 1 from public.pages pg where pg.id=page_id and pg.project_id=project_id)));
create policy "studio_scenes_owner_update" on public.studio_scenes for update to authenticated
 using (exists (select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())))
 with check (exists (select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()))
 and (page_id is null or exists (select 1 from public.pages pg where pg.id=page_id and pg.project_id=project_id)));
create policy "studio_timelines_owner_select" on public.studio_timelines for select to authenticated
 using (exists (select 1 from public.studio_scenes s join public.projects p on p.id=s.project_id
 where s.id=scene_id and p.owner_id=(select auth.uid())));
create policy "studio_timelines_owner_insert" on public.studio_timelines for insert to authenticated
 with check (exists (select 1 from public.studio_scenes s join public.projects p on p.id=s.project_id
 where s.id=scene_id and p.owner_id=(select auth.uid())));
create policy "studio_timelines_owner_update" on public.studio_timelines for update to authenticated
 using (exists (select 1 from public.studio_scenes s join public.projects p on p.id=s.project_id
 where s.id=scene_id and p.owner_id=(select auth.uid())))
 with check (exists (select 1 from public.studio_scenes s join public.projects p on p.id=s.project_id
 where s.id=scene_id and p.owner_id=(select auth.uid())));
create policy "studio_ai_prompts_owner_select" on public.studio_ai_prompts for select to authenticated
 using (exists (select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
create policy "studio_ai_prompts_owner_insert" on public.studio_ai_prompts for insert to authenticated
 with check (created_by=(select auth.uid()) and exists (select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()))
 and (page_id is null or exists (select 1 from public.pages pg where pg.id=page_id and pg.project_id=project_id)));
create policy "studio_ai_prompts_owner_update" on public.studio_ai_prompts for update to authenticated
 using (created_by=(select auth.uid()) and exists (select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())))
 with check (created_by=(select auth.uid()) and exists (select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()))
 and (page_id is null or exists (select 1 from public.pages pg where pg.id=page_id and pg.project_id=project_id)));
