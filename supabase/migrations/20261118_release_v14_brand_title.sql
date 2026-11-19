-- Apply only after Founder verification. Preserves custom tenant branding and other settings.
begin;
update public.platform_settings
set value=to_jsonb('NuvoraCraft by NPTduy'::text)
where key='site_title'
and value = '"NuvoraCraft"'::jsonb;
commit;
