# NuvoraCraft by NPTduy — Execution Progress

Updated: 2026-11-18 (Asia/Ho_Chi_Minh)
Repository: `duyuyd/no-code-builder-saas`; production branch: `main`.

## Operating principles
- Avoid repetitive “Implementing Chai Builder Integration” loops. Prefer a small, verified change to an all-or-nothing editor rewrite.
- Preserve existing `pages.ui_tree` JSONB and existing project data. Do not overwrite or delete stored layouts as a side effect of importing.
- If ChaiBuilder cannot represent an existing node, retain the original node and allow manual import/review.
- Record actual checks and commit IDs. Only mark a task complete after evidence; CI green does not by itself prove Vercel READY.
- Do not enable paid services or incur costs without approval.
- On a future “Tiếp tục”, read this file and the latest GitHub Actions results first.

## Baseline
- [x] Inspected the current repository and default branch `main`.
- [x] Confirmed latest inspected main branch CI “Typecheck and Build” passed at commit `7f12cf30267790dee16a8608a4391d4607c0cb01` (run `44141836771`, 2026-11-17).
- [x] Identified existing integration: `components/chaibuilder/UnifiedChaiEditor.tsx`, `lib/unified-chai-bridge.ts`, and manual import `app/builder/chai-import/`.
- [ ] Confirm a real Vercel production deployment is READY for the latest commit.

## Task 1 — Unified editor + branding (IN PROGRESS)
- [x] Existing Chai editor and reversible legacy JSON bridge found.
- [x] Existing manual Chai JSON import found (append-only + owner-scoped).
- [x] Fixed missing Chai `content` clearing legacy text in `lib/unified-chai-bridge.ts` (commit `6a196c8`).
- [x] Added missing-content/explicit-text-edit regression cases to `tests/unified-editor-regression.cjs` (commit `505cb52`); existing tests already cover round-trip, unsupported blocks and cycles.
- [x] CI run `44143605576` passed for previous checkpoint `3a93255`, including typecheck, build and regression steps.
- [x] Added explicit legacy 2D editor fallback using `?mode=legacy` without overwriting `ui_tree` (commits `638d0aa`, `067bc4d`).
- [x] Updated root metadata to `NuvoraCraft by NPTduy`, removing the legacy `NPTduy Studio` keyword (commit `87f0769`).
- [x] Added a regression assertion protecting the legacy editor fallback route and toolbar (commit `8d349a8`).
- [x] GitHub Actions `44144723328` succeeded for `8d349a8`; `44144764682` succeeded for progress checkpoint `e7e351c`.
- [x] Added regression cases for duplicate IDs, missing parents and corrupt source JSON in the Chai bridge (commit `438eb5d`); this changes tests only, not production data.
- [x] CI `44154569741` passed on `438eb5d`; CI `44154584910` passed on `71dc354`.
- [x] Guarded Chai bridge text/label precedence so unchanged text cannot unexpectedly mutate label (commit `b1181ce`); added label-only regression coverage (commit `ba9754e`).
- [x] CI `44165494653` succeeded for checkpoint `f23b451`; CI `44165478159` succeeded for label regression `ba9754e` (verified 2026-11-18).
- [x] Added validation rejecting numeric/blank Chai parent identifiers (commit `ab4cc0c`) and regression coverage (commit `63ca5c1`), preventing silent re-rooting of existing blocks.
- [x] CI `44175502206` passed for parent validation test commit `63ca5c1`; CI `44175522503` passed for progress checkpoint `0b21f05`. CI `44186230011` passed for subsequent native-content validation `0d1be78`.
- [x] Reject malformed native Chai link payloads before conversion (commit `9e48933`), with regression cases for numeric `href` and non-object `link` (commit `b864be4`).
- [x] CI runs `44186771079` (`9e48933`), `44186784358` (`b864be4`), and `44186802832` (`164f952`) succeeded for native Chai link validation.
- [x] Added native Chai image/alt/name/placeholder type validation (commit `27f91bb`) and four regression cases (commit `7544ce3`) to reject malformed input without modifying stored pages.
- [x] Verified attribute-validation CI runs `44195570944`, `44195590793` and progress checkpoint `44195610948` all passed (2026-11-18).
- [x] Added strict rejection of non-string legacy Chai `content` (commit `003af26`) and a regression case (commit `862e7c7`); no Supabase writes or migrations.
- [ ] Verify CI on the new legacy content guard; finish public brand audit and verify Vercel READY.
- [ ] Audit landing, README, metadata and public UI for obsolete product titles; retain historical technical references where needed.
- [ ] Verify tests, TypeScript, build and deploy before replacing any active editor.

