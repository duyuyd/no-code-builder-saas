-- Additive 2D Game Builder data model. No existing projects or pages are modified.
create table if not exists public.game_projects(
 project_id uuid primary key references public.projects(id) on delete cascade,
 scene jsonb not null check(jsonb_typeof(scene)='object'),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.game_publications(
 project_id uuid primary key references public.projects(id) on delete cascade,
 scene jsonb not null check(jsonb_typeof(scene)='object'),
 title text not null check(length(btrim(title)) between 1 and 120),
 is_live boolean not null default true,
 published_at timestamptz not null default now()
);
create or replace function public.increment_game_version()
returns trigger language plpgsql security invoker set search_path='' as $$
begin new.version=old.version+1;new.updated_at=now();return new;end;$$;
revoke all on function public.increment_game_version() from public,anon,authenticated;
drop trigger if exists game_project_version on public.game_projects;
create trigger game_project_version before update on public.game_projects
 for each row execute function public.increment_game_version();

alter table public.game_projects enable row level security;
revoke all on public.game_projects from anon,authenticated;
grant select,insert,update on public.game_projects to authenticated;
drop policy if exists owner_game_read on public.game_projects;
create policy owner_game_read on public.game_projects for select to authenticated
 using(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()) and p.kind='game'));
drop policy if exists owner_game_insert on public.game_projects;
create policy owner_game_insert on public.game_projects for insert to authenticated
 with check(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()) and p.kind='game' and p.archived_at is null));
drop policy if exists owner_game_update on public.game_projects;
create policy owner_game_update on public.game_projects for update to authenticated
 using(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()) and p.kind='game' and p.archived_at is null))
 with check(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()) and p.kind='game' and p.archived_at is null));

alter table public.game_publications enable row level security;
revoke all on public.game_publications from anon,authenticated;
grant select on public.game_publications to anon,authenticated;
grant insert,update on public.game_publications to authenticated;
drop policy if exists public_live_games on public.game_publications;
create policy public_live_games on public.game_publications for select to anon,authenticated using(is_live);
drop policy if exists owner_game_publications_read on public.game_publications;
create policy owner_game_publications_read on public.game_publications for select to authenticated
 using(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
drop policy if exists owner_game_publications_insert on public.game_publications;
create policy owner_game_publications_insert on public.game_publications for insert to authenticated
 with check(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()) and p.kind='game' and p.archived_at is null));
drop policy if exists owner_game_publications_update on public.game_publications;
create policy owner_game_publications_update on public.game_publications for update to authenticated
 using(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()) and p.kind='game' and p.archived_at is null))
 with check(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()) and p.kind='game' and p.archived_at is null));

-- Archetypes are editable through platform_settings by a trusted Admin.
insert into public.platform_settings(key,value)
values ('game_starter_scene','{
"title":"Thử thách thu thập sao",
"background":"#0f172a",
"player":{"x":10,"y":50,"emoji":"🚀","speed":2},
"objects":[
{"id":"star-a","kind":"coin","x":24,"y":25,"w":7,"h":10,"label":"⭐"},
{"id":"star-b","kind":"coin","x":48,"y":70,"w":7,"h":10,"label":"⭐"},
{"id":"star-c","kind":"coin","x":78,"y":28,"w":7,"h":10,"label":"⭐"},
{"id":"barrier-a","kind":"wall","x":34,"y":48,"w":9,"h":26,"label":"🧱"},
{"id":"barrier-b","kind":"wall","x":66,"y":42,"w":9,"h":26,"label":"🧱"},
{"id":"exit","kind":"goal","x":89,"y":77,"w":9,"h":13,"label":"🏁"}
]}'::jsonb)
on conflict(key) do nothing;

-- Prevent archived games from being republished via stale editor tabs.
create or replace function public.prevent_archived_game_publication()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.is_live and exists(select 1 from public.projects p where p.id=new.project_id and p.archived_at is not null) then
   raise exception 'Cannot publish an archived project';
 end if;
 return new;
end;$$;
revoke all on function public.prevent_archived_game_publication() from public,anon,authenticated;
drop trigger if exists game_pub_archive_guard on public.game_publications;
create trigger game_pub_archive_guard before insert or update on public.game_publications
 for each row execute function public.prevent_archived_game_publication();
