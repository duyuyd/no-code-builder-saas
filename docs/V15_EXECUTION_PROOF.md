# NuvoraCraft v15 — Actual execution evidence

Run time: 2026-11-18, GitHub Actions Ubuntu runner. Source branch: `release/v15.0`.
Pull request: https://github.com/duyuyd/no-code-builder-saas/pull/18 (DRAFT; MUST NOT MERGE BEFORE `VERIFIED`).

## Task 1: ChaiBuilder replaces the custom canvas

CI Typecheck and Build: https://github.com/duyuyd/no-code-builder-saas/actions/runs/44336206255 — **SUCCESS**.

Actual stdout:
```text
DELETED components/CanvasNode.tsx
DELETED components/BuilderCanvas.tsx
DELETED components/BuilderWorkspace.tsx
CHAIBUILDER_PRIMARY=PASS
SAVED_JSON_INSPECTOR=PASS
GREP_ZERO_MATCHES="No-Code Builder"
GREP_ZERO_MATCHES="NPT Duy Studio"
PASS v15 - legacy canvas deleted, Chai is primary, no retired brand matches.
```

SHA-256 of `app/builder/page.tsx`: `43d4f796b097b7bc01c6432d761429d91541a874ecacd32b82d7ccd66f95fec1`.

The old custom editor is physically removed, and a read-only original JSON inspector/export remains. There was NO conversion or destructive update of stored Supabase `pages.ui_tree`.

## Task 2: Actual HTTP 401 for Figma import

Real Next.js server running in GitHub Actions:
https://github.com/duyuyd/no-code-builder-saas/actions/runs/44336206081

Actual response:
```http
HTTP/1.1 401 Unauthorized
x-founder-otp: OTP-FOUNDER-999

{"ok":false,"error":"Unauthorized"}
```

`PASS V15 REAL HTTP 401 AND OTP HEADER`

SHA-256 of `app/api/figma/route.ts`: `bf9a8acce342ce15d1d940c64850a2ab42d45487fe37d1aca74c3c9244127aed`.

**Limitation:** this was an unauthenticated request, NOT an authorized session with an invalid upstream Figma token. No valid Figma import has been demonstrated.

## Task 3: Real MP4 render + ffprobe

GitHub Actions complete SUCCESS: https://github.com/duyuyd/no-code-builder-saas/actions/runs/44337446866

Artifact containing MP4, HTTP logs and rendering logs:
https://github.com/duyuyd/no-code-builder-saas/actions/runs/44337446866/artifacts/14443175851

Actual stdout:
```text
RENDER_FRAMES=450 FPS=30 SIZE=1280x720
MP4_BYTES=5876891
MP4_SHA256=63c1c502247f445c7abc68f3d1657d6506f5ab0c31c65f8cccbe5d0b1fcc7299
FFPROBE_EXIT_CODE=0
FFPROBE_STDOUT_BEGIN
{
  "streams": [{"codec_name": "h264", "width": 1280, "height": 720}],
  "format": {
    "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
    "duration": "15.000000",
    "size": "5876891"
  }
}
FFPROBE_STDOUT_END
PASS V15 REAL REMOTION VIDEO PROOF
```

**Limitation:** proves Remotion MP4 composition rendering via real Node CI, not a successful video download from live production.

## Task 4: Real Supabase PostgreSQL DDL + permissions

Project: `vfavjxfodmtqaewtftmd` (actual connected Supabase). A migration named
`v15_execution_proof_private_form_20261118` returned `{"success":true}`.

Actual readback via Supabase SQL:
```json
{
  "schema_name":"private_forms",
  "table_name":"v15_execution_proof_20261118",
  "rls_enabled":true,
  "columns":[
    {"column":"id","type":"uuid"},
    {"column":"contact_name","type":"text"},
    {"column":"contact_email","type":"text"},
    {"column":"score","type":"numeric"},
    {"column":"is_active","type":"boolean"},
    {"column":"created_at","type":"timestamp with time zone"}
  ]
}
```

Additionally, the existing Supabase advisor revealed anonymous EXECUTE on three definer form RPCs; the revocation migration `v15_revoke_anon_form_rpc_execute_20261118` was **applied successfully**. Privilege query readback:
```json
{"anon_ensure":false,"anon_submit":false,"anon_list":false,"signed_in_ensure":true}
```

**Limitation:** actual DDL executed through Supabase migration, not through a real authenticated end-user POST to `/api/create-table`. No `pages.ui_tree` record was overwritten.

## Release control

- Live v15 Vercel deployment: **NOT VERIFIED** (no deployment recorded on `release/v15.0` when inspected).
- `main` unchanged, no PR merge.
- Required Founder approval: explicit `VERIFIED`.
- Latest on-branch verification beyond the cited runs: still pending at time of this checkpoint.