## Task 2 — Figma Import
- [x] Existing `/import-figma` route and `lib/figma-import.ts` found.
- [ ] Test real authorized Figma input and persisted `ui_tree`; fix evidenced defects.

## Task 3 — Video Studio
- [x] Existing `/video-studio`, Remotion components and demo workflow found.
- [ ] Verify actual 15-second MP4 rendering and download, not just preview.

## Task 4 — Auto-Database
- [x] Existing `lib/auto-database.ts`, form migration, and form test found.
- [ ] Validate tenant isolation, migrations and form-to-schema creation behavior.

## Task 5 — Commerce & templates
- [x] Existing payOS integration, `/pricing`, commerce and templates found.
- [ ] Validate payment flow in sandbox before production activation.

## Task 6 — SEO & multilingual blog
- [x] Existing blog, editor, sitemap and robots routes found.
- [ ] Evaluate i18n and automated blog generation; require editorial review before publishing.

## Task 7 — Quality / delivery
- [x] Last inspected main CI was green.
- [ ] Confirm latest commit CI and check Vercel deployment READY.
- [ ] Validate mobile UI and remaining runtime defects.

## Resume protocol
1. Read `PROGRESS.md`.
2. Check main/head SHA, recent commits, CI and outstanding PRs.
3. Finish the earliest unchecked item with a focused, non-destructive change.
4. Run applicable tests and document outcomes; do not claim unverified completion.
5. Update this file in the same working session.

No continuous overnight execution is implied by this file: a separately configured scheduled runner is required.

## Absolute Lockdown v14 (release/v14.0; 2026-11-18 22:05 Asia/Ho_Chi_Minh)
- [x] Created isolated release branch from `4146f055`; main untouched.
- [x] Main CI `44203677608` completed successfully before work.
- [x] Task 1: Added lossless `migrateToChai(tree)` and regression parity coverage; existing `ui_tree` remains canonical. CI verification still pending.
- [ ] Task 1: Retire the former canvas files ONLY when import/render equivalence and replacement UI have been proven; preserve a working legacy fallback meanwhile.
- [ ] Task 1: Audit dynamic branding sources and grep obsolete public branding.
- [x] Task 2: Added authenticated `POST /api/figma`, per-request token, strict 401 response header, real API request and owner-scoped append-to-page; live token check pending.
- [x] Task 3 code: 450 frames at 30 FPS in preview/browser, registered Remotion composition and Node MP4 render endpoint. Actual ffprobe / >1MB media verification and production Node runtime verification pending.
- [x] Task 4 code: Added authenticated `POST /api/create-table`, validates against saved form tree, calls existing physical-DDL RPC; Chai toolbar offers a table-creation panel. Live Supabase verification pending.
- [ ] Confirm release branch CI and human VERIFIED before any main merge. No paid services enabled.

### v14 validation evidence
- [x] Added fully pinned package versions, `@figma/rest-api-spec`, `figma-api`, `@remotion/bundler`, `@remotion/renderer`, and `test:v14` contract script.
- [ ] Confirm dependency resolution, TypeScript, Next.js build, all regressions and runtime behavior using release PR CI.
- [ ] Run full brand audit for the retired product title; also check dynamic settings and generated assets.
- [ ] Owner review: permanently delete legacy canvas modules only after proving equivalent capability, preserving project data and a working fallback until then.
- [ ] Obtain Founder comment `VERIFIED` before merge. No merges performed.

### CI and Supabase read-only checkpoint (2026-11-18)
- [x] Main baseline run `44203677608` green, release PR draft #17 opened; main not merged.
- [x] Release CI `44332898691` failed at Typecheck because initial pinned `@types/node 22.0.0` conflicted with Node Buffer signatures. Updated exact pin to `22.20.5` in `833eee4`; new CI not yet verified.
- [x] Supabase read-only inspection confirmed `public.ensure_nuvora_form(uuid,text,jsonb)`, `public.nuvora_forms`, and `private_forms` schema exist; zero form metadata rows and no user form tables created during this work.
- [x] Live public `site_title` is currently `NuvoraCraft`; new conditional release migration stages full `NuvoraCraft by NPTduy` title, NOT applied to live DB.
- [x] Brand audit step added to PR CI, verifying retired titles are absent from tracked files.
- [ ] Run complete PR CI after the TypeScript repair; perform live functional tests before Founder approval.

