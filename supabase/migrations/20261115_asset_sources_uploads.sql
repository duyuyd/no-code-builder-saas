-- Curated source directory; assets are not copied or resold.
create table if not exists public.asset_sources(
 id bigint generated always as identity primary key,
 category text not null check(length(category) between 2 and 80),
 title text not null check(length(title) between 2 and 160),
 provider text not null,
 url text not null unique check(url ~ '^https://'),
 license_notes text not null,
 description text not null,
 created_at timestamptz not null default now()
);
alter table public.asset_sources enable row level security;
revoke all on public.asset_sources from anon,authenticated;
grant select on public.asset_sources to anon,authenticated;
drop policy if exists asset_sources_public_read on public.asset_sources;
create policy asset_sources_public_read on public.asset_sources for select to anon,authenticated using(true);
insert into public.asset_sources(category,title,provider,url,license_notes,description) values
('Game 2D','Platformer Pack','Kenney','https://kenney.nl/assets/new-platformer-pack','CC0','Sprite, tileset và nhân vật platformer; gói tải trực tiếp từ Kenney.'),
('Game 2D','RPG Base','Kenney','https://kenney.nl/assets/rpg-base','CC0','Tile và vật thể nhập vai RPG.'),
('Game 2D','Pixel Pack','Kenney','https://kenney.nl/assets/pixel-pack','CC0','Pixel-art cho game retro và hoạt hình.'),
('Game 2D','Board Game Info','Kenney','https://kenney.nl/assets/board-game-info','CC0','Nút, bảng thông tin, thẻ game.'),
('Game 2D','Flag Pack','Kenney','https://kenney.nl/assets/flag-pack','CC0','Cờ quốc gia cho game thể thao và bản đồ.'),
('Game 2D','Rolling Ball Assets','Kenney','https://kenney.nl/assets/rolling-ball-assets','CC0','Asset bóng và game 2D góc nhìn trên xuống.'),
('Game 2D','Foliage Pack','Kenney','https://kenney.nl/assets/foliage-pack','CC0','Cây, vật thể thiên nhiên.'),
('Game UI','Game Icons','Kenney','https://kenney.nl/assets/game-icons','CC0','Bộ icon điều khiển và ký hiệu game.'),
('Game UI','Particle Pack','Kenney','https://kenney.nl/assets/particle-pack','CC0','Hiệu ứng kỹ xảo game.'),
('Game UI','UI Pack','Kenney','https://kenney.nl/assets/ui-pack','CC0 (kiểm tra gói)','Giao diện menu, thanh tiến trình, nút game.'),
('Game UI','Development Essentials','Kenney','https://kenney.nl/assets/development-essentials','CC0','Asset thiết kế nguyên mẫu.'),
('Game 3D','3D Models','Poly Haven','https://polyhaven.com/models','CC0','Mô hình 3D và đồ vật.'),
('Game 3D','Textures','Poly Haven','https://polyhaven.com/textures','CC0','Bề mặt, texture cho cảnh game 3D.'),
('Game 3D','HDRI','Poly Haven','https://polyhaven.com/hdris','CC0','Ảnh môi trường chiếu sáng 3D.'),
('Thời trang','Ảnh thời trang','Pexels','https://www.pexels.com/search/fashion/','Pexels License (từng ảnh)','Ảnh thời trang, lookbook, styling.'),
('Thời trang','Ảnh người mẫu','Unsplash','https://unsplash.com/s/photos/fashion-model','Unsplash License (từng ảnh)','Ảnh chân dung, người mẫu và phong cách thời trang.'),
('Website','Ảnh website và banner','Unsplash','https://unsplash.com/s/photos/web-design','Unsplash License (từng ảnh)','Ảnh nền, sản phẩm, cảnh quan cho landing page.'),
('Website','Ảnh studio sản phẩm','Pexels','https://www.pexels.com/search/product%20photography/','Pexels License (từng ảnh)','Ảnh sản phẩm thương mại điện tử.'),
('Hoạt hình','Ảnh minh họa hoạt hình','Pexels','https://www.pexels.com/search/illustration/','Pexels License (từng ảnh)','Minh họa cho ứng dụng và trò chơi; kiểm tra quyền từng file.'),
('Icon','Lucide Icons','Lucide','https://lucide.dev/icons/','ISC','Bộ biểu tượng vector; đã tích hợp lucide-react vào nền tảng.'),
('Icon','Heroicons','Heroicons','https://heroicons.com/','MIT','Icon SVG cho dashboard và ứng dụng web.'),
('Âm thanh','Game assets','Kenney','https://kenney.nl/assets','CC0 trên trang asset','Danh mục game asset 2D/3D/UI, nhiều gói có âm thanh.')
on conflict(url) do nothing;

-- User-uploaded PNG/JPG/WEBP/GIF media intended for publicly published games and websites.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('builder-assets','builder-assets',true,5242880,ARRAY['image/png','image/jpeg','image/webp','image/gif'])
on conflict(id) do nothing;

drop policy if exists builder_asset_owner_select on storage.objects;
create policy builder_asset_owner_select on storage.objects for select to authenticated
 using(bucket_id='builder-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists builder_asset_owner_insert on storage.objects;
create policy builder_asset_owner_insert on storage.objects for insert to authenticated
 with check(bucket_id='builder-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists builder_asset_owner_delete on storage.objects;
create policy builder_asset_owner_delete on storage.objects for delete to authenticated
 using(bucket_id='builder-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
