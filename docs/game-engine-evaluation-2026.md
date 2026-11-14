# Nguồn game engine được thẩm định — 15/11/2026

Dự án đích: **duyuyd/no-code-builder-saas**. Không fork thành dự án mới, không thay đổi dữ liệu hoặc nhúng nguyên source engine chưa kiểm thử. Mọi asset thương mại phải có nguồn được phép dùng.

| Upstream | Giấy phép (metadata GitHub) | Hệ phù hợp | Điểm cần tích hợp |
|---|---|---|---|
| [Phaser](https://github.com/phaserjs/phaser) | MIT | Game 2D trình duyệt, Canvas/WebGL | Runtime độc lập, adapter scene JSON, input touch, sprite atlas, animation |
| [Babylon.js](https://github.com/BabylonJS/Babylon.js) | Apache-2.0 | Character/game 3D WebGL/WebGPU | Lazy-load editor 3D, import GLTF, cache texture, FPS budget |
| [Godot Engine](https://github.com/godotengine/godot) | MIT | Editor 2D/3D độc lập, có xuất HTML5 | Export game build qua worker/queue, upload artifact, không thể iframe toàn bộ editor nguyên bản |
| [OpenMOBA](https://github.com/yasgamesdev/OpenMOBA) | MIT | Unreal Engine 4 Blueprint | Chỉ học cấu trúc kỹ năng/hero/lane; không import trực tiếp sang Next.js |
| [WebSoccer](https://github.com/markclausing/websoccer) | MIT | Bóng đá trình duyệt + multiplayer | Thẩm định máy chủ relay, sync state, UI, FPS; không tuyên bố giống FIFA |

**Không thể gọi nguyên source game nổi tiếng là "core có sẵn" để fork không cần sửa.** Những dự án khác ngôn ngữ / engine (Unity, Unreal, Godot) phải chuyển đổi asset, scene, logic, export và kiểm thử. Giấy phép mã nguồn không tự động bao gồm logo, âm thanh, nhân vật và tài sản của game thương mại.

## Tiến độ tích hợp thật trong repo này
- [x] Game Builder 2D với scene JSONB, RLS, nhiều bản đồ thể loại và lưu/Undo/Redo
- [x] Template dự án 4 trang từ Supabase + game_scene_code để gán sẵn bản đồ ngay lúc tạo game
- [x] Character Studio 3D tạo từ hình khối, xem nhiều góc, chỉnh tỉ lệ/trang phục, lưu model và xuất PNG
- [ ] Phaser adapter/render integration; chưa copy upstream code
- [ ] Babylon.js editor, rig animation, import/export glTF
- [ ] RPC multiplayer có server authoritative và kết nối 2 client
- [ ] AI skill/quests/hero system, 3D terrain, vật lý bóng thực
- [ ] Đánh giá bản quyền từng gói texture/model/sound trước khi đưa vào Marketplace

Điều kiện nghiệm thu: cấu hình và thao tác không lỗi trên Android + desktop; tạo dự án → chỉnh → lưu → khôi phục → xuất bản → game play bằng hai tài khoản khi có multiplayer. Không bật dịch vụ trả phí khi chưa được chủ sở hữu chấp thuận.
