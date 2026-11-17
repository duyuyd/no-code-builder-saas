alter table public.products add column if not exists builder_node_id uuid;
create unique index if not exists products_builder_node_idx on public.products(project_id,builder_node_id) where builder_node_id is not null;
create or replace function public.protect_tenant_plan() returns trigger language plpgsql set search_path='' as $$
begin
 if new.plan is distinct from old.plan and current_user not in ('postgres','service_role') then
  raise exception 'Subscription changes require server-side approval';
 end if;
 return new;
end
$$;
drop trigger if exists protect_tenant_plan_trigger on public.tenants;
create trigger protect_tenant_plan_trigger before update of plan on public.tenants
for each row execute function public.protect_tenant_plan();
revoke execute on function public.protect_tenant_plan() from public,anon,authenticated;
