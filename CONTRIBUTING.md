# Contributing to NuvoraCraft

Welcome. NuvoraCraft by **NPTduy** welcomes engineering, documentation, accessibility, design and testing contributions.

## Getting started
1. Check [Issues](https://github.com/duyuyd/no-code-builder-saas/issues) and [Roadmap](docs/ROADMAP.md); comment before attempting major architecture changes.
2. Fork the repository and create a branch named `fix/...`, `feat/...` or `docs/...`.
3. Install Node.js 22 and run `npm install`. Create `.env.local` from `.env.example` without committing secrets.
4. Make a focused change. Preserve the recursive Builder tree, Supabase RLS, existing functionality and dynamic platform settings.
5. Run `npm run typecheck`, `npm run build` and relevant `npm run test:*` scripts. Add regression coverage for bugs.
6. Open a PR describing the problem, solution, tests, and mobile impact. UI PRs should include screenshots or a short screen recording.

## Engineering standards
- Next.js App Router, React 19, TypeScript strict, Tailwind v4, `@dnd-kit/core`, Supabase with RLS.
- No fabricated packages, fabricated API responses, placeholder business data or secrets.
- Official OpenAI SDK on the server only. All model outputs validated before storage or execution.
- Use Next.js Server Actions for form mutations. An API route is appropriate for external JSON integrations/webhooks.
- Avoid breaking changes and destructive migrations; preserve existing data.
- Do not claim paid third-party services work without end-to-end evidence.
- Respect content authorship and accessibility.
- Never open a PR with an API key. If exposed, rotate it immediately and notify maintainers privately.

## Review and release
Small PRs and one feature per change are easier to review. Maintainers decide when an issue is ready to merge based on CI, UX, data safety and production readiness.

**Note on licensing:** this repository does not currently publish an explicit license. Please ask about contribution and distribution terms before incorporating third-party code or assets.
