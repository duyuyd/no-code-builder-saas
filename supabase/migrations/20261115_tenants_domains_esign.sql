-- Additive multi-tenant domains and signed PDF records. Existing projects/pages are untouched.
create table if not exists public.tenants (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 project_id uuid references public.projects(id) on delete set null,
 name text not null check(length(btrim(name)) between 1 and 120),
 logo_url text,
 primary_color text not null default '#f97316' check(primary_color ~ '^#[0-9a-fA-F]{6}$'),
 custom_domain text unique,
 domain_status text not null default 'pending' check(domain_status in ('pending','verified','error')),
 domain_verification jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(owner_id)
);
create index if not exists idx_tenants_project_id on public.tenants(project_id);
alter table public.tenants enable row level security;
grant select,insert,update on public.tenants to authenticated;
grant select on public.tenants to anon;
drop policy if exists tenants_owner_read on public.tenants;
create policy tenants_owner_read on public.tenants for select to authenticated using(owner_id=(select auth.uid()));
drop policy if exists tenants_public_verified on public.tenants;
create policy tenants_public_verified on public.tenants for select to anon,authenticated using(domain_status='verified' and custom_domain is not null and project_id is not null);
drop policy if exists tenants_owner_create on public.tenants;
create policy tenants_owner_create on public.tenants for insert to authenticated with check(owner_id=(select auth.uid()));
drop policy if exists tenants_owner_update on public.tenants;
create policy tenants_owner_update on public.tenants for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

-- User clients may edit branding but cannot forge Vercel domain ownership or verified status.
create or replace function public.restrict_tenant_domain_mutations()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if current_user not in ('postgres','service_role') then
   if tg_op='INSERT' and (new.custom_domain is not null or new.domain_status <> 'pending' or new.domain_verification <> '[]'::jsonb) then
     raise exception 'Domain fields are managed exclusively by the verified server action.';
   elsif tg_op='UPDATE' and (
      new.custom_domain is distinct from old.custom_domain
      or new.domain_status is distinct from old.domain_status
      or new.domain_verification is distinct from old.domain_verification
      or new.owner_id is distinct from old.owner_id
   ) then
     raise exception 'Domain and tenant ownership fields cannot be edited by clients.';
   end if;
 end if;
 new.updated_at=now();
 return new;
end $$;
revoke all on function public.restrict_tenant_domain_mutations() from public,anon,authenticated;
drop trigger if exists tenant_domain_guard on public.tenants;
create trigger tenant_domain_guard before insert or update on public.tenants for each row execute function public.restrict_tenant_domain_mutations();

create table if not exists public.esign_documents (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 signer_name text not null check(length(btrim(signer_name)) between 2 and 120),
 signer_email text not null,
 original_filename text not null,
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 signed_sha256 text not null check(signed_sha256 ~ '^[a-f0-9]{64}$'),
 storage_path text not null unique,
 file_size bigint not null check(file_size>0 and file_size<=10000000),
 page_number integer not null check(page_number between 1 and 1000),
 x_fraction numeric not null check(x_fraction>=0 and x_fraction<=1),
 y_fraction numeric not null check(y_fraction>=0 and y_fraction<=1),
 signed_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index if not exists idx_esign_owner_date on public.esign_documents(owner_id,created_at desc);
alter table public.esign_documents enable row level security;
grant select,insert on public.esign_documents to authenticated;
drop policy if exists esign_owner_select on public.esign_documents;
create policy esign_owner_select on public.esign_documents for select to authenticated using(owner_id=(select auth.uid()));
drop policy if exists esign_owner_insert on public.esign_documents;
create policy esign_owner_insert on public.esign_documents for insert to authenticated with check(owner_id=(select auth.uid()));
-- No UPDATE/DELETE is deliberately exposed: metadata is an immutable signing audit record.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('signed-pdfs','signed-pdfs',false,10000000,array['application/pdf'])
on conflict (id) do nothing;
drop policy if exists signed_pdf_owner_insert on storage.objects;
create policy signed_pdf_owner_insert on storage.objects for insert to authenticated
 with check(bucket_id='signed-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists signed_pdf_owner_read on storage.objects;
create policy signed_pdf_owner_read on storage.objects for select to authenticated
 using(bucket_id='signed-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists signed_pdf_owner_delete on storage.objects;
create policy signed_pdf_owner_delete on storage.objects for delete to authenticated
 using(bucket_id='signed-pdfs' and (storage.foldername(name))[1]=(select auth.uid())::text);


-- Dynamic tier definitions; this does not enable billing.
insert into public.platform_settings(key,value) values ('saas_pricing', '[{"code":"free","name":"Free","features":["Trang web kéo thả","Xuất bản tại địa chỉ no-code-builder-saas.vercel.app/s/…","Lưu dự án bằng Supabase"],"available":true,"priceLabel":"Miễn phí","description":"Bắt đầu tạo website và trang công khai."},{"code":"pro","name":"Pro","features":["Tên miền riêng sau khi xác minh DNS","Ký PDF điện tử và lịch sử SHA-256","Bao gồm tính năng Free"],"available":false,"priceLabel":"Chưa mở bán","description":"Cho cá nhân và doanh nghiệp cần thương hiệu riêng."},{"code":"agency","name":"Agency","features":["White-label theo tenant","Quản lý sản phẩm nhiều trang","Lộ trình mở rộng Game Builder 2D/3D"],"available":false,"priceLabel":"Chưa mở bán","description":"Dành cho đại lý quản lý thương hiệu và sản phẩm."}]'::jsonb) on conflict(key) do nothing;
