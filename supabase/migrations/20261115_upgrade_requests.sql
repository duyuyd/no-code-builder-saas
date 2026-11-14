-- Real workflow for users to request Pro/Agency access; NO payment is collected or inferred.
create table if not exists public.upgrade_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 requested_plan text not null check(requested_plan in ('pro','agency')),
 message text not null default '' check(length(message)<=1000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 decision_note text check(length(decision_note)<=500),
 decided_by uuid references auth.users(id) on delete set null,
 decided_at timestamptz,
 created_at timestamptz not null default now(),
 constraint upgrade_resolution_consistency check(
  (status='pending' and decided_by is null and decided_at is null)
  or (status<>'pending' and decided_by is not null and decided_at is not null)
 )
);
create unique index if not exists upgrade_one_pending_per_user on public.upgrade_requests(user_id) where status='pending';
create index if not exists upgrade_status_created on public.upgrade_requests(status,created_at desc);
alter table public.upgrade_requests enable row level security;
revoke all on public.upgrade_requests from anon,authenticated;
grant select,insert on public.upgrade_requests to authenticated;
drop policy if exists upgrade_self_or_admin_read on public.upgrade_requests;
create policy upgrade_self_or_admin_read on public.upgrade_requests for select to authenticated
 using(user_id=(select auth.uid()) or (select public.is_admin()));
drop policy if exists upgrade_self_request on public.upgrade_requests;
create policy upgrade_self_request on public.upgrade_requests for insert to authenticated
 with check(
   user_id=(select auth.uid())
   and status='pending' and decided_by is null and decided_at is null
   and requested_plan in ('pro','agency')
 );
-- Direct UPDATE and DELETE are deliberately forbidden. Only checked RPC can decide requests.
create or replace function public.admin_decide_upgrade(p_request_id uuid,p_approve boolean,p_note text default '')
returns text language plpgsql security definer set search_path='' as $$
declare r public.upgrade_requests;v_action text;
begin
 if (select auth.uid()) is null or not (select public.is_admin()) then
  raise exception 'Administrator access required' using errcode='42501';
 end if;
 if length(coalesce(p_note,''))>500 then raise exception 'Decision note too long' using errcode='22023'; end if;
 select * into r from public.upgrade_requests where id=p_request_id for update;
 if not found then raise exception 'Upgrade request not found' using errcode='P0002'; end if;
 if r.status<>'pending' then raise exception 'Request already decided' using errcode='22023'; end if;
 update public.upgrade_requests
   set status=case when p_approve then 'approved' else 'rejected' end,
       decision_note=left(coalesce(p_note,''),500),
       decided_by=(select auth.uid()),decided_at=now()
 where id=p_request_id;
 if p_approve then
  update public.profiles set plan=r.requested_plan where id=r.user_id;
  v_action='upgrade_request_approved';
 else
  v_action='upgrade_request_rejected';
 end if;
 insert into public.admin_audit_logs(actor_id,target_user_id,action,details)
 values ((select auth.uid()),r.user_id,v_action,
 jsonb_build_object('request_id',r.id,'plan',r.requested_plan,'mode','manual_access_grant','note',left(coalesce(p_note,''),500)));
 return case when p_approve then 'approved' else 'rejected' end;
end;$$;
revoke all on function public.admin_decide_upgrade(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.admin_decide_upgrade(uuid,boolean,text) to authenticated;


-- Restrict inserts to business fields so clients cannot forge audit timestamps.
revoke insert on public.upgrade_requests from authenticated;
grant insert(user_id,requested_plan,message) on public.upgrade_requests to authenticated;
