-- Platform owner explicitly enables outbound AI; no provider secret is stored in SQL.
insert into public.platform_settings(key,value)
values('studio_ai_config','{"enabled":false,"provider":"gemini","model":"gemini-3.5-flash-lite","dailyUserLimit":10,"dailyGlobalLimit":80,"maxOutputTokens":900}'::jsonb)
on conflict(key) do nothing;

-- A hard budget gate. The global tally is not readable/writable by regular accounts.
create table if not exists public.studio_ai_global_daily_usage(
 usage_date date primary key,
 requests integer not null default 0 check (requests>=0),
 updated_at timestamptz not null default now()
);
alter table public.studio_ai_global_daily_usage enable row level security;
revoke all on public.studio_ai_global_daily_usage from anon,authenticated;

create or replace function public.studio_ai_claim_slot()
returns boolean
language plpgsql security definer set search_path=''
as $$
declare
 uid uuid:=(select auth.uid());
 conf jsonb;
 user_cap integer;
 global_cap integer;
 user_count integer;
 global_count integer;
 today_utc date:=(now() at time zone 'utc')::date;
begin
 if uid is null then return false; end if;
 select value into conf from public.platform_settings where key='studio_ai_config';
 if conf is null or conf->>'enabled' is distinct from 'true' then return false; end if;
 user_cap:=least(20,greatest(1,coalesce(nullif(conf->>'dailyUserLimit','')::integer,10)));
 global_cap:=least(300,greatest(1,coalesce(nullif(conf->>'dailyGlobalLimit','')::integer,80)));
 perform pg_catalog.pg_advisory_xact_lock(72194018);
 select coalesce(requests,0) into global_count from public.studio_ai_global_daily_usage where usage_date=today_utc;
 if coalesce(global_count,0)>=global_cap then return false; end if;
 insert into public.studio_ai_daily_usage(user_id,usage_date,requests)
 values(uid,today_utc,1)
 on conflict(user_id,usage_date) do update set requests=public.studio_ai_daily_usage.requests+1
 where public.studio_ai_daily_usage.requests<user_cap
 returning requests into user_count;
 if user_count is null then return false; end if;
 insert into public.studio_ai_global_daily_usage(usage_date,requests,updated_at)
 values(today_utc,1,now())
 on conflict(usage_date) do update set requests=public.studio_ai_global_daily_usage.requests+1,updated_at=now();
 return true;
end
$$;
revoke all on function public.studio_ai_claim_slot() from public,anon;
grant execute on function public.studio_ai_claim_slot() to authenticated;

-- Safe read-only usage summary is available only to the platform admin.
create or replace function public.studio_ai_admin_usage()
returns table(usage_date date,global_requests integer,total_users bigint)
language plpgsql stable security definer set search_path=''
as $$
begin
 if not (select public.is_admin()) then raise exception 'Admin only'; end if;
 return query
 select (now() at time zone 'utc')::date,
 coalesce((select g.requests from public.studio_ai_global_daily_usage g where g.usage_date=(now() at time zone 'utc')::date),0),
 (select count(*) from public.studio_ai_daily_usage u where u.usage_date=(now() at time zone 'utc')::date);
end
$$;
revoke all on function public.studio_ai_admin_usage() from public,anon;
grant execute on function public.studio_ai_admin_usage() to authenticated;
