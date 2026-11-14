
-- Two additive authored game starters. Existing games/projects/pages remain unchanged.
with seeds(code,name,arena_code,base_code,genre) as (
 values
  ('starter-moba-tam-loi','Chiến Trường Tam Lộ · MOBA 5v5','rung-co-tam-loi','arena-strategy','MOBA 5v5 PvE'),
  ('starter-moba-hac-thach','Hắc Thạch · MOBA 5v5','hao-luy-hac-thach','arena-strategy','MOBA 5v5 PvE')
)
insert into public.game_scene_templates(code,name,genre,description,scene,is_active)
select s.code,s.name,s.genre,
       'Core MOBA tự thiết kế với 3 đường, 12 trụ, lính, 10 hero AI, bản đồ nhỏ và kỹ năng; trận PvE trong trình duyệt.',
       jsonb_set(jsonb_set(jsonb_set(g.scene,'{title}',to_jsonb(s.name),true),'{mode}','"moba"'::jsonb,true),'{mobaCode}',to_jsonb(s.arena_code),true),
       true
from seeds s join public.game_scene_templates g on g.code=s.base_code
on conflict(code) do nothing;

insert into public.starter_templates(name,kind,description,pages,game_scene_code,is_active)
select g.name,'game',
       'Tạo ngay dự án MOBA 5v5 PvE với bản đồ ba đường; có thể lưu, chỉnh chọn map, xuất bản game. Không cần dựng game từ trang web kinh doanh.',
       '[{"path":"/","ui_tree":[]}]'::jsonb,
       g.code,true
from public.game_scene_templates g
where g.code in ('starter-moba-tam-loi','starter-moba-hac-thach')
and not exists (
 select 1 from public.starter_templates t where t.game_scene_code=g.code
);
