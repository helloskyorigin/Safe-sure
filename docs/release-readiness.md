# ShipSafe — release and YC demo readiness

## Current working experience

1. Landing page with responsive interface and legal pages.
2. /assess lets a visitor enter a public GitHub owner/repo without GitHub credentials.
3. /assess/scanning starts a bounded, read-only server-side assessment and streams actual check states.
4. After a complete, validated report is saved in the current browser tab, navigation to /assess/results is **automatic**. No extra click.
5. The full report is free: findings, evidence, line paths when available, risk context, fix steps, verification and explicit coverage limitations. A no-finding report is never presented as proof of security.
6. Errors, provider limits, cancellation and invalid reports remain on the inspection screen without fabricating success; failed public scans offer Retry.

## Actual scanner limits (important for an honest demonstration)

- Public GitHub source scans work by default. A private source flow using GitHub App user OAuth, installed-repository read permissions and private GitHub blobs is implemented but requires real operator configuration.
- A pinned source revision via GitHub REST + raw content. At most 65 eligible files, with per-file size restrictions and a 55-second request timeout.
- Supported static source-pattern checks: possible hardcoded credentials/private keys, TLS verification override, dynamic code evaluation, HTML injection sinks, Django DEBUG.
- Pinned npm package-lock.json and PyPI requirements/Pipfile.lock candidates checked against OSV advisories when reachable.
- No app code execution, authenticated runtime testing, exploit confirmation, dynamic penetration testing, SOC 2/ISO certification or complete coverage.
- Public reports are held in browser tab sessionStorage. Authorized private reports are encrypted via AES-256-GCM at rest in Upstash Redis and expire after seven days, with owner-scoped access and deletion. This requires operator-provided secret/database credentials.
- API concurrency and request budgets are **per server instance**, not global. Configure a shared edge/WAF quota, observability and abuse controls before substantial public traffic.

## Deployment verification

1. Build from the latest `main` and confirm Next.js runtime supports streaming Node.js API handlers.
2. Ensure outbound HTTPS to `api.github.com`, `raw.githubusercontent.com`, `api.osv.dev`.
3. Optional `GITHUB_TOKEN` is server-only. Never prefix with NEXT_PUBLIC_ or commit a token.
4. Verify real scan (e.g., a small public repository), completion, automatic results navigation, and JSON export.
5. Confirm security headers, legal pages and mobile experience.
6. Run `npm run typecheck`, `npm run build`, `npm run test:e2e`. Optional real upstream smoke test with `RUN_LIVE_SCAN=1 npm run test:e2e` (network/rate-limit dependent).
7. Deploy on HTTPS, set up a confidential vulnerability-reporting contact, review hosting/provider logs and privacy disclosures.

## Still required before broad production/private scanning

- Register and install a real GitHub App with Contents: Read-only, Metadata: Read, OAuth callback and verified operator credentials.
- Configure the implemented Redis HTTPS store, high-entropy session secret and seven-day retention. Validate actual recovery/deletion against a live database.
- A shared rate limiter, queue, worker isolation, monitoring/alerts and clear concurrency budgets.
- Independent security review/penetration test, false-positive tuning and broader scanner coverage.
- Verified public operator/support/contact details and appropriate privacy/legal review.

The present implementation is a **working public-source MVP**, not a certified enterprise security platform. Demo it accurately rather than treating production-readiness as an untested claim.
