import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Secuvora",
  description: "How Secuvora handles GitHub authorization, repository source, reports, functional cookies and service-provider data.",
};

const sections: LegalSection[] = [
  { id: "scope", title: "Scope and service status" },
  { id: "data", title: "Information processed" },
  { id: "uses", title: "How information is used" },
  { id: "providers", title: "Service providers" },
  { id: "cookies", title: "Cookies and tracking" },
  { id: "storage", title: "Storage, security and retention" },
  { id: "rights", title: "Your choices and rights" },
  { id: "international", title: "International visitors" },
  { id: "changes", title: "Changes and contact" },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="POLICY / PRIVACY"
      title="Privacy policy."
      lead="What Secuvora processes when you connect GitHub, run an investigation and reopen a saved report."
      sections={sections}
      summary={[
        "Secuvora uses GitHub authorization to show only repositories available to the connected account and granted to the Secuvora GitHub App.",
        "Repository source is read for analysis and is not intentionally kept as a source archive. Connected reports are encrypted at rest and expire after a limited retention period.",
        "The application does not install advertising or analytics trackers and does not collect payment-card details.",
      ]}
    >
      <section id="scope" className="legal-section">
        <h2>Scope and service status</h2>
        <p>This notice covers the Secuvora website and its read-only GitHub repository investigation flow. Secuvora is presented as a software project; this wording does not assert that a separate incorporated company exists.</p>
        <p>The product connects to GitHub only after the user starts authorization. It then lists repositories made available through the GitHub App installation. If the required deployment configuration is unavailable, the connected flow fails closed instead of pretending access exists. The sample report remains fictional and clearly labeled.</p>
      </section>

      <section id="data" className="legal-section">
        <h2>Information processed</h2>
        <p><strong>Website requests:</strong> hosting and network providers may receive IP address, user-agent, requested URL, timestamp and security-log information needed to deliver and protect the service.</p>
        <p><strong>GitHub connection:</strong> after authorization, Secuvora receives the GitHub user identity needed for the session and a GitHub user access token. The token is placed inside an encrypted HttpOnly session cookie and is not intentionally stored in the report database. Secuvora never asks for your GitHub password.</p>
        <p><strong>Repository investigations:</strong> the service reads repository metadata and supported source/configuration files from repositories that the GitHub App is allowed to access. It processes file paths, selected source excerpts, package names and pinned dependency versions needed to generate findings. Suspected secrets are masked in report evidence.</p>
        <p><strong>Reports:</strong> a completed connected report can contain repository name, file paths, finding evidence, severity, remediation guidance, scan coverage and timestamps. Connected reports are associated with the authenticated GitHub user for later retrieval and deletion.</p>
        <p><strong>Public feedback:</strong> information submitted to a GitHub issue is handled by GitHub and may be publicly visible. Do not post credentials, private source, personal records or undisclosed vulnerabilities in public issues.</p>
      </section>

      <section id="uses" className="legal-section">
        <h2>How information is used</h2>
        <p>Secuvora uses the information above to authenticate repository access, perform the requested investigation, generate and retrieve reports, enforce abuse limits, troubleshoot reliability and protect the service.</p>
        <p>Supported dependency identifiers may be sent to the OSV vulnerability database to check published advisories. Repository source is not intentionally submitted to OSV. Source code is not executed by the current scanner.</p>
        <p>The application does not use its front end to create advertising profiles, sell browsing data or operate a marketing mailing list.</p>
      </section>

      <section id="providers" className="legal-section">
        <h2>Service providers</h2>
        <p>Secuvora depends on its deployment host and network infrastructure to serve requests. Those providers may keep operational and security logs under their own settings.</p>
        <p>GitHub provides identity, repository authorization and source access. OSV.dev provides published package-advisory data. When connected-report storage is enabled, Upstash Redis is used for encrypted report records, report indexes and shared scan-quota state. Each provider applies its own terms and data practices.</p>
        <p>The exact production hosting region, Upstash region and infrastructure log-retention settings are deployment facts and should be reviewed by the operator whenever those services change.</p>
      </section>

      <section id="cookies" className="legal-section">
        <h2>Cookies and tracking</h2>
        <p>Secuvora does not set advertising or analytics cookies in the application code. GitHub sign-in uses strictly functional OAuth-state and encrypted HttpOnly session cookies. These cookies are used for authorization and security rather than cross-site advertising.</p>
        <p>A hosting platform may apply operational security measures outside this application's code. This notice should be updated if analytics, advertising or additional storage technologies are introduced.</p>
      </section>

      <section id="storage" className="legal-section">
        <h2>Storage, security and retention</h2>
        <p>Repository source is processed during the investigation and is not intentionally persisted as a source-code archive. Connected reports are encrypted using AES-GCM before being placed in server-side Redis storage, are scoped to the authenticated GitHub user and use an application retention period of up to seven days. Individual connected reports can be deleted from Agent history before expiry.</p>
        <p>GitHub session data is protected inside an encrypted HttpOnly cookie and expires after a limited session period. Revoked or expired GitHub authorization requires the user to connect again.</p>
        <p>Older browser-only report records created by legacy public-scan flows may remain in localStorage on the device until their application expiry or manual deletion. Hosting-level logs can exist separately under provider settings.</p>
      </section>

      <section id="rights" className="legal-section">
        <h2>Your choices and rights</h2>
        <p>You control which repositories are granted to the Secuvora GitHub App through GitHub's Installed GitHub Apps settings. Removing repository access prevents future reads through that installation. You can also delete connected reports from Agent history.</p>
        <p>Where applicable law provides access, correction, deletion, grievance or other rights over personal information, an appropriate private request channel may be required. A dedicated private data-rights inbox is not currently published, so do not submit sensitive privacy requests through public GitHub issues. The <Link href="/contact">Contact</Link> page describes the channels currently available.</p>
      </section>

      <section id="international" className="legal-section">
        <h2>International visitors</h2>
        <p>Secuvora may be accessed from multiple countries, and service providers may process technical data in the regions where their infrastructure operates. The operator should keep provider-region and cross-border disclosures aligned with the actual production deployment.</p>
      </section>

      <section id="changes" className="legal-section">
        <h2>Changes and contact</h2>
        <p>This notice should be updated before material changes to collected information, repository permissions, retention, service providers, analytics, payments or user controls become active.</p>
        <p>For non-sensitive questions visit <Link href="/contact">Contact</Link>. Security-specific information is available under <Link href="/security">Security practices</Link>. Never share credentials or private source through a public support channel.</p>
        <p className="legal-note"><strong>Scope reminder:</strong> Secuvora performs bounded automated source/configuration checks and dependency-advisory matching. It is not a penetration test, certification or guarantee that a repository is secure.</p>
      </section>
    </LegalPage>
  );
}
