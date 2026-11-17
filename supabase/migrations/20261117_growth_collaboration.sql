-- Secure two-user collaboration with role-scoped project and private Realtime access.
create table if not exists public.project_collaborators(
 project_id uuid not null references public.projects(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'editor' check(role='editor'),
 joined_at timestamptz not null default now(),
 primary key(project_id,user_id)
);
create index if not exists project_collaborators_user_idx on public.project_collaborators(user_id);
alter table public.project_collaborators enable row level security;
grant select on public.project_collaborators to authenticated;
drop policy if exists project_collaborator_read on public.project_collaborators;
create policy project_collaborator_read on public.project_collaborators for select to authenticated
 using (user_id=(select auth.uid()) or exists(
  select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())
 ));
-- Keep the original owner policies intact.
drop policy if exists project_collaborator_project_read on public.projects;
create policy project_collaborator_project_read on public.projects for select to authenticated
 using (exists(select 1 from public.project_collaborators c where c.project_id=id and c.user_id=(select auth.uid()) and c.role='editor'));
drop policy if exists project_collaborator_page_read on public.pages;
create policy project_collaborator_page_read on public.pages for select to authenticated
 using (exists(select 1 from public.project_collaborators c where c.project_id=pages.project_id and c.user_id=(select auth.uid()) and c.role='editor'));
drop policy if exists project_collaborator_page_write on public.pages;
create policy project_collaborator_page_write on public.pages for update to authenticated
 using (exists(select 1 from public.project_collaborators c where c.project_id=pages.project_id and c.user_id=(select auth.uid()) and c.role='editor'))
 with check (exists(select 1 from public.project_collaborators c where c.project_id=pages.project_id and c.user_id=(select auth.uid()) and c.role='editor'));
create or replace function public.invite_project_collaborator(p_project_id uuid,p_email text)
returns uuid language plpgsql security definer set search_path='' as $$
declare target_id uuid;
begin
 if p_email is null or char_length(trim(p_email))>254 or char_length(trim(p_email))<5 then
  raise exception 'Invalid collaborator email';
 end if;
 if not exists(select 1 from public.projects p where p.id=p_project_id and p.owner_id=auth.uid() and p.archived_at is null)
 then raise exception 'Owner permission required'; end if;
 if (select count(*) from public.project_collaborators c where c.project_id=p_project_id)>=5
 then raise exception 'Maximum collaborators reached'; end if;
 select u.id into target_id from auth.users u where lower(u.email)=lower(trim(p_email)) limit 1;
 if target_id is null then raise exception 'This collaborator must register an account first'; end if;
 if target_id=auth.uid() then raise exception 'Owner already has access'; end if;
 insert into public.project_collaborators(project_id,user_id,role) values(p_project_id,target_id,'editor')
 on conflict(project_id,user_id) do nothing;
 return target_id;
end;
$$;
revoke all on function public.invite_project_collaborator(uuid,text) from public,anon,authenticated;
grant execute on function public.invite_project_collaborator(uuid,text) to authenticated;
-- All broadcast and presence traffic remains inside a private channel scoped to a page
-- whose project is accessible to the authenticated user.
drop policy if exists studio_collab_realtime_read on realtime.messages;
create policy studio_collab_realtime_read on realtime.messages for select to authenticated
 using (
  (select auth.uid()) is not null and private=true and topic like 'studio-page:%'
  and exists(select 1 from public.pages pg where pg.id::text=split_part(topic,':',2)
   and exists(select 1 from public.projects p where p.id=pg.project_id and p.archived_at is null
    and (p.owner_id=(select auth.uid()) or exists(
     select 1 from public.project_collaborators c where c.project_id=p.id and c.user_id=(select auth.uid()) and c.role='editor'
    ))
   )
  )
 );
drop policy if exists studio_collab_realtime_write on realtime.messages;
create policy studio_collab_realtime_write on realtime.messages for insert to authenticated
 with check (
  (select auth.uid()) is not null and private=true and topic like 'studio-page:%'
  and extension in ('broadcast','presence') and
  exists(select 1 from public.pages pg where pg.id::text=split_part(topic,':',2)
   and exists(select 1 from public.projects p where p.id=pg.project_id and p.archived_at is null
    and (p.owner_id=(select auth.uid()) or exists(
     select 1 from public.project_collaborators c where c.project_id=p.id and c.user_id=(select auth.uid()) and c.role='editor'
    ))
   )
  )
 );
