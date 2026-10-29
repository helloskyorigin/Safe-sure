# Secuvora

> **Release status:** working GitHub-connected security MVP with a unified repository investigation workflow. Public and private repositories use the same read-only GitHub App authorization path when granted to the installation. Continuous autonomous security still requires additional infrastructure and validation. See [Production gates + YC demo runbook](docs/production-gates.md) for exact requirements.

Secuvora is an on-demand automated security agent for GitHub repository source investigations. Its current workflow runs bounded security rules and OSV advisories; it does not use an LLM for reasoning. The primary product flow is now: connect GitHub → choose any repository explicitly authorized to the Secuvora GitHub App → run a read-only investigation → store the completed report in user-scoped encrypted short-term storage. Public and private repositories share this same connected flow.

## Auto-open results and connected-scanner readiness

Completed connected scans automatically open the full Results Screen **only after** the streamed report passes validation and encrypted storage succeeds. A failed, cancelled or malformed scan stays on the inspection screen with a clear error and Retry option. Legacy browser-held public reports remain readable for backward compatibility but are no longer the primary source-selection experience.

For deployment instructions, scope/accuracy limitations, private-repository milestones and remaining release blockers, see [Release and YC demo readiness](docs/release-readiness.md).

For complete GitHub App registration, OAuth callback settings, selected-repository permissions, encrypted Upstash report storage and live private-scan validation, see [Private GitHub activation guide](docs/private-github-setup.md).



## What is included

- Premium responsive white/off-white marketing page
- Scroll-linked progress indicator, subtle hero parallax, spring-like cards, hover details and scroll reveals
- Interactive illustrative full report, plus a dedicated full findings screen at /assess/results
- Animated and keyboard-accessible FAQ, mobile navigation and accessible assessment-preview dialog
- Sections explaining the working investigation workflow, product value, trust principles and complete report access
- Public routes: **/privacy**, **/terms**, **/refunds**, **/security**, **/contact**
- Reduced-motion support and defensive visibility rules to avoid blank animated content

## What is not implemented

The primary source-selection experience requires GitHub authorization. Repositories returned by the installed GitHub App—including authorized public and private repositories—use the authenticated connected scanner and encrypted seven-day report storage. The older /api/scan/public path remains only as a legacy compatibility surface and is not exposed by the primary UI. No payment collection is connected. The fictional example report is always labeled as a sample.

The "Assess your application" buttons open /assess. The GitHub connection action there explains the current integration status. Legal pages describe the current state and must be reviewed once final operator details, provider configuration, private contact methods and data-handling processes are known.

## Run locally

Use Node.js 20+.

```sh
npm install
npm run dev
```

Visit http://localhost:3000

## Verify before deploying

```sh
npm run typecheck
npm run build
```

Visual QA checklist: test at **320px, 375px, 430px, 768px, 1024px and 1440px** widths. Check that every hero element is visible, product demo tabs work, FAQ and mobile menu respond to keyboard/touch, legal links resolve, and no horizontal overflow is present. Also test reduced-motion mode.

## Assessment entry screen

The second product screen is now available at **/assess**. Landing CTAs navigate there, rather than opening the old informational popup.

- Responsive application connection experience with step indicators and a clearly labeled assessment-flow illustration.
- Interactive disclosure for the planned read-only GitHub App permissions.
- Accessible GitHub connection-status dialog, and a collapsible explanation of the planned scan → result sequence.
- No fake scan progress, invented customer findings, or false connection state.
- Tests cover landing navigation, permissions, dialog, illustrative flow, Android-sized viewport and 320px overflow.

**Important production dependency:** the /assess screen uses a real GitHub App connection, so deployment requires GitHub OAuth credentials, a read-only App installation, a session secret, the public OAuth callback and Upstash REST storage. If a repository is missing from the selector, it has not been granted to that GitHub App installation (or is not accessible to the signed-in user). GitHub's installation settings must be updated; Secuvora cannot bypass that boundary. Independent isolation and security review are still required before broad commercial use.

Official integration references:
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/about-the-setup-url
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app

## Inspection console

Screen 3 is implemented at **/assess/scanning** with five analysis layers and real streamed progress from the authenticated connected scanner. The flow fails closed without GitHub authentication or durable report storage. No fake progress or sample substitution is used for a connected run.

Read the [scan-engine integration contract](docs/scan-engine-integration.md) before enabling application access.

## Full results screen

The complete results experience is at **/assess/results**, accessible from the inspection screen's **View full sample** link. It includes all six clearly fictional findings, severity filters, file and line locations, evidence (masked when appropriate), risk explanations, remediation checklists, verification guidance, coverage disclosures, sample JSON export and a printable full report.

**No payment is currently required or requested.** Connected findings and all sample details are visible. Never show the sample as a real scan. The /api/assessments/[runId]/report endpoint now checks GitHub login and user-owned encrypted report records. Without a valid login it returns 401; without configured storage, 503. A ?run= URL does not grant access, and the results screen does not substitute fictional findings for unavailable real ones.

See the full-report schema in lib/report-contract.ts.

## Architecture

- `app/page.tsx` assembles the landing page
- `app/globals.css` carries the original design foundation
- `app/enhancements.css` contains the interactive experience and legal visual styles
- `components/ReportExperience.tsx` implements the sample report explorer
- `components/ScrollProgress.tsx`, `ValueSection.tsx`, `FinalCTA.tsx` provide the visual enhancements
- `components/LegalPage.tsx` is the shared legal template

## Launch blockers

Before broad private or commercial usage: confirm real Github App installation, hosting credentials, isolated job workers, tested source-retention limits, shared abuse controls, private vulnerability disclosure contact and an independent security review. Replace pre-launch legal disclosures with reviewed final policies. Do not imply audits, certifications or customer logos that do not exist.

### Scanner v2: evidence-backed security assessment

Secuvora uses 14 curated source/config detector families, selected Terraform/GitHub Actions rules, two explicit AI agent integration safety-bypass checks, exact-version npm/PyPI OSV advisory checks, redacted file/line evidence, rule IDs, confidence and actual file/line/package scope metrics. This is bounded static analysis, not an exhaustive SAST/DAST scanner or certification. See [Scanner v2: detection scope, precision limits and tests](docs/scanner-v2-evidence.md).
