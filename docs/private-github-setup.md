# ShipSafe production activation — GitHub App and encrypted reports

This repository includes **working code paths** for OAuth, private source inspection, seven-day encrypted report recovery and cross-instance scan quotas. Those services are **not live** until configured and validated with the external accounts below. Do not treat successful mocked tests as proof of a real private scan.

## 1. Register a GitHub App

1. In GitHub's **Developer settings → GitHub Apps → New GitHub App**, register the app for your ShipSafe site. Install it only on accounts/repositories the user explicitly chooses.
2. Set **Homepage URL** to your real HTTPS site.
3. Set the **Callback URL** to `https://YOUR_HOST/api/auth/github/callback`.
4. Enable **Request user authorization (OAuth)** if desired during installation. The app also offers sign-in through the explicit “Authorize with GitHub” button.
5. Repository permissions: **Contents: Read-only**, **Metadata: Read-only** (normally mandatory). Do not request write access or broad organization permissions.
6. Copy the **Client ID** and **Client secret** to server-only environment variables. Set the public app **slug** for the optional installation-management link.
7. Install the App for **selected repositories only**. The repository list uses `GET /user/installations` and `GET /user/installations/{installation_id}/repositories` under the user's GitHub App access token. Every private scan revalidates access.

No GitHub App private key is needed for this design: source reads use the authorized GitHub App **user access token** and GitHub REST Git blob API. This means access is limited to the intersection of user and App permissions. Token refresh isn't implemented: sign in again after expiry/revocation.

## 2. Set up Upstash Redis REST

1. Create a persistent Upstash Redis database in a region appropriate to your privacy requirements.
2. Add its HTTPS REST URL and **standard read/write REST token** to server-only environment settings.
3. Generate `SHIPSAFE_SESSION_SECRET` using a cryptographically secure source (32+ random characters). Retain it securely; changing it invalidates signed-in sessions and encrypted existing reports.
4. Never prefix server secrets with `NEXT_PUBLIC_` and never commit them to Git.
5. Enable a trusted hosting environment and restrict operational access.

A private scan is blocked if report storage is absent. After a verified scan completes, its report is encrypted with AES-256-GCM and stored under a user-specific key with **7-day TTL**, and a user-specific report index. Authenticated GET and DELETE enforce the user's account ID. No source-code archive is intentionally stored; encrypted reports may contain file paths, risk evidence and descriptions. User can delete individual reports.

## 3. Environment variables

```text
SHIPSAFE_PUBLIC_ORIGIN=https://YOUR_HOST
GITHUB_APP_CLIENT_ID=...
GITHUB_APP_CLIENT_SECRET=...
NEXT_PUBLIC_GITHUB_APP_SLUG=your-github-app-slug
SHIPSAFE_SESSION_SECRET=high-entropy-random-secret-at-least-32-chars
UPSTASH_REDIS_REST_URL=https://YOUR_DB.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

Optional `GITHUB_TOKEN` applies only to public repository API limits. The private scanner uses OAuth user permissions.

## 4. Verify on your actual deployed host

- Visit `/assess`, click **Authorize with GitHub**, and confirm you return with your real GitHub login.
- Install the GitHub App for a **small private test repository**, and confirm it appears in the repo selector. Unauthorized private repos must never appear or scan.
- Start the private scan; confirm live stage updates and **automatic** navigation to `/assess/results?run=<run-id>`.
- Refresh the Results URL while logged in; report must load from the server, **not** sample data. Sign out and reload it: access must fail.
- Visit `/assess/history`, open the report and delete it. Confirm subsequent GET returns 404. Expiry must be tested in a staging Redis deployment.
- Test a malicious repository pattern, empty findings, OSV network outage, invalid code, cancellation and rate limits. Watch for leaked secrets or provider HTTP credentials in logs.
- Audit the public and private scanner under realistic workload limits; configure edge WAF, alerting, confidential security support, incident and retention policies.

## Boundaries and risks

- Present feature code is read-only, bounded static source analysis plus OSV advisory matching, **not** comprehensive vulnerability discovery or a security certification.
- Source fetching currently runs in a serverless request, not a dedicated sandboxed background worker. Customer code is not executed, but broad paid/enterprise use requires a separate job queue, worker isolation, durable progress and cancellation, concurrency controls and an independent penetration test.
- A Redis shared quota is implemented when configured; large-scale abuse controls still require an edge gateway and operational monitoring. Public mode has a process-level fallback when Redis isn't configured.
- OAuth sessions are HttpOnly AES-GCM cookies; a stolen/revoked GitHub token must be reauthorized. GitHub access tokens are not persisted in the Redis database.
- Confirm privacy notices with actual hosting/Redis provider regions and contact methods before offering private scanning to outside users.
