# NuvoraCraft Unified Editor + VIP

- Main /builder mounts the standalone ChaiBuilder editor and saves via the owner-scoped Next.js Server Action to the existing `public.pages.ui_tree`.
- Legacy node props and styles are preserved inside `NuvoraNode.source` in Chai's flat graph. Round-trip rejects unsupported nodes/cycles and relies on existing optimistic conflict detection. No data migration or deletion is needed: existing trees load dynamically.
- Chai standard components supported: layout Box, Row, Column; text Heading, Paragraph, Text; Button, Link, Image, Divider; Form, Input, TextArea, Checkbox, Select. New Chai blocks that cannot map to existing registry are rejected rather than silently lost.
- Existing advanced Quiz, Memory and custom components are preserved for live rendering and export. Some visual previews in Chai are placeholders; functionality resides in the persisted legacy tree. Edits to new unsupported widgets must be introduced via mapped blocks.
- The legacy custom 2D editor remains in repository history as a recovery path but is no longer mounted in /builder. 3D and Timeline remain available in /studio-3d.
- /import-figma reuses the real Figma REST API integration, requiring `FIGMA_ACCESS_TOKEN` in deployment environment (even for public URLs; Figma API still requires access).
- /video-studio previews a 12s 1280x720 animation driven by saved page content via Remotion Player and attempts direct MP4 H264 render in supporting WebCodecs browsers. It does not screen-record or create precise pixel video reproductions of arbitrary websites. Paid/cloud render service not enabled.
- /form-data uses the additive public.nuvora_forms metadata table and private_forms schema. `ensure_nuvora_form` creates physical typed per-Form tables with private access and RLS; `submit_nuvora_form` validates each submission and rate limits it, only for logged-in users; anonymous contact forms retain mailto fallback.
- Form table creation happens after Save and before Publish through owner-checked actions; not at UI drag start to avoid provisioning orphan tables.
- Compatible with original Vercel/Supabase deployments, no new paid services enabled.
