-- Manifests are public only after their owners enable them; draft installations remain private.
grant select on public.studio_plugins to anon;
drop policy if exists studio_plugins_public on public.studio_plugins;
create policy studio_plugins_public on public.studio_plugins for select to anon,authenticated
using(enabled=true);
