-- Administration and reversible project removal. No existing project is deleted.
alter table public.projects add column if not exists archived_at timestamptz;
alter table public.projects add column if not exists archived_by uuid references auth.users(id) on delete set null;
create index if not exists projects_owner_archived_idx on public.projects(owner_id, archived_at);

-- The archive flag is only writable via the checked RPC below.
revoke update on public.projects from authenticated;
grant update(name,kind) on public.projects to authenticated;

create table if not exists public.admin_audit_logs (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id) on delete set null,
 target_user_id uuid references auth.users(id) on delete set null,
 project_id uuid references public.projects(id) on delete set null,
 action text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);
alter table public.admin_audit_logs enable row level security;
revoke all on public.admin_audit_logs from anon, authenticated;
grant select on public.admin_audit_logs to authenticated;
drop policy if exists admin_audit_read on public.admin_audit_logs;
create policy admin_audit_read on public.admin_audit_logs for select to authenticated
 using ((select public.is_admin()));

-- Email and sign-in data can be read only from a checked, admin-only RPC.
create or replace function public.admin_list_members()
returns table (
 id uuid, email text, display_name text, role text, plan text,
 registered_at timestamptz, confirmed_at timestamptz,
 last_sign_in_at timestamptz, project_count bigint
)
language plpgsql stable security definer set search_path='' as $$
begin
 if (select auth.uid()) is null or not (select public.is_admin()) then
  raise exception 'Administrator access required' using errcode='42501';
 end if;
 return query
 select u.id, u.email::text, coalesce(p.display_name,'')::text, p.role::text,
        p.plan::text, u.created_at, u.email_confirmed_at, u.last_sign_in_at,
        (select count(*) from public.projects pr where pr.owner_id=u.id and pr.archived_at is null)::bigint
 from auth.users u left join public.profiles p on p.id=u.id
 order by u.created_at desc limit 500;
end; $$;
revoke all on function public.admin_list_members() from public,anon,authenticated;
grant execute on function public.admin_list_members() to authenticated;

-- Server Action calls this RPC; clients cannot change profile.plan directly.
create or replace function public.admin_change_user_plan(p_user_id uuid,p_new_plan text)
returns text language plpgsql security definer set search_path='' as $$
declare old_plan text;
begin
 if (select auth.uid()) is null or not (select public.is_admin()) then
  raise exception 'Administrator access required' using errcode='42501';
 end if;
 if p_new_plan not in ('free','pro','agency') then
  raise exception 'Invalid subscription plan' using errcode='22023';
 end if;
 select p.plan into old_plan from public.profiles p where p.id=p_user_id for update;
 if not found then raise exception 'User not found' using errcode='P0002'; end if;
 if old_plan is distinct from p_new_plan then
  update public.profiles set plan=p_new_plan where id=p_user_id;
  insert into public.admin_audit_logs(actor_id,target_user_id,action,details)
  values ((select auth.uid()),p_user_id,'user_plan_changed',jsonb_build_object('from',old_plan,'to',p_new_plan,'mode','manual_grant'));
 end if;
 return p_new_plan;
end; $$;
revoke all on function public.admin_change_user_plan(uuid,text) from public,anon,authenticated;
grant execute on function public.admin_change_user_plan(uuid,text) to authenticated;

-- Owner and administrators can archive/restore, or permanently delete ONLY after archiving
-- and explicitly confirming the exact project name. This also unpublishes archived pages.
create or replace function public.manage_project_lifecycle(
 p_project_id uuid,p_operation text,p_confirmation text default null
)
returns text language plpgsql security definer set search_path='' as $$
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
end; $$;
revoke all on function public.manage_project_lifecycle(uuid,text,text) from public,anon,authenticated;
grant execute on function public.manage_project_lifecycle(uuid,text,text) to authenticated;

-- Reject any attempt to re-publish a project while it is in the trash.
create or replace function public.prevent_archived_publication()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.is_live and exists (select 1 from public.projects p where p.id=new.project_id and p.archived_at is not null) then
  raise exception 'Cannot publish an archived project';
 end if;
 return new;
end; $$;
revoke all on function public.prevent_archived_publication() from public,anon,authenticated;
drop trigger if exists published_archive_guard on public.published_pages;
create trigger published_archive_guard before insert or update on public.published_pages
 for each row execute function public.prevent_archived_publication();
