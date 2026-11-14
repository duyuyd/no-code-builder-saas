-- Parametric 3D character designs scoped by authenticated owner. No default user records.
create table if not exists public.character_designs(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 100),
 model jsonb not null check(jsonb_typeof(model)='object' and pg_column_size(model)<32768),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists character_designs_owner_created_idx on public.character_designs(owner_id,created_at desc);
alter table public.character_designs enable row level security;
grant select,insert,update,delete on public.character_designs to authenticated;
revoke all on public.character_designs from anon;
drop policy if exists character_designs_select on public.character_designs;
create policy character_designs_select on public.character_designs for select to authenticated using(owner_id=(select auth.uid()));
drop policy if exists character_designs_insert on public.character_designs;
create policy character_designs_insert on public.character_designs for insert to authenticated with check(owner_id=(select auth.uid()));
drop policy if exists character_designs_update on public.character_designs;
create policy character_designs_update on public.character_designs for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists character_designs_delete on public.character_designs;
create policy character_designs_delete on public.character_designs for delete to authenticated using(owner_id=(select auth.uid()));
insert into public.platform_settings(key,value) values(
 'character_studio_defaults',
 '{"skin":"#f4c7a1","outfit":"#f97316","hair":"#31241d","pants":"#334155","headSize":1,"bodyWidth":1,"armLength":1,"legLength":1,"eyeStyle":"round"}'::jsonb
) on conflict(key) do nothing;
