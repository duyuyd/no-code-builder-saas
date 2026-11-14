# Trợ lý Studio: thiết lập an toàn và đúng phạm vi

`components/StudioAssistant.tsx` mở từ Builder, gọi `app/builder/assistant-actions.ts` (Server Action).

- Mặc định: **hướng dẫn theo ngữ cảnh tại chỗ**, không gọi API bên thứ ba, không phát sinh chi phí, có thể truy cập ngay cả khi không bật Google AI.
- Tùy chọn Google Gemini **chỉ khi cả hai** biến server-side được cấu hình: `STUDIO_AI_ENABLED=true` và `GEMINI_API_KEY=...`. Không đặt key dưới tên `NEXT_PUBLIC_`.
- Model mặc định: `gemini-2.5-flash`. Có thể chọn `GEMINI_MODEL` nhưng Server Action chặn tên model không hợp lệ.
- Tài khoản được kiểm tra Supabase Auth, RLS theo owner_id, trang thuộc dự án. Chỉ metadata loại trang, số khối, khối được chọn và câu hỏi được gửi ra API. Không gửi toàn bộ cây JSON, email hoặc secret.
- RPC `studio_ai_consume_slot` giới hạn 20 lần/ngày mỗi user, chống gọi API không kiểm soát. Giới hạn chưa đồng nghĩa chắc chắn không bị tính phí nếu Google key đang bật ở billing tier trả phí.
- Cài key trên Vercel phải được chủ sở hữu xác nhận; **đợt này chưa thêm hoặc bật biến môi trường AI**.

Lưu ý: ChatGPT Plus **không bao gồm** quota OpenAI API riêng. Gemini Free có hạn mức theo model/dự án/quốc gia, một số model không có Free Tier. Nếu hạn mức hết, trợ lý phải thông báo thay vì lặng lẽ chuyển sang model trả phí.
