-- Opt-in real-world manual bank-transfer orders. No payment provider, fake receipt or automatic bank confirmation.
insert into public.platform_settings(key,value) values
 ('saas_billing','{"enabled":false,"bankCode":"","accountNumber":"","accountName":"","notice":"Chỉ chuyển khoản sau khi đối chiếu thông tin người nhận."}'::jsonb)
on conflict(key) do nothing;
update public.platform_settings
set value=(select jsonb_agg(
 case when item->>'code' in ('pro','agency') and not (item ? 'priceVnd') then
 jsonb_set(item,'{priceVnd}','0'::jsonb,true) else item end
 ) from jsonb_array_elements(value) item)
where key='saas_pricing' and jsonb_typeof(value)='array';

create table if not exists public.billing_orders(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 plan_code text not null check(plan_code in ('pro','agency')),
 amount_vnd integer not null check(amount_vnd between 1000 and 100000000),
 currency text not null default 'VND' check(currency='VND'),
 bank_code text not null,
 account_number text not null,
 account_name text not null,
 transfer_code text not null unique default ('NCB'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
 status text not null default 'pending' check(status in ('pending','submitted','paid','rejected','cancelled')),
 created_at timestamptz not null default now(),
 submitted_at timestamptz,
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id) on delete set null,
 decision_note text,
 check(length(coalesce(decision_note,''))<=500)
);
create unique index if not exists billing_one_active_order on public.billing_orders(user_id) where status in ('pending','submitted');
create index if not exists billing_order_latest on public.billing_orders(created_at desc);
alter table public.billing_orders enable row level security;
revoke all on public.billing_orders from anon,authenticated;
grant select on public.billing_orders to authenticated;
drop policy if exists billing_owner_admin_read on public.billing_orders;
create policy billing_owner_admin_read on public.billing_orders for select to authenticated
 using(user_id=(select auth.uid()) or (select public.is_admin()));
-- All billing writes happen through checked, atomic RPCs.
create or replace function public.create_manual_billing_order(p_plan text)
returns uuid language plpgsql security definer set search_path='' as $$
declare config jsonb;tiers jsonb;tier jsonb;amount integer;dest text;acc text;holder text;order_id uuid;current_plan text;
begin
 if (select auth.uid()) is null then raise exception 'Please sign in' using errcode='42501'; end if;
 if p_plan not in ('pro','agency') then raise exception 'Invalid plan' using errcode='22023'; end if;
 select value into config from public.platform_settings where key='saas_billing';
 if config is null or config->>'enabled' is distinct from 'true' then raise exception 'Manual payment is not enabled' using errcode='22023'; end if;
 dest=upper(btrim(coalesce(config->>'bankCode','')));
 acc=btrim(coalesce(config->>'accountNumber',''));
 holder=btrim(coalesce(config->>'accountName',''));
 if dest !~ '^[A-Z0-9]{2,20}$' or acc !~ '^[0-9]{6,22}$' or length(holder) not between 3 and 100 then
  raise exception 'Bank destination is not configured' using errcode='22023';
 end if;
 select value into tiers from public.platform_settings where key='saas_pricing';
 select elem into tier from jsonb_array_elements(tiers) elem where elem->>'code'=p_plan limit 1;
 if tier is null or (tier->>'priceVnd') !~ '^[0-9]{1,9}$' or tier->>'visible'='false' then
  raise exception 'Price not configured' using errcode='22023';
 end if;
 amount=(tier->>'priceVnd')::integer;
 if amount<1000 or amount>100000000 then raise exception 'Invalid amount' using errcode='22023'; end if;
 select plan into current_plan from public.profiles where id=(select auth.uid());
 if current_plan='agency' or current_plan=p_plan or (current_plan='pro' and p_plan='pro') then
  raise exception 'Already subscribed to this plan' using errcode='22023';
 end if;
 if exists(select 1 from public.billing_orders where user_id=(select auth.uid()) and status in ('pending','submitted')) then
  raise exception 'An order is already in progress' using errcode='22023';
 end if;
 insert into public.billing_orders(user_id,plan_code,amount_vnd,bank_code,account_number,account_name)
 values((select auth.uid()),p_plan,amount,dest,acc,holder) returning id into order_id;
 return order_id;
end;$$;
revoke all on function public.create_manual_billing_order(text) from public,anon,authenticated;
grant execute on function public.create_manual_billing_order(text) to authenticated;

create or replace function public.mark_manual_transfer_sent(p_order_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare row public.billing_orders;
begin
 if (select auth.uid()) is null then raise exception 'Please sign in' using errcode='42501'; end if;
 select * into row from public.billing_orders where id=p_order_id for update;
 if not found or row.user_id is distinct from (select auth.uid()) then raise exception 'Order not found' using errcode='42501'; end if;
 if row.status <> 'pending' then raise exception 'Cannot mark this order as sent' using errcode='22023'; end if;
 update public.billing_orders set status='submitted',submitted_at=now() where id=p_order_id;
 return 'submitted';
end;$$;
revoke all on function public.mark_manual_transfer_sent(uuid) from public,anon,authenticated;
grant execute on function public.mark_manual_transfer_sent(uuid) to authenticated;

create or replace function public.cancel_manual_billing_order(p_order_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare row public.billing_orders;
begin
 if (select auth.uid()) is null then raise exception 'Please sign in' using errcode='42501'; end if;
 select * into row from public.billing_orders where id=p_order_id for update;
 if not found or row.user_id is distinct from (select auth.uid()) then raise exception 'Order not found' using errcode='42501'; end if;
 if row.status <> 'pending' then raise exception 'Only unsubmitted orders can be cancelled' using errcode='22023'; end if;
 update public.billing_orders set status='cancelled' where id=p_order_id;
 return 'cancelled';
end;$$;
revoke all on function public.cancel_manual_billing_order(uuid) from public,anon,authenticated;
grant execute on function public.cancel_manual_billing_order(uuid) to authenticated;

create or replace function public.admin_review_manual_order(p_order_id uuid,p_paid boolean,p_note text default '')
returns text language plpgsql security definer set search_path='' as $$
declare row public.billing_orders;decision text;
begin
 if (select auth.uid()) is null or not (select public.is_admin()) then raise exception 'Administrator access required' using errcode='42501'; end if;
 if length(coalesce(p_note,''))>500 then raise exception 'Note too long' using errcode='22023'; end if;
 select * into row from public.billing_orders where id=p_order_id for update;
 if not found then raise exception 'Order not found' using errcode='P0002'; end if;
 if row.status<>'submitted' then raise exception 'Order is not awaiting review' using errcode='22023'; end if;
 decision=case when p_paid then 'paid' else 'rejected' end;
 update public.billing_orders set status=decision,reviewed_at=now(),reviewed_by=(select auth.uid()),decision_note=left(coalesce(p_note,''),500) where id=p_order_id;
 if p_paid then update public.profiles set plan=row.plan_code where id=row.user_id; end if;
 insert into public.admin_audit_logs(actor_id,target_user_id,action,details)
 values((select auth.uid()),row.user_id,'manual_bank_order_'||decision,
  jsonb_build_object('order_id',row.id,'plan',row.plan_code,'amount_vnd',row.amount_vnd,'transfer_code',row.transfer_code,'verification','admin_confirmed_bank_statement','note',left(coalesce(p_note,''),500)));
 return decision;
end;$$;
revoke all on function public.admin_review_manual_order(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.admin_review_manual_order(uuid,boolean,text) to authenticated;
