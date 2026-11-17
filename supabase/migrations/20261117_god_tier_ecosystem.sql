-- Additive God-tier ecosystem foundation, created 2026-11-17. Owner authorization on every write.
create table if not exists public.products(
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 180),
 description text not null default '',
 price_vnd bigint not null check(price_vnd between 1000 and 1000000000),
 image_url text not null default '',
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create index if not exists products_project_idx on public.products(project_id);
alter table public.products enable row level security;
grant select,insert,update,delete on public.products to authenticated;
grant select on public.products to anon;
drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon,authenticated
using (exists(select 1 from public.projects p where p.id=project_id and (p.owner_id=(select auth.uid()) or exists(select 1 from public.published_pages pp where pp.project_id=p.id and pp.is_live=true))));
drop policy if exists products_write on public.products;
create policy products_write on public.products for all to authenticated
using (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())))
with check (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));

create table if not exists public.commerce_orders(
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 buyer_id uuid not null references auth.users(id),
 product_id uuid not null references public.products(id),
 quantity int not null check(quantity between 1 and 30),
 amount_vnd bigint not null check(amount_vnd between 1000 and 2000000000),
 status text not null default 'pending' check(status in ('pending','paid','cancelled','refunded')),
 provider text not null default 'payos' check(provider in ('payos')),
 provider_order_code bigint unique,
 provider_link_id text,
 created_at timestamptz not null default now()
);
create index if not exists commerce_orders_buyer_idx on public.commerce_orders(buyer_id,created_at desc);
alter table public.commerce_orders enable row level security;
grant select on public.commerce_orders to authenticated;
drop policy if exists commerce_orders_read on public.commerce_orders;
create policy commerce_orders_read on public.commerce_orders for select to authenticated
using (buyer_id=(select auth.uid()) or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));

create table if not exists public.marketplace_items(
 id uuid primary key default gen_random_uuid(),
 creator_id uuid not null references auth.users(id),
 project_id uuid references public.projects(id) on delete set null,
 title text not null check(char_length(title) between 5 and 120),
 summary text not null default '' check(char_length(summary)<=2000),
 item_type text not null check(item_type in ('website','app','game','component')),
 price_vnd bigint not null default 0 check(price_vnd between 0 and 100000000),
 component_tree jsonb,
 search_text tsvector generated always as (to_tsvector('simple',coalesce(title,'')||' '||coalesce(summary,''))) stored,
 status text not null default 'draft' check(status in ('draft','published','suspended')),
 created_at timestamptz not null default now()
);
create index if not exists marketplace_search_idx on public.marketplace_items using gin(search_text);
create index if not exists marketplace_published_idx on public.marketplace_items(created_at desc) where status='published';
alter table public.marketplace_items enable row level security;
grant select,insert,update,delete on public.marketplace_items to authenticated;
grant select on public.marketplace_items to anon;
drop policy if exists marketplace_read on public.marketplace_items;
create policy marketplace_read on public.marketplace_items for select to anon,authenticated
using (status='published' or creator_id=(select auth.uid()));
drop policy if exists marketplace_insert on public.marketplace_items;
create policy marketplace_insert on public.marketplace_items for insert to authenticated
with check (creator_id=(select auth.uid()) and status='draft' and
 (project_id is null or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()))));
drop policy if exists marketplace_update on public.marketplace_items;
create policy marketplace_update on public.marketplace_items for update to authenticated
using (creator_id=(select auth.uid())) with check(creator_id=(select auth.uid()) and
 (project_id is null or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()))));
create table if not exists public.marketplace_orders(
 id uuid primary key default gen_random_uuid(),
 item_id uuid not null references public.marketplace_items(id),
 buyer_id uuid not null references auth.users(id),
 amount_vnd bigint not null check(amount_vnd>=0),
 status text not null default 'pending' check(status in ('pending','paid','delivered','released','refunded')),
 provider_order_code bigint unique,
 created_at timestamptz not null default now(),
 delivered_at timestamptz,
 released_at timestamptz
);
alter table public.marketplace_orders enable row level security;
grant select on public.marketplace_orders to authenticated;
drop policy if exists marketplace_orders_read on public.marketplace_orders;
create policy marketplace_orders_read on public.marketplace_orders for select to authenticated
using (buyer_id=(select auth.uid()) or exists(select 1 from public.marketplace_items i where i.id=item_id and i.creator_id=(select auth.uid())));
-- Marketplace ledger is an internal accounting record, not a bank escrow service.
create table if not exists public.marketplace_ledger(
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.marketplace_orders(id),
 entry_type text not null check(entry_type in ('receipt','release','refund')),
 amount_vnd bigint not null check(amount_vnd>=0),
 created_at timestamptz not null default now(),
 unique(order_id,entry_type)
);
alter table public.marketplace_ledger enable row level security;
grant select on public.marketplace_ledger to authenticated;
drop policy if exists marketplace_ledger_read on public.marketplace_ledger;
create policy marketplace_ledger_read on public.marketplace_ledger for select to authenticated
using (exists(select 1 from public.marketplace_orders o where o.id=order_id and
 (o.buyer_id=(select auth.uid()) or exists(select 1 from public.marketplace_items i where i.id=o.item_id and i.creator_id=(select auth.uid())))));
