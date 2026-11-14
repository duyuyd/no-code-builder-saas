# No-Code Builder SaaS — Next.js 15

Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind CSS 4 + Framer Motion + dnd-kit + Supabase RLS. No ChatGPT Sites/Canvas or preview dependencies.

## Included

- Supabase Auth (email/password), `profiles` with admin/user role, `projects`, `pages`, `platform_settings`, `build_jobs` metadata.
- Supabase SQL policies (RLS). Users can modify only projects/pages they own; admin can edit platform settings. Admin promotion happens **only in Supabase SQL Editor**, never client code.
- Dynamic global theme and site title from `platform_settings` on every request.
- Admin form `/settings` with Server Action; `revalidatePath('/', 'layout')` updates theme on navigation/refresh after saving.
- Builder `/builder`: searchable **74** component definitions, drag/drop via dnd-kit, recursive containers, properties, undo/redo, Supabase autosave with 2-second debounce and optimistic version checks.
- HTML/React code generation and local file downloads. Components accept user-configured content, stored in `pages.ui_tree` in Supabase. No mock projects or example business records.

**Scope:** This is an implemented No-Code Builder MVP, not feature parity with FlutterFlow. Auth, visual editing, database persistence and static source export are included. Complex production widgets (e.g. live data charting, form submissions, payment integrations, Android/iOS native builds), external data source connectors and distributed build workers are not implemented. The `build_jobs` table reserves future async processing; no background build job is running.

## Prerequisites

- Node.js 22 LTS or compatible (Node 20.9+ for Next.js 15).
- A Supabase project (free plan can be used within limits).
- For deployment: a Vercel account and GitHub repository.

## 1. Install

```bash
npm install
cp .env.example .env.local
```

## 2. Supabase configuration

1. Create a new Supabase project.
2. Open **SQL Editor** and run the complete contents of `supabase/schema.sql` **once**.
3. Open **Project Settings → API** (or API Keys), copy your Project URL and publishable/anon public key to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. In **Authentication → URL Configuration**, set `Site URL` to `http://localhost:3000` while developing. For email confirmation, configure allowed Redirect URLs to include `http://localhost:3000/auth/callback` and your production `/auth/callback`.
5. Register at `/login`, verify the account email if email confirmation is enabled, then promote ONLY your intended user to admin by running in Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'YOUR_ADMIN_EMAIL' limit 1
);
```

**Never put the Supabase `service_role` / secret key into `.env.local` with `NEXT_PUBLIC_` or into GitHub.** RLS uses your per-user JWT and publishable/anon key. Avoid exposing admin credentials.

## 3. Run locally

```bash
npm run dev
```

- `http://localhost:3000/login` — register/login
- `http://localhost:3000/builder` — projects, pages and visual editor
- `http://localhost:3000/settings` — admin-only platform settings

Verify before deploying:

```bash
npm run typecheck
npm run build
npm run start
```

## 4. GitHub

Create an **empty** Public repository called `no-code-builder-saas`, then from project root:

```bash
git init
git branch -M main
git add .
git commit -m "feat: supabase no-code builder foundation"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/no-code-builder-saas.git
git push -u origin main
```

Do not commit `.env.local`. `.env.example` contains placeholders only.

## 5. Deploy to Vercel

1. On Vercel, select **Add New Project → Import Git Repository**, choose `no-code-builder-saas`.
2. Select Next.js framework. Keep root directory as `/` and commands at Next.js defaults.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SITE_URL` (e.g. `https://yourdomain.com`) as environment variables for the desired environments.
4. Deploy, then update Supabase **Authentication → URL Configuration** with the deployed domain and `/auth/callback` redirect URL.
5. Sign in, test RLS on two distinct user accounts, test Admin settings and auto-save before public use.
6. Enforce HTTPS and review email sending limits, RLS, deploy logs and dependencies before production traffic.

The CI workflow checks TypeScript and attempts a production build on `main` and pull requests. Supabase endpoint/key are required at runtime; the root layout intentionally has no fake settings fallback.

## Database structure

