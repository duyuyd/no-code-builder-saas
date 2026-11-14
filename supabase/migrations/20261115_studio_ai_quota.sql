-- Server-side, authenticated quota for optional externally enabled Gemini assistant.
-- No provider or paid requests are enabled by this migration.
create table if not exists public.studio_ai_daily_usage(
 user_id uuid not null references auth.users(id) on delete cascade,
 usage_date date not null,
 requests integer not null default 0 check(requests between 0 and 20),
 primary key(user_id,usage_date)
);
alter table public.studio_ai_daily_usage enable row level security;
revoke all on public.studio_ai_daily_usage from public,anon,authenticated;
create or replace function public.studio_ai_consume_slot()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_requests integer;
begin
 if (select auth.uid()) is null then return false; end if;
 insert into public.studio_ai_daily_usage(user_id,usage_date,requests)
 values((select auth.uid()),(now() at time zone 'utc')::date,1)
 on conflict (user_id,usage_date) do update
 set requests=public.studio_ai_daily_usage.requests+1
 where public.studio_ai_daily_usage.requests <20
 returning requests into v_requests;
 return v_requests is not null;
end;
$$;
revoke all on function public.studio_ai_consume_slot() from public,anon;
grant execute on function public.studio_ai_consume_slot() to authenticated;
