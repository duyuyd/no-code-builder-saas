# Security Policy

NuvoraCraft by NPTduy handles customer data, third-party credentials and generated source code. We take reports seriously.

## Private disclosures
Report suspected vulnerabilities through GitHub's private vulnerability report flow, if enabled:
https://github.com/duyuyd/no-code-builder-saas/security/advisories/new

Do not publish API keys, passwords, access tokens, database records or security proof-of-concepts in public Issues/PRs.

## Security expectations
- Server-side API secrets in Vercel encrypted Environment Variables only.
- Supabase RLS required on tenant/user-owned tables.
- Rate limits and authorization on AI and payment endpoints.
- No execution of untrusted AI-generated JS in the platform process.
- Verify payment webhooks and do not equate an internal ledger with third-party escrow.
- Rotate any secret accidentally posted publicly.

We do not promise a particular response SLA. Include a minimal reproduction and affected path without exposing customer data.