- `platform_settings(id,key,value JSONB)`: public readable; admin write only.
- `profiles(id,display_name,role,plan)`: self read; only `display_name` self update; no user role self-escalation.
- `projects(id,owner_id,name)`: owner isolated with RLS.
- `pages(id,project_id,path,ui_tree JSONB,version)`: tree persistence with optimistic concurrency.
- `build_jobs(id,project_id,status,artifact_url)`: read-only metadata for now; worker not implemented.

## Editor behavior

- Drag a palette item into Canvas (or press **+**), select the node to edit properties, drop onto the dashed slot within containers for nesting.
- Undo `Ctrl/Cmd+Z`, redo `Ctrl/Cmd+Shift+Z` or `Ctrl+Y` outside input fields.
- Autosave starts 2 seconds after tree modifications. Manual Save uses the same Server Action; non-overlapping concurrent edits can be merged; conflicting changes keep a per-tab draft without overwriting the other session.
- Export buttons download static generated HTML or React JSX/TSX to the browser; these files do not contain Supabase credentials.

## Limitations

- The registry provides 74 predefined element types with editable Prop/Style schemas. Some are semantic HTML variants or visual shells rather than feature-rich integrated applications. Data table/chart values are edited as node properties and persisted in Supabase, not populated from fake arrays.
- Drag/drop reordering is target-based (before the hovered node) with explicit nested drop zones, not pixel-precise freeform positioning.
- Exported components are static presentation code. Browser form actions and operational backend services must be added separately to deployed exports.
- SQL is intended for first-time installation; review policies/migrations before rerunning on a populated database.
- A platform-scale SaaS still needs billing, observability, rate limiting, audit trails, end-to-end tests and production build workers.


## Modules: Custom Domain, White-label, PDF E-sign

Database migration: `supabase/migrations/20261115_tenants_domains_esign.sql` (RLS enabled, original projects/pages unchanged).

- `/domains`: User-managed tenant branding (name, HTTPS logo, primary color), mapped published project, Vercel domain registration and DNS verification. The domain status is server-only.
- `/sign`: PDF page preview and visual handwritten signature placement; pdf-lib stamps the PDF; private Supabase Storage bucket `signed-pdfs` and immutable SHA-256 audit metadata in `public.esign_documents`. **This is an image-based electronic signature, NOT a cryptographic PKI/PAdES signature.**
- `/pricing`: Free/Pro/Agency plan descriptions from `platform_settings.saas_pricing`. Free is active; paid plans and payment collection are **not enabled**.
- Verified custom hosts show the tenant's published project via `/host-site/[[...slug]]`; unverified domains show nothing. Draft pages remain private.

### Vercel Project → Settings → Environment Variables

| Variable | Type | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Existing Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public (publishable key only) | User sessions |
| `NEXT_PUBLIC_SITE_URL` | public | Email auth redirects |
| `VERCEL_PROJECT_ID` | server-only non-secret | Domain project |
| `VERCEL_TEAM_ID` | server-only non-secret | Domain team |
| `VERCEL_TOKEN` | **server-only encrypted secret** | Add/verify Vercel domains |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only encrypted secret** | Verify/write tenant domain status |
| `HANZO_ESIGN_URL` | optional HTTPS | Link to a separately hosted Hanzo instance |

The project/team IDs are already set. Set the two missing secrets in Vercel's secure UI, **never in GitHub, chat, frontend variables or public code**. Redeploy after adding server environment variables.

To add a domain: sign in → `/domains` → save branding and choose a *published* project → submit a domain you control → add the TXT/other DNS records supplied by Vercel at your domain registrar → verify again. DNS and TLS may require additional time. Domain registration/purchase is **not** automated.

Upstream Hanzo eSign: https://github.com/hanzoai/esign (AGPL-3.0). This is a separate self-hosted app requiring its own runtime and services (React Router, Prisma/DB, SMTP). This repo does **not** fork or embed Hanzo. The local PDF-stamping MVP is independent; `HANZO_ESIGN_URL` links to Hanzo if you have separately deployed it. Advanced workflows (multi-party, invitations, PKI) remain unimplemented.

**Commercial hosting:** the current Vercel Hobby account is for noncommercial use. A commercial service will require an approved hosting/plan change; no paid plan or billing has been enabled.
