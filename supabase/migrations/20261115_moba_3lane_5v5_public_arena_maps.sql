-- Original MOBA arena configurations, public demo. No commercial game assets.
create table if not exists public.moba_maps(
 id uuid primary key default gen_random_uuid(),
 code text not null unique check(code ~ '^[a-z0-9-]{3,80}$'),
 name text not null check(length(name) between 3 and 120),
 description text not null default '',
 config jsonb not null check(jsonb_typeof(config)='object'),
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.moba_maps enable row level security;
drop policy if exists moba_maps_public_read on public.moba_maps;
create policy moba_maps_public_read on public.moba_maps for select to anon,authenticated using(is_active);
revoke insert,update,delete on public.moba_maps from anon,authenticated;
grant select on public.moba_maps to anon,authenticated;
insert into public.moba_maps(code,name,description,config) values
('rung-co-tam-loi','Rừng Cổ Tam Lộ','Bản đồ rừng ba làn top/mid/bot, sông, 12 trụ, rừng và 10 hero PvE.','{"biome":"forest","palette":{"ground":"#214c3e","lane":"#b5a47c","laneEdge":"#576749","river":"#276a86","bush":"#337c5a","blue":"#38bdf8","red":"#fb7185","stone":"#33524a"},"lanes":[{"id":"top","points":[{"x":9,"y":88},{"x":10,"y":30},{"x":14,"y":15},{"x":29,"y":12},{"x":87,"y":12},{"x":91,"y":12}]},{"id":"mid","points":[{"x":9,"y":88},{"x":26,"y":72},{"x":50,"y":50},{"x":73,"y":29},{"x":91,"y":12}]},{"id":"bottom","points":[{"x":9,"y":88},{"x":16,"y":91},{"x":34,"y":88},{"x":85,"y":86},{"x":90,"y":63},{"x":91,"y":12}]}],"river":[{"x":36,"y":0},{"x":40,"y":17},{"x":44,"y":32},{"x":50,"y":50},{"x":56,"y":69},{"x":64,"y":84},{"x":68,"y":100}],"bushes":[{"x":29,"y":28},{"x":34,"y":39},{"x":42,"y":22},{"x":64,"y":32},{"x":74,"y":46},{"x":60,"y":66},{"x":46,"y":76},{"x":25,"y":57},{"x":79,"y":69},{"x":22,"y":84},{"x":77,"y":17}],"camps":[{"x":29,"y":46},{"x":64,"y":26},{"x":71,"y":66},{"x":33,"y":73},{"x":54,"y":21},{"x":45,"y":84}]}'::jsonb),
('hao-luy-hac-thach','Hào Lũy Hắc Thạch','Bản đồ núi lửa ba làn uốn lượn, địa hình đá tối, sông dung nham, 12 trụ và PvE 5v5.','{"biome":"ember","palette":{"ground":"#2d303b","lane":"#9e8c80","laneEdge":"#4e4645","river":"#aa4a2a","bush":"#5d5149","blue":"#4ad1f0","red":"#fb7185","stone":"#444854"},"lanes":[{"id":"top","points":[{"x":8,"y":86},{"x":9,"y":36},{"x":17,"y":16},{"x":40,"y":9},{"x":89,"y":13}]},{"id":"mid","points":[{"x":8,"y":86},{"x":28,"y":70},{"x":46,"y":52},{"x":66,"y":34},{"x":89,"y":13}]},{"id":"bottom","points":[{"x":8,"y":86},{"x":33,"y":91},{"x":59,"y":92},{"x":83,"y":79},{"x":91,"y":52},{"x":89,"y":13}]}],"river":[{"x":33,"y":0},{"x":38,"y":18},{"x":44,"y":35},{"x":51,"y":52},{"x":60,"y":70},{"x":68,"y":88},{"x":75,"y":100}],"bushes":[{"x":29,"y":26},{"x":36,"y":38},{"x":42,"y":18},{"x":63,"y":29},{"x":75,"y":43},{"x":61,"y":65},{"x":42,"y":76},{"x":25,"y":52},{"x":79,"y":66},{"x":21,"y":82},{"x":77,"y":19}],"camps":[{"x":22,"y":41},{"x":72,"y":27},{"x":73,"y":71},{"x":28,"y":70},{"x":53,"y":18},{"x":47,"y":84}]}'::jsonb)
on conflict(code) do nothing;
