# Secuvora — Inspection console and scan-engine contract

## What shipped

The inspection console lives at /assess/scanning. From /assess, choose “Preview scanning workspace” to inspect the design without connecting a repository.

This includes a **working limited public-source scanning integration** (not a full security audit):
- /assess/scanning?repo=owner/repo streams real source-analysis check statuses from /api/scan/public. The no-repo state remains idle.
- Five interactive analysis layers explain intended coverage and limitations.
- An arbitrary ?run= parameter cannot impersonate a scan: the API fails closed with HTTP 503.

## Architecture

- lib/public-repo-scanner.ts — public source acquisition from GitHub, static source candidates, pinned npm/PyPI OSV advisory matching, bounded coverage and redaction.
- app/api/scan/public/route.ts — bounded server-side NDJSON streamed scan endpoint; transient in-memory processing.
- lib/assessment-contract.ts — strict typed AssessmentSnapshot and validation.
- app/api/assessments/[runId]/route.ts — GET status and DELETE cancellation boundaries; currently both 503/no-store.
- components/ScanningConsole.tsx — reads worker-confirmed status with polling only when given a valid run ID.
- tests/scanning.spec.ts — desktop/mobile browser tests, API denial, interactive layers.

## Required real integration

1. Require authenticated session **and authorization for that exact run** for every GET/DELETE. Run ID is not an authorization token.
2. Issue unguessable IDs; persist protected worker job state.
3. Use GitHub App installation authorization with verified state, selected repository scopes and least-privilege access.
4. Analyze untrusted code only in isolated, resource-limited workers. Do not execute arbitrary install/build scripts.
5. Protect against SSRF, access to internal networks, unsafe repository fetches and secrets in diagnostic logs.
6. Use real worker events to update stage statuses; explicitly report skipped/failed checks and unsupported ecosystems.
7. Implement idempotent, authenticated cancellation and distinguish request receipt from confirmed stop.
8. Redact potential credentials in API status, logs and reports.
9. On completion, navigate only to an authorized results screen; report access requires server-verified authorization; there is no current payment gate.
10. Publish scope, retention and actual scan capabilities before accepting source code.

## Local verification

Run npm install, npm run typecheck, npm run build and npm run test:e2e. GitHub Actions also runs these checks on commits.

The public scanner is functional in code; private GitHub App authorization, independent distributed worker jobs, durable report storage/recovery and private authenticated report delivery remain **not implemented**. On Vercel or any host, validate outbound access to api.github.com, raw.githubusercontent.com and api.osv.dev. Optionally set a server-only GITHUB_TOKEN for higher GitHub API limits. Scans are capped at 65 eligible files and 55 seconds, so large repositories are partial or rejected. This is source analysis, not active penetration testing.
