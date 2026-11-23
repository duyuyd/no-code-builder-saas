# Cline AI coding integration — NuvoraCraft

This repository is **prepared for Cline**, the AI coding agent in VS Code/CLI. These files do not add the six video models to the production web app.

## Start using a promotional FREE model
1. Open this repository in Visual Studio Code.
2. Install the official Cline extension (ID: `saoudrizwan.claude-dev`), recommended via `.vscode/extensions.json`.
3. Sign in inside Cline, select API Provider **Cline**, then choose a model currently marked **FREE**. Promotional models and quotas change.
4. Confirm Cline has loaded `.clinerules/01-project.md` and `.clinerules/02-delivery.md`.
5. First task: “Đọc luồng NuvoraCraft AI từ /admin/ai qua lib/studio-ai.ts đến Server Action; phân tích trước, chưa sửa code.”
6. Review each requested edit, run typecheck/regression tests and verify the live deployment separately.

## Example tasks
- “Tối ưu builder Android @dnd-kit nhưng giữ JSON ui_tree và undo/redo.”
- “Kiểm tra lib/studio-ai.ts, auth, quotas và RLS; đề xuất cải thiện mà không kích hoạt chi phí.”
- “Sửa lỗi form Server Actions và thêm E2E test dùng Supabase thực, không tạo mock.”

The built-in admin-enabled app AI (Gemini/DeepSeek/OpenAI) is independent of Cline. **Cline free promotional models are IDE/CLI only, not free production Cline API access.** Adding a visitor-facing provider requires a real, supported API, server-only credentials, per-user limits, Admin opt-in and separate evidence of availability. No automatic API costs or production changes are authorized here.

Official docs: https://github.com/cline/cline/blob/main/docs/getting-started/free-models.mdx
