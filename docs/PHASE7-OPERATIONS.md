# Phase 7 · NuvoraCraft by NPTduy Native Runtime & Publishing

## Deployment scope
- Existing 2D/3D, projects and pages are retained. No Git replacement or paid provider activation.
- Build Center at `/native-build?project=UUID`, requires authenticated project ownership.
- NPC play-test at `/game-runtime?project=UUID`, loads only approved `studio_ai_prompts.proposal.behavior`. Executes validated state graphs, never arbitrary generated JavaScript. Three.js renders and `@alife-sdk/core/ai` provides GOAP action planning.
- Auth round trip at `/auth-diagnostics`: from an authenticated session, inserts, selects and deletes an isolated row; emits `STUDIO_AUTH_ROUNDTRIP_OK` only on success.
- Three.js XR store from `@react-three/xr`. AR/VR buttons require a supported secure-context device.

## Queue and security
1. Server Action verifies session, project ownership, page existence, per-project concurrency and env configuration. Inserts a `build_jobs` record.
2. Backend requests a fixed `workflow_dispatch` using an owner-controlled GitHub Actions workflow, not a YAML file generated from user input.
3. GitHub runner claims job via a restricted worker endpoint, downloads a server-generated Expo SDK 58 snapshot, builds native binary.
4. Runner gets a short-lived R2 PUT URL. Backend only records completion after verifying that the R2 object exists and has a nontrivial size.
5. User-specific GET endpoint issues a 5-minute R2 GET URL after verifying project ownership.

The runner must never receive a Supabase service role key or R2 root secret. No repository token or auth session is embedded into the app ZIP.

## One-time administrative configuration (no local installations for end users)
**Vercel server secrets:** `GITHUB_BUILD_TOKEN` (fine-grained token Actions: write for this repo), `STUDIO_RUNNER_TOKEN` (random >= 32 bytes), `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

**GitHub Actions secret:** `STUDIO_RUNNER_TOKEN` (same value as Vercel). **GitHub Actions variable:** `STUDIO_BASE_URL=https://no-code-builder-saas.vercel.app`.

**For signed iOS builds only:** configure an Expo/EAS project and Apple code signing credentials; set `EXPO_TOKEN` in GitHub Actions Secrets, `EXPO_PROJECT_ID` on Vercel and `ENABLE_IOS_BUILDS=true` on Vercel after verifying build-account costs and signing configuration. Without these prerequisites, iOS returns a configuration error, not a fake IPA. Android produces an actual debug-signed APK suitable for installation/testing, **not a store-ready release artifact**.

The user never needs the Android SDK, Xcode or Node installed locally. Runtime depends on GitHub-hosted runners and existing external accounts.

## Verification matrix
- GitHub CI: typecheck, Next production build, regression suites
- Supabase: migration applied and checked, RLS enabled
- Vercel: production deployment READY on intended main commit
- Manual production proof still required: sign into the deployed site and run `/auth-diagnostics` to test real session/cookie/write/read and inspect the resulting logged marker
- Native real APK proof still required: configure secrets, request an Android build, confirm runner log, HEAD check, artifact and R2 download
- AR/VR requires a supported Android/iOS device or headset with an immersive WebXR-enabled browser

No claim of working IPA or APK without an actual successful binary build.
