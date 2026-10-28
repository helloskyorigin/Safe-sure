# ShipSafe

ShipSafe is a developer-first application security product in **pre-launch development**. This repository contains a Next.js 15 App Router marketing website, an illustrative report explorer and informational legal pages.

## What is included

- Premium responsive white/off-white marketing page
- Scroll-linked progress indicator, subtle hero parallax, spring-like cards, hover details and scroll reveals
- Interactive illustrative full report, plus a dedicated full findings screen at /assess/results
- Animated and keyboard-accessible FAQ, mobile navigation and accessible assessment-preview dialog
- Sections explaining the planned workflow, product value, trust principles and free full-report access
- Public routes: **/privacy**, **/terms**, **/refunds**, **/security**, **/contact**
- Reduced-motion support and defensive visibility rules to avoid blank animated content

## What is not implemented

**The product does not yet scan applications or collect payments.** Repository authorization, real scanning, storing reports, checkout, purchase validation and private support are not connected. The sample finding counts and examples are labeled as illustrative; no visual demo should be mistaken for a real security report.

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

**Important launch dependency:** The ShipSafe GitHub App has not been registered/configured within the running application. The /assess screen is a production-buildable frontend, **not an active GitHub integration**. To enable real repository selection and scans later, implement GitHub App installation and verified callback/user authorization, least-privilege tokens, private analysis workers and secure session/report state. Do not trust an unverified GitHub installation_id callback parameter. Until then, the connect button explains the status and accesses no repositories.

Official integration references:
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/about-the-setup-url
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app

## Inspection console

Screen 3 is implemented at **/assess/scanning** with a distinctive inspection lens, five interactive analysis layers, a worker-confirmed progress timeline and an honest no-run state. The connection screen links to the preview. The scan status/cancel API fails closed until authentication and a real worker are available.

Read the [scan-engine integration contract](docs/scan-engine-integration.md) before enabling application access.

## Full results screen

The complete results experience is at **/assess/results**, accessible from the inspection screen's **View full sample** link. It includes all six clearly fictional findings, severity filters, file and line locations, evidence (masked when appropriate), risk explanations, remediation checklists, verification guidance, coverage disclosures, sample JSON export and a printable full report.

**No payment is required or requested.** All details in the sample are visible. Never show the sample as a real scan. The /api/assessments/[runId]/report GET endpoint intentionally returns 503 until authenticated jobs and authorization are implemented. A ?run= URL does not grant access, and the results screen does not substitute fictional findings for unavailable real ones.

See the full-report schema in lib/report-contract.ts.

## Architecture

- `app/page.tsx` assembles the landing page
- `app/globals.css` carries the original design foundation
- `app/enhancements.css` contains the interactive experience and legal visual styles
- `components/ReportExperience.tsx` implements the sample report explorer
- `components/ScrollProgress.tsx`, `ValueSection.tsx`, `FinalCTA.tsx` provide the visual enhancements
- `components/LegalPage.tsx` is the shared legal template

## Launch blockers

Before accepting real security assessments: implement least-privilege authorization, isolated untrusted-code analysis, accurate scan coverage/evidence, secrets redaction, source retention limits, and private support/security reporting. Replace pre-launch legal disclosures with reviewed final policies. Do not imply audits, certifications or customer logos that do not exist.
