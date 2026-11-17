-- Prevent an owner lookup in the collaborator policy from recursively querying projects RLS.
create or replace function public.is_project_owner(p_project_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.projects p where p.id=p_project_id and p.owner_id=(select auth.uid()))
$$;
revoke all on function public.is_project_owner(uuid) from public,anon,authenticated;
grant execute on function public.is_project_owner(uuid) to authenticated;
drop policy if exists project_collaborator_read on public.project_collaborators;
create policy project_collaborator_read on public.project_collaborators for select to authenticated
 using (user_id=(select auth.uid()) or (select public.is_project_owner(project_id)));