### v14 release CI checkpoint
- [x] CI run `44333361436` passed on `833eee4`: npm install, TypeScript, Next.js production build, all legacy regression suites and `test:v14` (GitHub Actions verified).
- [x] Added owner-scoped Node rendering button, security origin check to Figma API, staged brand migration, and runnable test instructions in `docs/V14_RUNBOOK.md`.
- [ ] Verify latest branch head CI after `155f7cf`; verify real 15-second video via ffprobe and >1MB, authentic Figma import, and physical table creation.
- [ ] Legacy canvas removal still gated on full behavior parity, otherwise it would disable the only proven recovery editor.
- [ ] Neither PR merge nor Supabase writes have occurred. Await Founder VERIFIED.

## v15.0 — Execution proof (2026-11-18)
- [x] Created release/v15.0 from v14 head; main remains untouched.
- [x] Physically deleted components/CanvasNode.tsx, components/BuilderCanvas.tsx, components/BuilderWorkspace.tsx on release branch.
- [x] Replaced former custom canvas URL with functional read-only JSON inspector and original-tree export; ChaiBuilder remains sole visual editor.
- [x] Kept migrateToChai()/fromUnifiedChai() lossless bridge and historical JSONB untouched.
- [x] Added v15 source-deletion and retired-brand regression with SHA-256 CI file hashes.
- [x] Committed GitHub Actions workflow to execute actual curl against Next.js Figma API, render actual Remotion MP4 and run ffprobe; results not yet observed.
- [x] Created real private_forms.v15_execution_proof_20261118 via authorized Supabase migration. Subsequent live query returned RLS=true and columns id(uuid), contact_name(text), contact_email(text), score(numeric), is_active(boolean), created_at(timestamptz). This proves physical DDL only, not authenticated create-table HTTP/RPC.
- [x] Added requested footer marker OTP-FOUNDER-999 to release branch source; NOT live production until deployment.
- [ ] PR CI and proof workflow execution logs verified for release/v15.0.
- [ ] Invalid Figma-token response under a valid authenticated session tested, as distinct from an unauthenticated HTTP 401 test.
- [ ] Actual MP4 >1MB / H264 / 15 s verified by ffprobe and stored artifact.
- [ ] Authenticated /api/create-table endpoint invoking ensure_nuvora_form via real user session tested. Current proof table was created using Supabase DDL migration.
- [ ] Vercel deployment for v15.0 verified READY; do not treat source changes as live production.
- [ ] Founder comments VERIFIED on release PR before merge.

### Verified execution checkpoint — 2026-11-18

- [x] REAL CI `44336206255` on v15 release succeeded: Typecheck, Next production build, bridge tests, exact versions, retired-brand grep, deleted old canvases, actual SHA-256 from `sha256sum`. ChaiBuilder primary; read-only source inspector remains.
- [x] REAL CI `44336206081`: Next production server responded `HTTP/1.1 401 Unauthorized`, header `x-founder-otp: OTP-FOUNDER-999`, body `{"ok":false,"error":"Unauthorized"}`. Unauthorized test only; upstream Figma token not verified in authenticated session.
- [x] REAL CI `44337446866`: Remotion `450` frames at `30` FPS, 1280×720, actual MP4 `5876891` bytes. `ffprobe` exit 0 reported H.264, 15.000000 seconds, size 5876891 bytes; MP4 SHA-256 `63c1c502247f445c7abc68f3d1657d6506f5ab0c31c65f8cccbe5d0b1fcc7299`. Artifact ID `14443175851`. This is local CI renderer, not Vercel runtime.
- [x] REAL Supabase `apply_migration`: created `private_forms.v15_execution_proof_20261118`, six verified columns, RLS enabled, all client table privileges revoked. This verifies physical DDL, NOT authenticated web /api/create-table RPC.
- [x] REAL Supabase `apply_migration`: revoked anonymous execute on 3 sensitive form RPC functions; post-migration query confirmed `anon_ensure=false`, `anon_submit=false`, `anon_list=false`, `signed_in_ensure=true`. Security advisor no longer reported anonymous executable SECURITY DEFINER functions. Tracked SQL migration `20261118_v15_revoke_anon_form_rpc.sql`.
- [x] Detailed raw evidence and limitations captured in `docs/V15_EXECUTION_PROOF.md`.
- [ ] Verify newest v15 HEAD GitHub Actions, including bundled ffprobe improvement, before declaring final HEAD green.
- [ ] Verified authorized Figma API request with invalid token and real import with valid token.
- [ ] Verified authenticated /api/create-table end-to-end against saved form with correct owner session.
- [ ] Live v15 Vercel READY deployment and footer OTP: not deployed / not verified. Main never merged.
- [ ] Wait for explicit Founder `VERIFIED` comment on PR #18 before merging.

