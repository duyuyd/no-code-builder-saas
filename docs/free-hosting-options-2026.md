# Phương án triển khai khi Vercel Free hết hạn mức — nghiên cứu 15/11/2026

**Giữ Production hiện tại tại Vercel. Không tự động chuyển nhà cung cấp hoặc mở gói trả phí.**

| Phương án | Dùng cho | Hạn chế free / tính tương thích |
|---|---|---|
| [Cloudflare Workers](https://developers.cloudflare.com/workers/platform/limits/) | Full-stack Next.js bằng [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) hoặc OpenNext | Free: **100.000 request/ngày**, CPU **10 ms/invocation**; phải chạy test server actions, cookies, Supabase RLS, streaming, middleware |
| [Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/) | Asset tĩnh và trang export | Free: **500 builds/tháng**, **20.000 file/site**, **25 MiB/file**. Next.js dynamic nên ưu tiên Workers |
| [Render Free](https://render.com/docs/free) | Preview full-stack Node/Next.js | Free web service ngủ sau **15 phút** không có traffic, khởi động lại có thể ~1 phút; **750 giờ/tháng/workspace**; không dùng làm production thương mại |
| [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | Demo tĩnh/hồ sơ cá nhân | GitHub không cho dùng Pages làm free hosting SaaS/thương mại; không hỗ trợ backend Next.js server actions |
| Vercel hiện tại | Next.js App Router, Server Actions, middleware, Supabase | Giữ nguyên vì đang chạy; giới hạn Hobby phải giám sát từng tính năng; không đổi gói không có phê duyệt |

## Kiến trúc chống hết hạn mức
1. **Không chuyển toàn bộ SaaS đồng thời**: build trước phiên bản preview trên Workers, tách deploy branch để so sánh.
2. **Tách phần tĩnh**: screenshot, asset, ảnh game qua Supabase Storage / CDN; website export tĩnh có thể lên Pages nếu phù hợp.
3. **Giảm thời gian máy chủ**: cache platform settings có invalidation, tối ưu SSR, load thư viện game/3D theo nhu cầu, giới hạn truy vấn.
4. **Quan trắc**: requests, TTFB, CLS/LCP, CPU, lỗi đăng nhập, Supabase egress, API/storage quota.
5. **Rollback**: phiên bản Production Vercel vẫn giữ nguyên trong quá trình test; không thay DNS trước khi smoke test.
6. **Bảo vệ chi phí**: mọi tài khoản dịch vụ đặt spending cap và cảnh báo usage; không bật Gemini API hay hosting paid nếu chưa được chấp thuận.

Tài liệu: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/), [Render Free](https://render.com/docs/free), [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
