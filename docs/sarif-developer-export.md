# Secuvora developer exports — SARIF 2.1.0

Secuvora's verified on-demand reports can now be exported as **SARIF 2.1.0**, in addition to JSON, Markdown fix plans and printable PDF.

## Export

1. Run a **real** supported public source scan, or an authorized private scan on a configured deployment.
2. Open the verified report and choose **Export SARIF**.
3. Use `secuvora-security-results.sarif` with a compatible code-scanning viewer or a deliberately configured CI upload workflow.
4. Do not upload private repository findings to a third-party service without the repository owner's consent and the destination's access/retention policy.

The fictional sample report has **no SARIF export button**. There is **no automatic GitHub Code Scanning upload or write access** in the product.

## Export guarantees

- Uses the report's actual repository-relative file locations and available line numbers.
- Uses the scanner's stable rule ID where available; legacy results have distinct fallback IDs.
- Maps critical/high to SARIF `error`, medium to `warning`, low to `note`. These are **triage levels, not CVSS scores**.
- Omits raw/sanitized source snippets and finding evidence completely, including redacted secrets. Finding titles, file paths and remediation guidance may still be sensitive.
- Rejects absolute paths, path traversal and query/fragment/control-character paths; safely percent-encodes valid path segments.
- Labels all alerts as **candidate static findings**, not verified exploits. Does not fabricate source-to-sink paths, partial fingerprints or confirmed fixes.
- Preserves unchanged scan coverage limitations in run properties.

## CI adoption gate

GitHub Code Scanning can ingest compatible SARIF files, but this requires an authorized workflow with the required security-events permissions, consistent commit/ref context, and code-scanning feature availability. Secuvora does not create that workflow or send findings automatically.

Do not interpret a file being exportable as an approved production security integration.

## Quota hardening

When Upstash is configured, shared public/private request quotas use a **single Redis EVAL command**. The quota increment and expiration happen atomically; server failure cannot leave an INCR-created key without a TTL from that operation. The system still needs network-layer WAF protections, distributed concurrent-job leases, durable workers and controlled account verification before open public scaling.

## Release notes

Related checks: `tests/report-sarif.spec.ts`, `tests/shared-quota.spec.ts`, `tests/api-request-guards.spec.ts`.

This release does not implement continuous scanning, private GitHub App credential configuration, background workers, prompt injection simulation, exploit validation, or automated fixes.
