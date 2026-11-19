# NuvoraCraft by NPTduy — v14 verification commands

All commands below are **expected-output contracts, not claims of a successful live test**.
The draft PR must remain unmerged until the Founder posts `VERIFIED`.

## Task 1 — Chai migration, dependency lock and branding

```bash
git clone https://github.com/duyuyd/no-code-builder-saas.git
cd no-code-builder-saas
git fetch origin release/v14.0
git switch --track origin/release/v14.0
npm install --no-audit --no-fund
npm run test:unified
npm run test:v14
npm run typecheck
npm run build
git grep -n -F "$(printf '%s%s' 'No' '-Code Builder')" || test "$?" -eq 1
```

Expected regression output: `PASS Chai unified round-trip preserves original editable components and detects corrupt graphs.` and `PASS v14 dependency lock, Chai migration, Figma 401, Remotion 15s, and form DDL contracts`. Typecheck/build exit 0. `git grep` prints no matching lines. The legacy canvas has not been removed until equivalence is verified.

## Task 2 — Real Figma request, invalid credential

Start the app with configured Supabase environment variables and `npm run dev`, then run:

```bash
curl -si -X POST http://localhost:3000/api/figma \
  -H 'Content-Type: application/json' \
  --data '{"figmaUrl":"https://www.figma.com/design/ABCDEFGH/demo","figmaToken":"invalid","projectId":"00000000-0000-0000-0000-000000000000","pageId":"00000000-0000-0000-0000-000000000000"}'
```

Expected unauthenticated response: HTTP 401, header `X-Founder-OTP: OTP-FOUNDER-999`, JSON `{"ok":false,"error":"Unauthorized"}`. This does not validate a successful authorized Figma import. Authorized testing needs a read-scope Figma token belonging to the tester, entered only into the secure form; never commit or publish a token.

## Task 3 — Real Remotion MP4

Open `/video-studio?project=<UUID>&page=<UUID>` on an authenticated running app and choose **Render Video bằng Node Server**. For an MP4 downloaded as `nuvoracraft-server-demo.mp4` to the current directory:

```bash
ffprobe -v error -show_entries stream=codec_name -show_entries format=format_name,duration,size -of json nuvoracraft-server-demo.mp4
```

Expected JSON fields: `"codec_name": "h264"`, duration approximately `15.000000`, an MP4-compatible `format_name`, and `size` greater than 1048576 bytes. Nothing is considered complete until a real generated file passes. The Node route requires a self-hosted runtime with Chromium/FFmpeg and enough execution time; Vercel availability is not proven by TypeScript/CI.

## Task 4 — Owner-only physical PostgreSQL tables

Open Chai Builder on a saved project containing a Form with input fields. Use **Form Database → Tạo bảng Database**. Query the connected Supabase SQL editor:

```sql
select table_schema,table_name
from information_schema.tables
where table_schema='private_forms'
order by table_name;
```

Expected: at least one `private_forms.f_<uuid_without_hyphens>` row after a successful creation. Verify the columns with:

```sql
select column_name,data_type
from information_schema.columns
where table_schema='private_forms'
order by table_name,ordinal_position;
```

Live creation and RLS access isolation must be manually verified; this document does not apply SQL or modify production data.
