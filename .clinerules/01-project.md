# NuvoraCraft — repository architecture and priorities

Project: duyuyd/no-code-builder-saas (NuvoraCraft platform). Edit this repo, not a similarly named new repository.

- Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS v4, Framer Motion, Lucide React and @dnd-kit; follow package.json and existing patterns.
- Supabase is the authoritative source for all user/project/page data. Maintain RLS, auth boundaries and server-side authorization. No front-end mock arrays.
- All platform text/theme/configuration must honor platform_settings and admin values. Never hardcode customer-specific business data or forge AI output.
- Keep Next.js Server Actions for user form mutations. Do not add alternate write endpoints when an Action already provides the requested operation.
- Builder canvases use recursive ui_tree rendering, @dnd-kit and undo/redo; preserve compatibility with existing stored JSON and ChaiBuilder adapter.
- Existing AI plumbing: lib/studio-ai.ts supports Gemini, DeepSeek and OpenAI with admin opt-in, key checks and quotas; lib/openai.ts is server-only. Do not falsely treat free Cline coding-agent models as production API models.
- Long-running native builds, generative media and model jobs must be queued; never block request handlers or promise unavailable APK/IPA artifacts.
- Before changes to existing AI, builder or auth paths, run npm run typecheck, npm run test:ai, npm run test:unified and npm run test:v16 (as applicable), then npm run build. Report failures precisely.
- Preserve existing main branch and deployed domain; never change live providers, database policies, security-sensitive config or payments without explicit approval.
