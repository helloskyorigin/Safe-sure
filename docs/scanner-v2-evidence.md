# Secuvora Security Agent Engine v2 — evidence and accuracy contract

## Implemented inspection
Read-only source inspection pinned to a GitHub commit SHA. No application code execution, exploitation or credential validity probing.

- Inspect up to 65 selected source, pinned lockfile and supported configuration files, with explicit file and size limits. Supported languages include JavaScript/TypeScript, Python, PHP, Ruby and Go, plus selected Terraform, GitHub Actions YAML and Dockerfiles.
- Twelve curated static detector families: private-key boundaries, selected provider token patterns, credential-named literals, TLS validation bypass, JavaScript eval, React raw HTML, Django DEBUG, Python shell subprocess, pickle deserialization, request value to JS command execution, GitHub Actions write-all, and Terraform publicly_accessible.
- Check pinned npm package-lock and exact-version Python requirements/Pipfile.lock via OSV. Batch IDs are joined back to the exact package/version, followed by a verified advisory read. Publisher-reported severity and affected-package fixed-version events appear if provided.
- Report actual path, line, detector ID, confidence, sanitized evidence, impact, human-review remediation, verification and limitations.
- Report actual files inspected versus eligible, code/config lines, pinned packages queried and static rules executed.
- Explicitly mark coverage limitations and provider failures rather than claiming a clean bill of health.

## Accuracy boundaries
- Static matches are candidates, not confirmed vulnerabilities. This engine does not prove exploitability, reachable attack paths, token validity or production exposure.
- The source detector is rule-based, **not** interprocedural AST-backed dataflow analysis. Context-aware confidence and placeholder exclusion reduce noise but can miss real exposures.
- Missing publisher severity becomes a labeled Secuvora triage estimate (medium), not an invented CVSS.
- Fixed-version events are advisory metadata, not guaranteed one-click patches. Always check compatibility and reachability.
- Caps: 65 eligible files, 75 pinned dependencies, 45 static findings and 12 detailed OSV advisory matches. Other languages/configurations are not exhaustive.
- This is not a penetration test, formal compliance review or security certification.
- Automated accuracy or recall percentages are not claimed without a labeled benchmark dataset.

## Tests
- tests/security-engine-v2.spec.ts — positive/negative detections, stable identifiers, source evidence, redaction, confidence and report schema.
- tests/osv-advisory-v2.spec.ts — mocked OSV querybatch and verified details, severity, fixes, mismatch handling and stable IDs.
- tests/real-public-scan.spec.ts — end-to-end streaming, cancellation/errors and result routing.
- tests/report-presentation.spec.ts — authenticated report display, links and remediation exports.
- Optional real GitHub smoke: RUN_LIVE_SCAN=1 npm run test:e2e (may be network/rate-limited).

## Future work (not implemented)
AST/interprocedural taint analysis, dedicated isolated workers, broader ecosystems, Semgrep/CodeQL integration where licensing and deployment permit, measured precision/recall benchmarks on labeled findings, background jobs, server-side per-user scan quotas and history comparisons.
