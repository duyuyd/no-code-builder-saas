-- 12 independently usable, editable variants for every registered component. No user records fabricated.
create table if not exists public.component_presets(
 component_type text not null check(length(component_type) between 1 and 90),
 variant_key text not null check(length(variant_key) between 1 and 48),
 label_vi text not null check(length(label_vi) between 1 and 120),
 context_vi text not null check(length(context_vi) between 1 and 120),
 props_override jsonb not null default '{}'::jsonb check(jsonb_typeof(props_override)='object'),
 style_override jsonb not null default '{}'::jsonb check(jsonb_typeof(style_override)='object'),
 sort_order integer not null default 0,
 primary key(component_type,variant_key)
);
alter table public.component_presets enable row level security;
revoke all on public.component_presets from anon,authenticated;
grant select on public.component_presets to anon,authenticated;
grant update on public.component_presets to authenticated;
drop policy if exists presets_read on public.component_presets;
create policy presets_read on public.component_presets for select to anon,authenticated using(true);
drop policy if exists presets_admin_update on public.component_presets;
create policy presets_admin_update on public.component_presets for update to authenticated
 using((select public.is_admin())) with check((select public.is_admin()));
with defs(component_type,kind,label,category) as (
 values ('text','text','Văn bản','basic'),
('heading','text','Tiêu đề','basic'),
('h1','text','Tiêu đề H1','basic'),
('h3','text','Tiêu đề H3','basic'),
('h4','text','Tiêu đề H4','basic'),
('paragraph','text','Đoạn văn','basic'),
('caption','text','Chú thích','basic'),
('label','text','Nhãn','basic'),
('badge','text','Huy hiệu','basic'),
('tag','text','Thẻ nhãn','basic'),
('button','button','Nút bấm','basic'),
('submit-button','button','Nút gửi','basic'),
('link','link','Liên kết','basic'),
('image','image','Hình ảnh','basic'),
('avatar','image','Ảnh đại diện','basic'),
('divider','divider','Đường phân cách','basic'),
('spacer','divider','Khoảng trống','basic'),
('code','text','Mã nguồn','basic'),
('pre','text','Khối mã','basic'),
('quote','text','Trích dẫn','basic'),
('mark','text','Đánh dấu','basic'),
('strong','text','Chữ đậm','basic'),
('emphasis','text','Nhấn mạnh','basic'),
('list','list','Danh sách','basic'),
('ordered-list','list','Danh sách đánh số','basic'),
('container','container','Vùng chứa','layout'),
('section','container','Phân đoạn','layout'),
('row','container','Hàng','layout'),
('column','container','Cột','layout'),
('grid','container','Lưới','layout'),
('flex','container','Bố cục linh hoạt','layout'),
('stack','container','Xếp chồng','layout'),
('card','container','Thẻ nội dung','layout'),
('hero','container','Khối giới thiệu','layout'),
('header','container','Đầu trang','layout'),
('footer','container','Chân trang','layout'),
('navigation','container','Điều hướng','layout'),
('sidebar','container','Thanh bên','layout'),
('article','container','Bài viết','layout'),
('main','container','Nội dung chính','layout'),
('figure','container','Minh họa','layout'),
('form','container','Biểu mẫu','form'),
('fieldset','container','Nhóm trường','form'),
('input','input','Ô nhập liệu','form'),
('email-input','input','Ô nhập email','form'),
('password-input','input','Ô mật khẩu','form'),
('number-input','input','Ô nhập số','form'),
('search-input','input','Ô tìm kiếm','form'),
('date-input','input','Ô chọn ngày','form'),
('time-input','input','Ô chọn giờ','form'),
('file-input','input','Tải tệp lên','form'),
('textarea','textarea','Vùng nhập văn bản','form'),
('select','select','Hộp chọn','form'),
('checkbox','checkbox','Ô đánh dấu','form'),
('radio','checkbox','Chọn một','form'),
('toggle','checkbox','Công tắc','form'),
('slider','range','Thanh trượt','form'),
('range','range','Thanh khoảng giá trị','form'),
('progress','progress','Tiến trình','data'),
('quiz','quiz','Trắc nghiệm tương tác','data'),
('memory','memory','Game lật thẻ trí nhớ','data'),
('meter','progress','Thước đo','data'),
('table','table','Bảng dữ liệu','data'),
('chart','chart','Biểu đồ','data'),
('bar-chart','chart','Biểu đồ cột','data'),
('stats','text','Thống kê','data'),
('output','text','Kết quả','data'),
('video','video','Video','media'),
('audio','audio','Âm thanh','media'),
('embed','iframe','Nội dung nhúng','media'),
('iframe','iframe','Khung nhúng','media'),
('gallery','container','Bộ sưu tập','media'),
('picture','container','Khung hình','media'),
('details','container','Chi tiết mở rộng','layout'),
('dialog-shell','container','Khung hộp thoại','layout'),
('toolbar','container','Thanh công cụ','layout'),
('announcement','text','Thông báo nổi','basic'),
('alert','text','Cảnh báo','basic'),
('price-label','text','Nhãn giá bán','basic'),
('discount-badge','text','Giảm giá','basic'),
('rating-badge','text','Đánh giá sao','basic'),
('breadcrumb','text','Đường dẫn phân cấp','basic'),
('eyebrow','text','Chữ dẫn tiêu đề','basic'),
('subtitle','text','Tiêu đề phụ','basic'),
('cta-button','button','Nút hành động CTA','basic'),
('outline-button','button','Nút viền','basic'),
('download-link','link','Liên kết tải xuống','basic'),
('feature-grid','container','Lưới tính năng','layout'),
('product-grid','container','Lưới sản phẩm','layout'),
('portfolio-grid','container','Lưới dự án','layout'),
('game-hud','container','HUD trò chơi','layout'),
('game-menu','container','Menu game','layout'),
('game-inventory','container','Túi đồ nhân vật','layout'),
('quest-board','container','Bảng nhiệm vụ RPG','layout'),
('team-lineup','container','Đội hình bóng đá','layout'),
('match-scoreboard','container','Bảng tỉ số','layout'),
('fashion-lookbook','container','Lookbook thời trang','layout'),
('mobile-navigation','container','Thanh điều hướng mobile','layout'),
('pricing-grid','container','Bảng gói giá','layout'),
('testimonial-panel','container','Khách hàng nhận xét','layout'),
('faq-panel','container','Khối câu hỏi FAQ','layout'),
('dashboard-panel','container','Dashboard','layout'),
('login-panel','container','Khối đăng nhập','layout'),
('landing-banner','container','Banner landing page','layout'),
('contact-form','container','Form liên hệ','form'),
('newsletter-form','container','Form đăng ký tin','form'),
('phone-input','input','Ô số điện thoại','form'),
('currency-input','input','Ô tiền tệ','form'),
('fashion-photo','image','Ảnh thời trang','media'),
('product-photo','image','Ảnh sản phẩm','media'),
('character-sprite','image','Sprite nhân vật','media'),
('background-scene','image','Ảnh bối cảnh game','media'),
('video-hero','video','Video giới thiệu','media'),
('game-audio','audio','Âm thanh game','media'),
('icon-grid','container','Bộ sưu tập icon','media'),
('fashion-gallery','container','Bộ sưu tập thời trang','media'),
('inventory-list','list','Danh sách vật phẩm','data'),
('match-fixtures','table','Lịch thi đấu','data'),
('sales-report','table','Bảng doanh thu','data'),
('player-stats','chart','Thống kê nhân vật','data')
),
themes(variant_key,label_vi,context_vi,background,foreground,pad,radius,font,gap) as (
 values ('clean','Tối giản sáng','Website đơn giản','#ffffff','#0f172a',18,12,16,12),
('dark','Dark SaaS','Bảng điều khiển','#0f172a','#f8fafc',22,14,17,14),
('orange','Cam năng động','Landing page','#fff7ed','#9a3412',24,18,20,15),
('pastel','Pastel mềm','Giáo dục','#fdf2f8','#831843',20,20,16,16),
('compact','Mobile gọn','Ứng dụng di động','#f8fafc','#334155',10,10,14,8),
('neon','Game eSports','Game đấu trường','#111827','#a5f3fc',22,16,19,14),
('rpg','Fantasy RPG','Game võ lâm','#292524','#fde68a',26,14,21,16),
('football','Sân cỏ','Game bóng đá','#064e3b','#d1fae5',20,15,18,12),
('fashion','Lookbook thanh lịch','Thời trang','#faf9f6','#292524',28,4,19,18),
('commerce','Shop chuyển đổi','Thương mại điện tử','#f0f9ff','#075985',18,14,16,10),
('glass','Glass dashboard','Phân tích dữ liệu','#1e293b','#e2e8f0',22,24,17,14),
('premium','Cao cấp','Doanh nghiệp','#18181b','#fef3c7',28,10,20,18)
),
seed as (
 select d.component_type,t.variant_key,
        t.label_vi||' · '||d.label as label_vi,t.context_vi,
        case d.kind
         when 'text' then jsonb_build_object('text',d.label||' • '||t.context_vi)
         when 'button' then jsonb_build_object('text',case when t.variant_key='football' then 'Vào trận' when t.variant_key='rpg' then 'Bắt đầu nhiệm vụ' when t.variant_key='commerce' then 'Xem sản phẩm' else 'Khám phá ngay' end,'href','/')
         when 'link' then jsonb_build_object('text',d.label||' · '||t.context_vi,'href','/')
         when 'image' then jsonb_build_object('alt',d.label||' · '||t.context_vi)
         when 'quiz' then jsonb_build_object('title','Đố vui · '||t.context_vi)
         when 'memory' then jsonb_build_object('title','Ghép cặp · '||t.context_vi,'symbols','🎯|🏆|💎|⚽|🎮|🚀','pairCount','6')
         when 'container' then jsonb_build_object('label',d.label||' · '||t.context_vi)
         when 'input' then jsonb_build_object('placeholder','Nhập '||lower(d.label))
         when 'textarea' then jsonb_build_object('placeholder','Nhập nội dung tại đây')
         when 'chart' then jsonb_build_object('values','12,24,15,32,23')
         when 'list' then jsonb_build_object('items','Bước 1\nBước 2\nBước 3')
         else '{}'::jsonb
        end as props_override,
        jsonb_build_object('backgroundColor',t.background,'color',t.foreground,'fontSize',t.font::text,
            'padding',t.pad::text,'borderRadius',t.radius::text,'gap',t.gap::text) as style_override,
        row_number() over(partition by d.component_type order by t.variant_key)::integer as sort_order
 from defs d cross join themes t
)
insert into public.component_presets(component_type,variant_key,label_vi,context_vi,props_override,style_override,sort_order)
select component_type,variant_key,label_vi,context_vi,props_override,style_override,sort_order from seed
on conflict(component_type,variant_key) do nothing;
