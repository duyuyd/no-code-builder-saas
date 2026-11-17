# Multidimensional No-Code Studio — Master Architecture Blueprint

Repository: `duyuyd/no-code-builder-saas`. This plan **extends** the existing Next.js 15 + React 19 builder. It does not delete or overwrite existing features.

## Verified baseline (17 November 2026)

- `components/BuilderWorkspace.tsx`: dnd-kit UI tree editing, undo/redo history, autosave, publish/preview/export.
- `lib/component-registry.ts`: existing 2D registry and recursive validation.
- `components/CharacterViewport.tsx` and `lib/character-webgl.ts`: custom WebGL rendering. They are **not** R3F.
- `components/StudioAssistant.tsx` and `app/builder/assistant-actions.ts`: an authenticated Server Action with a provider adapter. When provider is unavailable it returns canned offline guidance. It is not an agent that executes edits.
- `lib/supabase/browser.ts`, `lib/supabase/server.ts`, `middleware.ts`: Supabase SSR auth. `Failed to fetch` cannot be diagnosed conclusively from static source alone.
- Root `app/` is the existing live Next.js application; it has **not** been moved into `apps/web-builder` in this nonbreaking foundation change.

## Engine boundaries

```text
Existing Next.js 15 web app (root app/)                  Future apps/web-builder/
 ├── BuilderWorkspace (2D, unchanged)                    (incremental move only)
 ├── 3D editor mode → client-only R3F scene               packages/engine-3d
 ├── Timeline mode → deterministic keyframe evaluator     packages/engine-4d
 ├── AI Logic mode → authenticated Server Action           packages/engine-ai
 └── WebXR mode → explicit capability detection           packages/engine-xr
          ↓                   ↓
  shared project / UI / scene / timeline models
          ↓
 Supabase PostgreSQL + RLS (owner-isolated records, JSONB versions)
          ↓
 asynchronous build jobs / export workers (future)
```

The words 4D, 5D and 6D are **product modes**, not additional physical spatial dimensions.

## R3F / Next.js SSR

Keep React Three Fiber and `three` in a `"use client"` component, loaded via `next/dynamic(() => import("./SceneEditor"), { ssr: false })` **inside a Client Component**. Never access `window`, `document`, `navigator.xr`, `WebGLRenderingContext`, or GPU in server components or module initialization. Provide an accessible loading fallback, canvas error boundary, `webglcontextlost` recovery, reduced-motion fallback and mobile GPU limits. Keep existing custom WebGL components in place until parity is demonstrated. Use explicit `three`, `@react-three/fiber`, `@react-three/drei` compatible versions and lockfile when the actual integration is added; this foundation does not claim R3F is already installed.

3D scene nodes: stable UUID, primitive type (box, sphere, plane), parent ID, transform (position, rotation, scale), materials (color/roughness/metalness), and asset references. Never execute untrusted user code as a scene or material script. Store normalized objects in versioned JSONB. For performance use instancing and load assets on demand; mobile gestures must not collide with page dragging.

## 4D Animation / time

Use a time-axis timeline; each keyframe has scene object ID, property path, timestamp in milliseconds, typed value and interpolation (`step` or `linear`). Evaluate via a **pure deterministic function** at any time, then apply transforms to R3F. Timeline edits have undo/redo and autosave; preview playback is client-side and does not write on every frame. Server validates max duration, property whitelist, keyframe count and finite values. Keep animations in `studio_timelines.timeline JSONB` and `version` for optimistic concurrency. A `studio_scenes` row may represent one scene per page.

## 5D AI / NPC logic

