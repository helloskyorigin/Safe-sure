import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | ShipSafe",
  description: "Read how ShipSafe's website handles technical data, what is not collected, your choices and what changes when assessments launch.",
};

const sections: LegalSection[] = [
  { id: "scope", title: "Scope and service status" },
  { id: "data", title: "Information processed" },
  { id: "uses", title: "How information is used" },
  { id: "providers", title: "Hosting and other providers" },
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
      lead="A transparent account of what happens when you visit ShipSafe, which data we do not yet collect, and how this notice will evolve."
      sections={sections}
      summary={[
        "Public GitHub repository scans are available without GitHub authentication; private access and payments are not enabled.",
        "Public repository URLs and source files are processed transiently for a requested scan. Completed reports are kept in your browser tab's session storage.",
        "Your hosting provider may process routine technical request data needed to deliver the website.",
      ]}
    >
      <section id="scope" className="legal-section">
        <h2>Scope and service status</h2>
        <p>This privacy notice covers the ShipSafe public website and its current interactive product demonstrations. ShipSafe is a software project, not a representation that a separate company has been incorporated. Public repository scanning processes accessible source and pinned dependencies; private GitHub authorization and server-stored authenticated report delivery remain unimplemented.</p>
        <p>The assessment page offers public-source scanning when you enter a GitHub repository address and start a scan. The separate sample results screen remains fictional and clearly labeled. No payment is required and no private GitHub authorization is initiated.</p>
      </section>
      <section id="data" className="legal-section">
        <h2>Information processed</h2>
        <p><strong>When you browse:</strong> your browser connects to the website and its infrastructure. The hosting or network providers may receive IP addresses, user-agent information, requested URLs, timestamps and security logs as part of serving the page and maintaining reliability.</p>
        <p><strong>What the current app does not request:</strong> a ShipSafe account, your GitHub credentials, payment-card details, contact-form submissions or private repository credentials. When you request a public scan, the server fetches publicly accessible source files and lockfiles. The frontend does not install an analytics or advertising tracker. Scan requests contain the public owner/repository identifier. Report details are returned to the initiating browser tab.</p>
        <p><strong>If you submit public feedback:</strong> information in a GitHub issue is processed by GitHub and visible publicly. Only share non-sensitive product feedback. Do not post passwords, personally identifying information or exploit details.</p>
      </section>
      <section id="uses" className="legal-section">
        <h2>How information is used</h2>
        <p>Technical request information is used by the relevant infrastructure to deliver pages, troubleshoot reliability, maintain site security and respond to abuse. We do not currently use the ShipSafe front end to create personal advertising profiles, sell browsing data or run a marketing mailing list.</p>
        <p>For public scanning, the server inspects source patterns and sends pinned package names/versions to the OSV vulnerability database. Source is not intentionally submitted to OSV. Unsupported files are excluded and source code is not executed. We will update this notice for additional features.</p>
      </section>
      <section id="providers" className="legal-section">
        <h2>Hosting and other providers</h2>
        <p>The deployment host and any internet delivery providers may have their own operational logs, security tools and retention settings. The exact production hosting account and its logging configuration are not specified by this repository; those details must be documented after deployment is configured.</p>
        <p>The application uses Next.js for rendering and the Next.js font pipeline for typography. Following external links, including GitHub, means those services apply their own privacy terms. Public scans use GitHub API/raw content endpoints and OSV.dev for package advisory checks. Their request/logging policies apply. We will identify additional processors if private scanning or payment features are added.</p>
      </section>
      <section id="cookies" className="legal-section">
        <h2>Cookies and tracking</h2>
        <p>The current ShipSafe application does not intentionally set cookies for analytics or advertising and does not include a cookie-consent banner for nonexistent tracking. A hosting platform may use strictly operational measures that are outside this site's application code. We will reassess disclosure and consent requirements if tracking or other storage technologies are added.</p>
      </section>
      <section id="storage" className="legal-section">
        <h2>Storage, security and retention</h2>
        <p>Public scan source is processed in memory during a request; there is no application-level durable scan-job database or source archive in this implementation. Completed report JSON is saved to the browser tab's sessionStorage for navigation to the results page, and can be cleared by closing the tab or clearing website data. Temporary operational logs may be retained by the deployment provider under its settings and applicable requirements. We cannot accurately promise a fixed log-deletion schedule without verifying that hosting configuration.</p>
        <p>Potential secret values are masked rather than returned in report excerpts. Infrastructure-level request logs may still exist under your hosting provider's settings. Private scanning will require separate least-privilege access, durable controls and verified data-retention practices before launch. Those controls are planned rather than claimed as already implemented.</p>
      </section>
      <section id="rights" className="legal-section">
        <h2>Your choices and rights</h2>
        <p>You can browse without submitting information to a ShipSafe user account. Where applicable law gives you rights to access, correction, erasure, grievance redressal or other controls over personal information, the applicable operator must provide a suitable private request channel and verify requests where necessary.</p>
        <p>At present, there is no private data-rights inbox advertised on the site. Please do not submit sensitive requests through public issues. A private privacy and support contact method must be configured and published before private source access, payment details or customer accounts are enabled. The current <Link href="/contact">contact page</Link> explains available non-sensitive feedback channels.</p>
      </section>
      <section id="international" className="legal-section">
        <h2>International visitors</h2>
        <p>ShipSafe may be viewed from different locations. Technical requests can be processed where the website host and network providers operate. We will disclose actual hosting regions, relevant processors and any cross-border processing mechanisms before the launch of data-intensive services. Applicable local laws continue to govern where relevant.</p>
      </section>
      <section id="changes" className="legal-section">
        <h2>Changes and contact</h2>
        <p>This notice is reviewed when the website's behavior changes. Material changes to collected data, processing purposes, service providers or user controls should be published before the affected functionality becomes available, with an updated revision date.</p>
        <p>For general non-sensitive questions visit <Link href="/contact">Contact</Link>. Security-specific information is available in our <Link href="/security">security practices</Link>. Do not share secret credentials or private code through public channels.</p>
        <p className="legal-note"><strong>Current status:</strong> ShipSafe is an operational website preview, a limited real public-source scanner, not a penetration test or comprehensive security audit. This policy describes the implementation at the date shown above.</p>
      </section>
    </LegalPage>
  );
}
