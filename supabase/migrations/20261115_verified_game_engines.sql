-- Verified GitHub upstreams; references only, no source code republished or backend engine installed.
insert into public.asset_sources(category,title,provider,url,license_notes,description) values
('Engine','Phaser','GitHub','https://github.com/phaserjs/phaser','MIT','Engine HTML5 2D Canvas/WebGL, phù hợp cho game web và trình dựng scene. Không bao gồm game MOBA đầy đủ.'),
('Engine','Babylon.js','GitHub','https://github.com/BabylonJS/Babylon.js','Apache-2.0','Engine 3D WebGL/WebGPU, hỗ trợ mô hình, ánh sáng, animation và camera; cần tích hợp runtime riêng.'),
('Engine','Godot Engine','GitHub','https://github.com/godotengine/godot','MIT','Engine 2D/3D độc lập, có thể export HTML5/game desktop; không thể nhúng trình chỉnh sửa trực tiếp như iframe.'),
('Game Source','OpenMOBA','GitHub','https://github.com/yasgamesdev/OpenMOBA','MIT','Dự án MOBA Unreal Engine 4 Blueprint; phục vụ tham khảo hệ thống game, không tương thích trực tiếp Next.js.'),
('Game Source','WebSoccer','GitHub','https://github.com/markclausing/websoccer','MIT','Game bóng đá trình duyệt, có multiplayer online; cần tích hợp máy chủ riêng và thẩm định netcode.')
on conflict(url) do nothing;