Prompts reside in `studio_ai_prompts` with owner, project, optional page, prompt, structured approved output and timestamps. The AI provider secret stays **server-only**; never store it in the browser or project JSONB. The existing provider adapter and quota RPC are reused, but free-text generation is **not** directly executable. Parse to a constrained, validated behavior graph (states, transitions, triggers, allowed actions). Expose `propose → preview/diff → owner approval → apply via Server Action`. Queue long-running inference and return job IDs; do not block a Server Action for expensive processing. An NPC's autonomous behavior is bounded by project permissions and deterministic runtime actions. If no AI provider or API key is configured, the UI displays an honest "AI not connected" state and does not produce simulated agent answers. Never initiate billable calls without explicit opt-in.

## 6D / WebXR

Use supported browser `navigator.xr?.isSessionSupported(...)` **after mount** and user activation for `requestSession`. Separate AR and VR support; retain a 2D/3D fallback for unsupported devices. A web XR experience and a React Native Android/iOS package are different runtimes: do not imply that exporting a Next.js site automatically yields a native XR app. Generate target-specific artifacts through a queued build pipeline after platform validation.

## Supabase persistence and migration

Run **additive** migration `supabase/migrations/20261117_multidimensional_studio_foundation.sql` on an existing Supabase database. It creates `studio_scenes`, `studio_timelines`, `studio_ai_prompts` with FK to `projects`/`pages`, timestamps, owner-scoped RLS, indexes, JSONB shape constraints and *no deletes of old tables*. Apply and verify against production schema before enabling new UI. Maintain old `pages.ui_tree` unchanged; link new scene via `page_id`. Use an explicit `version` field, compare-and-swap update on the server and conflicts handled in the UI. AI prompt text is private by default. Asset uploads go to owner-scoped Supabase Storage, never embed API tokens.

## Turborepo migration: two-stage, nonbreaking

1. **This branch:** add documented engine package boundaries as actual typed source directories, plus schema migration and pure timeline tests. Do not relocate the active root app or add new runtime dependencies in the same change.
2. **Next branch:** introduce `pnpm-workspace.yaml`, root `turbo.json`, package manifests, and move the app to `apps/web-builder` in a single reviewable change after lockfile, CI, Vercel root and import aliases are updated. Provide temporary compatibility reexports. Keep old routing and URLs, user content, component registry and database rows intact. Confirm production build, export tests, AI tests and mobile interaction before merging. The directory layout alone is not a working Turborepo.

Target packages: `packages/engine-2d`, `packages/engine-3d`, `packages/engine-4d`, `packages/engine-ai`, `packages/engine-xr`, `packages/shared-schema` and `apps/web-builder`. New packages should be consumed behind an adapter so missing 3D hardware/AI credentials don't break 2D.

## Component classification

The current registry has component definitions. Preserve every ID/type and add **non-destructive tags** such as `engine: "2d" | "3d" | "ai"` or a separate classification map. Existing 2D components default to 2D. Specialized 3D/AI definitions are separate until the recursive renderer can dispatch by engine. Do not rename component types in saved UI trees.

## Auth / "Failed to fetch" diagnosis

Audit deployment `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, project hostname/DNS, CORS, proxy and network requests, cookie state, OAuth redirect allowlist, auth callback and server logs. In middleware the `getUser()` call can fail due to network while rewriting; isolate public routes and show a typed error instead of an unhandled rejection. Distinguish network error, expired session, missing env, RLS denial and Supabase downtime. Never claim this is fixed without reproducing in deployed environments and verifying login, logout, refresh and mobile flows.

## Safe release gates

- Restore 2D editor/page/drag/drop/undo/redo/autosave/publish/export on desktop and Android.
- Run `npm run typecheck`, `npm run build`, `npm run test:export`, `npm run test:ai`, plus new timeline evaluator tests.
- Check RLS with two different owners and unauthenticated client; verify rejection of cross-tenant reads/writes and invalid JSONB payloads.
- Validate rendered 3D objects, drag/selection/material changes, timeline seeking, WebGL fallback, AI provider unavailable and provider error handling.
- Keep changes on a feature branch, open a draft PR; **do not merge to main or deploy without CI evidence**.