### v15 final code checkpoint
- [x] CI `44338305826` succeeded for release SHA `6b6b517`: full TypeScript, Next.js build, regression tests, source deletion and branding checks.
- [x] CI `44338306345` succeeded for release SHA `6b6b517`: live Next HTTP 401 verification and actual Remotion-compositor bundled `ffprobe`; output H264, 1280x720, 15.000000s, 5963357 bytes, SHA256 `3bbd96d811552312249601f2c34b7844e1ffde0a31f65eef041ebdaa2afb2ad4`; artifact `14442487454`.
- [x] Fixed `docs/V15_EXECUTION_PROOF.md` reintroducing a retired title into the Git grep search (PR run `44338834930` failed on document, not application code).
- [ ] CI validation of the final proof-document and progress-only commits; do not mark final HEAD green before GitHub reports success.
- [ ] Preserve draft PR #18 unmerged pending Founder VERIFIED. Production deploy not verified.

## v16.0 production UI + visual E2E (2026-11-19)
- [x] PR #18 was explicitly approved by Founder and merged into main at commit `5b5360b788b72b5ccb99537609b5a31fafdf35b6`. Both v15 head CI workflows passed before merging.
- [x] Vercel production deployment `dpl_9BHc5D8FgCxdMTCBsM3mPuJK2hgG` verified READY, branch main SHA `5b5360b`, aliases `https://no-code-builder-saas.vercel.app` and `https://no-code-builder-saas-npt-duy.vercel.app`.
- [x] Created `release/v16.0` from merged main; separate feature work not deployed to production.
- [x] FormDatabasePanel uses authenticated real `POST /api/create-table`, disables while loading, shows animated spinner and accessible corner success/error toast.
- [x] Figma import uses real `POST /api/figma`, masks token, disables while loading, shows animated spinner and accessible corner success/error toast.
- [x] ChaiBuilder toolbar exposes Figma import inputs directly, preserving dedicated `/import-figma` page.
- [x] Added pinned `@playwright/test` `1.56.1`, `playwright.config.ts`, and `tests/e2e/production.spec.ts` for real Vercel home/OTP, auth, database-create, Figma-error, published-form-submission, screenshots and video.
- [x] Added GitHub Actions workflow that uploads Playwright HTML report, screenshots, traces, and videos to artifact.
- [x] First Playwright CI identified unsupported default ubuntu26.04 runner. Updated workflow to supported ubuntu-24.04; browser verification pending.
- [ ] Playwright public production smoke: verify actual screenshot/video artifact after retry.
- [ ] Protected end-user E2E requires dedicated test credentials and a saved/published Form; without these, signed-in test explicitly SKIPs and must not count as passing. Never fabricate authenticated results.
- [ ] Re-run all TypeScript/build/UX regressions for v16 PR and verify preview deployment.
- [ ] Do not conflate v15 READY with v16 UI release. Require verified v16 deploy before declaring production UX done.

### v16 real browser checkpoint — 2026-11-19
- [x] GitHub Actions public Chromium E2E `44545994129` SUCCESS: production homepage returned HTTP 200, founder footer marker visible, Figma unauthenticated API returned HTTP 401 with marker header, /builder redirected to login. Actual output: 1 passed, 1 skipped (signed-in test not configured). Screenshots, video, and Playwright report uploaded to artifact `14540048420` (~3.6MB), URL `https://github.com/duyuyd/no-code-builder-saas/actions/runs/44545994129/artifacts/14540048420`.
- [x] GitHub Actions Typecheck/production build `44545993916` SUCCESS for v16 branch SHA `df4a902`, prior to last API response header and toast refinements.
- [x] API `/api/figma` and `/api/create-table` now set immutable release verification response marker on every status without treating that marker as authentication.
- [x] Figma success toast stays visible briefly before Builder navigation.
- [ ] Newest v16 head TypeScript/build, regression and Playwright public checks require completion/read-back.
- [ ] Signed-in production UI actions require dedicated test account credentials and saved/published Form; no secrets inserted into source or GitHub from this chat. Production v15 is READY; v16 changes have NOT been merged or deployed.
