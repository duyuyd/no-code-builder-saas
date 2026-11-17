# NuvoraCraft — God-tier ecosystem deployment notes

## Routes
- `/screenshot-to-app`: authenticated PNG/JPG/WebP upload (<=3 MB), call configured Gemini 3.8 Flash/OpenAI GPT-4o Vision, validate and store editable `ui_tree`.
- `/store/[projectId]`: public store for existing published projects; authenticated payOS checkout at `POST /api/checkout`, signed webhook `POST /api/checkout/webhook`.
- `/marketplace`: creator listings, searchable templates, signed paid checkout when enabled, verified buyer reviews, published page cloning. Internal `marketplace_ledger` does not custody funds or implement real automatic escrow/payout.
- `/domains` and `POST /api/domain/add`: existing Vercel domain API with authenticated owner, verified DNS and Supabase tenant branding; platform hostname is never routed as a customer domain.
- `/plugins` and `POST /api/plugins/install`: install commit-pinned JSON manifests only; worker interprets allowlisted text operations. Remote executable JavaScript is intentionally **not** executed in an unisolated first-party origin.
- `/app-runtime?project=UUID`: QR code opens published browser-based mobile web runtime. This QR is **not** an Expo Go app; native APK/IPA still require configured GitHub Actions, Cloudflare R2 and Expo signing.
- `/native-build?project=UUID`: RLS-protected realtime build status plus polling fallback.
- `/blog`: public original SEO articles, metadata and sitemap; `/blog/editor`: admin-only AI drafts/review. Vercel Cron `GET /api/cron/blog` runs daily but intentionally does **no AI call** until `AUTO_BLOG_ENABLED=true`, `CRON_SECRET`, curated topics, configured AI provider and owner-approved capacity.

## Provider secrets (set in dashboard; never commit)
- AI: `GEMINI_API_KEY` or `OPENAI_API_KEY`, and platform setting `studio_ai_config.enabled` + provider.
- Commerce: `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Keep `COMMERCE_PAYMENTS_ENABLED=false` until verified live merchant setup. Register the webhook URL in your payOS merchant dashboard and verify successful signed callbacks before accepting real payments. For marketplace orders, keep `MARKETPLACE_SETTLEMENTS_ENABLED=false` until seller settlement is established; the ledger does not custody funds.
- Domain: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`; tenant must be authorized as Pro/Agency/Admin. No new domain is purchased automatically.
- Native: GitHub Actions dispatch, R2 and Expo signing prerequisites documented in `docs/PHASE7-OPERATIONS.md`.
- Scheduled blog: `CRON_SECRET` and explicit `AUTO_BLOG_ENABLED=true` after budget approval. Generated articles remain drafts until an Admin publishes.
- Optional `PLATFORM_DOMAINS` comma-separated hostnames for custom main-platform domains to prevent tenant rewrites.

## Production readiness
- Browser/server route existence and Next build / TypeScript tests are CI-gated.
- Actual payOS live transactions, two-tenant white-label domains, plugin imports, AI image extraction and Expo builds cannot be claimed successful without provider credentials and end-to-end tests.
- No fake product, listings, transaction, reviews or pre-generated SEO articles are seeded into the user-facing application.
- Only marketplace templates with an owner-controlled, published source are eligible for cloning; paid purchases require webhook confirmation.