create table if not exists public.marketplace_reviews(
 id uuid primary key default gen_random_uuid(),item_id uuid not null references public.marketplace_items(id),
 reviewer_id uuid not null references auth.users(id),
 rating int not null check(rating between 1 and 5),comment text not null default '' check(char_length(comment)<=2000),
 created_at timestamptz not null default now(),unique(item_id,reviewer_id)
);
alter table public.marketplace_reviews enable row level security;
grant select,insert,update on public.marketplace_reviews to authenticated;
grant select on public.marketplace_reviews to anon;
drop policy if exists marketplace_reviews_read on public.marketplace_reviews;
create policy marketplace_reviews_read on public.marketplace_reviews for select to anon,authenticated using(true);
drop policy if exists marketplace_reviews_create on public.marketplace_reviews;
create policy marketplace_reviews_create on public.marketplace_reviews for insert to authenticated
with check (reviewer_id=(select auth.uid()) and exists(select 1 from public.marketplace_orders o where o.item_id=marketplace_reviews.item_id and o.buyer_id=(select auth.uid()) and o.status in ('delivered','released')));
drop policy if exists marketplace_reviews_edit on public.marketplace_reviews;
create policy marketplace_reviews_edit on public.marketplace_reviews for update to authenticated
using (reviewer_id=(select auth.uid())) with check(reviewer_id=(select auth.uid()));

create table if not exists public.tenants(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 project_id uuid not null references public.projects(id) on delete cascade,
 domain text unique,
 logo_url text,
 primary_color text not null default '#f97316' check(primary_color ~ '^#[0-9a-fA-F]{6}$'),
 plan text not null default 'free' check(plan in ('free','pro','agency','enterprise')),
 status text not null default 'pending' check(status in ('pending','verified','active','disabled')),
 created_at timestamptz not null default now(),
 unique(project_id)
);
alter table public.tenants enable row level security;
grant select,insert,update on public.tenants to authenticated;
grant select on public.tenants to anon;
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants for select to anon,authenticated
using (status='active' or owner_id=(select auth.uid()));
drop policy if exists tenants_insert on public.tenants;
create policy tenants_insert on public.tenants for insert to authenticated
with check (owner_id=(select auth.uid()) and status='pending' and domain is null and
exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
drop policy if exists tenants_update on public.tenants;
create policy tenants_update on public.tenants for update to authenticated
using (owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()) and
exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));

create table if not exists public.studio_plugins(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id),
 name text not null check(char_length(name) between 2 and 80),
 version text not null default '1.0.0',
 manifest jsonb not null default '{}'::jsonb,
 enabled boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.studio_plugins enable row level security;
grant select,insert,update,delete on public.studio_plugins to authenticated;
drop policy if exists studio_plugins_owner on public.studio_plugins;
create policy studio_plugins_owner on public.studio_plugins for all to authenticated
using (owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

create table if not exists public.blog_posts(
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id),
 slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check(char_length(title) between 8 and 180),
 excerpt text not null default '',body text not null check(char_length(body)<=20000),
 published boolean not null default false,
 created_at timestamptz not null default now(),published_at timestamptz
);
create index if not exists blog_posts_public_idx on public.blog_posts(published_at desc) where published=true;
alter table public.blog_posts enable row level security;
grant select on public.blog_posts to anon;
grant select,insert,update on public.blog_posts to authenticated;
drop policy if exists blog_posts_read on public.blog_posts;
create policy blog_posts_read on public.blog_posts for select to anon,authenticated
using(published or author_id=(select auth.uid()));
drop policy if exists blog_posts_insert on public.blog_posts;
create policy blog_posts_insert on public.blog_posts for insert to authenticated
with check (author_id=(select auth.uid()) and published=false);
drop policy if exists blog_posts_update on public.blog_posts;
create policy blog_posts_update on public.blog_posts for update to authenticated
using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
