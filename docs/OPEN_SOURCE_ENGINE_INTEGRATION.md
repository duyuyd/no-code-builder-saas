# Open-source engine assembly — NuvoraCraft

## Compatibility and source attribution

| Source | License | Integration | Note |
| --- | --- | --- | --- |
| [PlayCanvas Engine](https://github.com/playcanvas/engine) / [PlayCanvas React](https://github.com/playcanvas/react) | MIT | Installed `playcanvas@2.24.1`, `@playcanvas/react@0.11.7`; scene editor at `/game-builder/playcanvas` | Shares existing Supabase `studio_scenes.scene` JSONB, owner-scoped access and optimistic version saves |
| [Totalum Labs AI App Builder Open](https://github.com/totalumlabs/ai-app-builder-open) | MIT | Adapted prompt-driven UX at `/ai-builder` | Does NOT integrate Totalum proprietary hosted VCAAS API. Reuses NuvoraCraft's real OpenAI provider, schema-validated `ui_tree`, Supabase users/projects/pages |
| [ChaiBuilder Core](https://github.com/chaibuilder/core) | BSD-3-Clause | Data-compatibility adapter + owner-scoped import/export at `/builder/chai-import` | Its full editor expects its own DB (LibSQL/D1/better-sqlite3) and HTTP action protocol, not Supabase PostgreSQL page JSON. **The native Canvas remains active** until a verified editor migration is lossless |

Older `chaibuilder/sdk` was archived on 2026-09-12. Do not install a deprecated SDK into production in preference to `@chaibuilder/core`.

## Guardrails

- No new Supabase schema or third-party cloud services were created.
- Every page is stored in `pages.ui_tree` with existing RLS. Chai flat blocks are converted to the known nested component registry (only Box, Heading, Paragraph, Text, Button, Link, Image, Divider).
- Unsupported blocks, missing parents, cycles, dangling subgraphs and invalid types **reject the import instead of silently discarding user content**.
- Import appends nodes; does not overwrite the existing tree.
- Export requires all page node types to be supported; never silently exports incomplete content. Chai Tailwind classes do not map 1:1 to Nuvora styles, so imports warn.
- PlayCanvas adds an alternative 3D workflow, leaving the existing 2D GameWorkspace and React Three Fiber editor in place.
- AI Builder uses the current usage quota and admin-enabled server-side API configuration. No new key or paid provider.
- Replacing the production `<BuilderCanvas />` with `ChaiWebsiteBuilder` is **not yet done** because Chai's DB schema and page action API must be bridged and tested under Supabase RLS for tenant ownership, history, autosave and nested custom blocks. Blind replacement would break existing 74+ component projects. Treat this as a specific follow-up feature, not as completed.

## Verification

```bash
npm install
npm run typecheck
npm run build
npm run test:chai
```

Integration testing with authenticated Supabase projects is additionally required before declaring full editor migration or true AI-agent parity with Totalum.
