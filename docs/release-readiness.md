# Secuvora — release and YC demo readiness

## Current working experience

1. Landing page with responsive interface and legal pages.
2. /assess uses a single GitHub connection and lists repositories explicitly authorized to the installed Secuvora GitHub App.
3. /assess/scanning starts a bounded, read-only server-side assessment and streams actual check states.
4. After a complete, validated report is saved in the current browser tab, navigation to /assess/results is **automatic**. No extra click.
5. The complete report includes findings, evidence, line paths when available, risk context, fix steps, verification and explicit coverage limitations. A no-finding report is never presented as proof of security.
6. Errors, provider limits, cancellation and invalid reports remain on the inspection screen without fabricating success; failed connected scans offer Retry.

## Actual scanner limits (important for an honest demonstration)

- The primary flow uses GitHub App user OAuth and installed-repository read permissions for both authorized public and private repositories. Deployment credentials and Redis must be present and validated for live connected scans.
- A pinned source revision via GitHub REST + raw content. At most 65 eligible files, with per-file size restrictions and a 55-second request timeout.
- Supported static source-pattern checks: possible hardcoded credentials/private keys, TLS verification override, dynamic code evaluation, HTML injection sinks, Django DEBUG.
- Pinned npm package-lock.json and PyPI requirements/Pipfile.lock candidates checked against OSV advisories when reachable.
- No app code execution, authenticated runtime testing, exploit confirmation, dynamic penetration testing, SOC 2/ISO certification or complete coverage.
- Connected reports are encrypted via AES-256-GCM at rest in Upstash Redis and expire after seven days, with owner-scoped access and deletion. Legacy browser-only reports may remain readable for backward compatibility.
- API concurrency and request budgets are **per server instance**, not global. Configure a shared edge/WAF quota, observability and abuse controls before substantial public traffic.

## Deployment verification

1. Build from the latest `main` and confirm Next.js runtime supports streaming Node.js API handlers.
2. Ensure outbound HTTPS to `api.github.com`, `raw.githubusercontent.com`, `api.osv.dev`.
3. `GITHUB_TOKEN` is optional legacy compatibility only. The primary connected flow uses the GitHub OAuth user token. Never prefix a secret with NEXT_PUBLIC_ or commit it.
4. Verify a real connected scan (use a small non-sensitive repository), completion, automatic results navigation, refresh/recovery and exports.
5. Confirm security headers, legal pages and mobile experience.
6. Run `npm run typecheck`, `npm run build`, `npm run test:e2e`. Optional real upstream smoke test with `RUN_LIVE_SCAN=1 npm run test:e2e` (network/rate-limit dependent).
7. Deploy on HTTPS, set up a confidential vulnerability-reporting contact, review hosting/provider logs and privacy disclosures.

## Still required before broad production use

- Register/configure the real GitHub App with Contents: Read-only, Metadata: Read, correct OAuth callback and verified deployment credentials; then validate it end-to-end.
- Configure the implemented Redis HTTPS store, high-entropy session secret and seven-day retention. Validate actual recovery/deletion against a live database.
- A shared rate limiter, queue, worker isolation, monitoring/alerts and clear concurrency budgets.
- Independent security review/penetration test, false-positive tuning and broader scanner coverage.
- Verified public operator/support/contact details and appropriate privacy/legal review.

The present implementation is a **GitHub-connected security MVP**, not a certified enterprise security platform. Demo it accurately rather than treating production-readiness as an untested claim.
