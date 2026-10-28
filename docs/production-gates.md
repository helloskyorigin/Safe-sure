# Secuvora — production activation and YC demo gates

Updated: 28 October 2026. This document separates **shipped code** from **operator setup** and **features not built**.

## Current verified application behavior

- Public GitHub source scan: on-demand, read-only, pinned revision, bounded file and request budgets.
- Source, configuration and two explicit AI-agent safety-bypass rules + exact-version OSV dependency advisory matches; reports include severity, confidence, evidence redaction, locations and steps.
- Real progress stream, automatic validated report navigation, public browser history, JSON/Markdown/PDF print exports.
- Developer review flow: search, priority filter, issue-ready copy, keyboard navigation, rescan and diff against an earlier verified report.
- Private repository OAuth, authorization, server-side encrypted report retention and owner-scoped reads exist in code but are **not enabled by code alone**.
- Automated source investigation is deterministic; **no LLM reasoning, scheduled monitoring, incident response, runtime penetration testing or certification is provided**.

## P0 — operator-provided integrations (cannot be inferred from the code)

1. Create/verify a GitHub App with **Contents: read-only**, **Metadata: read** and the correct OAuth callback. Restrict installation to selected repositories. Validate that a test user can only list and scan repositories they actually authorized.
2. Set the canonical production HTTPS origin in `SHIPSAFE_PUBLIC_ORIGIN`. Configure `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `NEXT_PUBLIC_GITHUB_APP_SLUG`, a fresh independent high-entropy `SHIPSAFE_SESSION_SECRET` and Upstash `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` in provider-managed secrets. Never put secrets in Git or `NEXT_PUBLIC_` variables.
3. Link the deployment to the correct GitHub repository and team. Configure preview and production separately. Configure public domain, HTTPS and correct callback allowlist.
4. Exercise private OAuth login, logout, expired session, revoked installation, wrong-user access, exact revision reads, report save/read/list/delete and seven-day expiry **against a live non-sensitive test repo and Redis**.
5. Confirm upstream GitHub/OSV networking, timeouts, throttling, cross-instance budgets and size limits. Present process-local safeguards as best-effort only. Do not launch at scale before WAF/edge limits, a durable queue and isolated workers are operating.
6. Set real support / vulnerability-reporting contact and legal operator identity. Review privacy, retention, terms and incident response with the deployment operator.
7. Establish server-side error monitoring with structured redaction; alert on scan failures and upstream throttling, without logging OAuth tokens, raw secrets, or private source content.
8. Obtain an independent security review and resolve critical findings. Document test evidence, approvals and rollback instructions before making broad commercial/security claims.

## P0 — release testing

- GitHub CI: typecheck, Next.js production build, Playwright browser tests, CodeQL. Required to pass on the **exact release commit**.
- Manual devices: Android 320px/375px/430px, tablet 768px, desktop 1024px/1440px; keyboard, reduced-motion, screen-reader headings, overflow, readable evidence.
- Public scan test: a real permitted repository -> source read -> progress -> validated report -> refresh -> saved history -> JSON and fix-plan exports.
- Private scan test: real selected repo -> owner-scoped session -> encrypted report -> same-user retrieval -> other-user denied -> deletion -> access revoked.
- Zero findings must **not** imply the repository is secure. Skipped analysis and file limits must remain visible.
- Source scans must never commit fixes, modify a repository or run third-party code.

## Product precision limits to resolve before a broad launch

- Static rules do not establish exploitability or reachability. Cross-file taint/dataflow analysis and controlled false-positive benchmark datasets are future work.
- OSV matches establish a published advisory for a pinned package; validate reachability and applicable versions before assigning operational urgency.
- Scan delta compares saved finding fingerprints. “No longer detected” means the current bounded scanner did not emit the same fingerprint. It is **not** a verified fix; compare scan coverage.
- On-demand streaming does not survive a disconnected browser request. A genuine worker queue, authenticated run status, idempotent retries and cancellation are needed for robust long-running scans.
- Automated recurring monitoring requires opt-in, scoped credentials, scheduling, safe data retention, retry semantics and reliable notifications. Do not add “continuous security enabled” badges until implemented and tested.

## Honest YC demo sequence (no fake signals)

1. Show repository chooser. Explain selected public repo vs separately configured private GitHub access.
2. Start a real assessment. Let the five scan stages advance from server events.
3. Open the verified report automatically. Show exact git commit, inspected scope, a masked finding and source link.
4. Copy issue-ready remediation steps, show how to verify, and perform a second real scan.
5. Show the before/after detected-fingerprint delta, explicitly calling out that a disappearing match is not a confirmed fix.
6. State the near-term product wedge: evidence-backed, developer-first security reviews for source repositories; long-term autonomy/monitoring is roadmap, not production behavior.

## Go/no-go

**Code mergeable** means reviewed tests passed. **Production ready** additionally requires real secrets/integrations, abuse limits, live private isolation checks, monitoring, legal readiness, and independent security validation. Never equate the two.
