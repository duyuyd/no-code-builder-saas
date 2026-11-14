CREATE OR REPLACE FUNCTION public.manage_project_lifecycle(p_project_id uuid, p_operation text, p_confirmation text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_owner uuid;v_name text;v_archived timestamptz;v_action text;
begin
 if (select auth.uid()) is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select p.owner_id,p.name,p.archived_at into v_owner,v_name,v_archived
 from public.projects p where p.id=p_project_id for update;
 if not found then raise exception 'Project not found' using errcode='P0002'; end if;
 if v_owner is distinct from (select auth.uid()) and not (select public.is_admin()) then
  raise exception 'Permission denied' using errcode='42501';
 end if;
 if p_operation='archive' then
   if v_archived is not null then return 'archived'; end if;
   update public.projects set archived_at=now(), archived_by=(select auth.uid()) where id=p_project_id;
   update public.published_pages set is_live=false where project_id=p_project_id and is_live=true;
   update public.game_publications set is_live=false where project_id=p_project_id and is_live=true;
   v_action='project_archived';
 elsif p_operation='restore' then
   if v_archived is null then return 'active'; end if;
   update public.projects set archived_at=null,archived_by=null where id=p_project_id;
   v_action='project_restored';
 elsif p_operation='delete' then
   if v_archived is null then raise exception 'Archive the project before deleting it' using errcode='22023'; end if;
   if p_confirmation is distinct from v_name then raise exception 'Project name confirmation mismatch' using errcode='22023'; end if;
   -- Preserve audit trail but remove the project and its dependent pages/builds/publications.
   delete from public.projects where id=p_project_id;
   v_action='project_permanently_deleted';
 else raise exception 'Unsupported operation' using errcode='22023';
 end if;
 insert into public.admin_audit_logs(actor_id,target_user_id,action,details)
 values((select auth.uid()),v_owner,v_action,jsonb_build_object('project_id',p_project_id,'project_name',v_name));
 return p_operation;
end; $function$

