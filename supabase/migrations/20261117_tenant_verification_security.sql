-- Never allow a signed-in client to forge DNS verification, merchant plan or tenant ownership.
create or replace function public.protect_tenant_verified_domain()
returns trigger language plpgsql set search_path='' as $$
begin
 if (new.custom_domain is distinct from old.custom_domain
   or new.domain_status is distinct from old.domain_status
   or new.domain_verification is distinct from old.domain_verification)
   and current_user not in ('postgres','service_role') then
  raise exception 'Domain verification must be updated by a server-side domain operation';
 end if;
 return new;
end
$$;
drop trigger if exists protect_tenant_verified_domain_trigger on public.tenants;
create trigger protect_tenant_verified_domain_trigger
before update of custom_domain,domain_status,domain_verification on public.tenants
for each row execute function public.protect_tenant_verified_domain();
revoke execute on function public.protect_tenant_verified_domain() from public,anon,authenticated;
drop policy if exists tenants_restricted_initial_domain on public.tenants;
create policy tenants_restricted_initial_domain as restrictive on public.tenants
for insert to authenticated with check (custom_domain is null and domain_status='pending' and plan='free');
