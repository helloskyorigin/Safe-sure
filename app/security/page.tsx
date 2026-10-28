import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Security & Responsible Use | ShipSafe",
  description: "ShipSafe's security commitments, assessment scope, responsible-use requirements, reporting boundaries and current service status.",
};

const sections: LegalSection[] = [
  { id: "status", title: "Current security scope" },
  { id: "permissions", title: "Authorization and permissions" },
  { id: "scanning", title: "Safe assessment design" },
  { id: "secrets", title: "Secrets, retention and reports" },
  { id: "limitations", title: "Accuracy and limitations" },
  { id: "reporting", title: "Reporting a security issue" },
  { id: "incidents", title: "Incident readiness and changes" },
];

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="TRUST / SECURITY"
      title="Security practices."
      lead="Security claims should match the system that actually exists. Learn the principles guiding ShipSafe and the boundaries of its current preview."
      sections={sections}
      summary={[
        "The current site is a marketing preview. No production source-code scanning or GitHub authorization is active.",
        "The planned assessment will prioritize explicit authorization, least privilege and evidence-based findings.",
        "No certification, zero-risk guarantee or private vulnerability-reporting inbox is claimed.",
      ]}
    >
      <section id="status" className="legal-section">
        <h2>Current security scope</h2>
        <p>ShipSafe currently provides a public website, an interactive illustrative report and informational pages. The example vulnerability counts and technical fixes are demonstration material. A production scanner, authorization flow, customer report storage and payment processor have not been activated.</p>
        <p>This page documents current boundaries and future engineering requirements. It does not claim SOC 2, ISO 27001, a completed penetration test, an audit certification or any other third-party security attestation.</p>
      </section>
      <section id="permissions" className="legal-section">
        <h2>Authorization and permissions</h2>
        <p>The planned workflow requires an explicit, user-initiated connection to an application the user is entitled to assess. Where access to a source repository is needed, the intended design is to request selected-resource read permissions rather than unrestricted access or write permission.</p>
        <p>Users must own the application or have demonstrable authorization for the relevant assessment. Access to a public website or open-source project is not, by itself, permission to conduct disruptive or intrusive testing.</p>
      </section>
      <section id="scanning" className="legal-section">
        <h2>Safe assessment design</h2>
        <p>Prior to launch, the scanning implementation must be reviewed for the risks created by handling untrusted code and network responses. The engineering baseline includes:</p>
        <ul>
          <li>Isolated processing environments with appropriate time, memory and network restrictions.</li>
          <li>No arbitrary execution of a customer's project installation or build scripts as part of a passive assessment.</li>
          <li>Controls to avoid accessing internal network services, localhost resources and cloud metadata endpoints.</li>
          <li>Request throttling, bounded scan scope and explicit confirmation for any deeper active tests.</li>
          <li>Rules and dependency advisories that have traceable sources and identifiable version or configuration evidence.</li>
        </ul>
        <p>These are implementation and validation requirements. They should not be interpreted as deployed security features until the real scan service has been built and tested.</p>
      </section>
      <section id="secrets" className="legal-section">
        <h2>Secrets, retention and reports</h2>
        <p>A production assessment should avoid logging or reproducing complete credentials in user-facing reports. Findings should mask suspected secrets, restrict report access to the entitled recipient and state whether sensitive content is stored at all.</p>
        <p>Before enabling source access, ShipSafe must set and publish retention, access revocation and deletion rules for code, scan artifacts, diagnostic logs and reports. There is no current repository ingestion or customer-report database in the public preview.</p>
      </section>
      <section id="limitations" className="legal-section">
        <h2>Accuracy and limitations</h2>
        <p>Automated findings may be false positives, low impact in context or incomplete. Some categories of vulnerability require manual testing, application credentials, active interaction or deeper system access. Severity should be supported by evidence, not inflated to increase sales.</p>
        <p>No security assessment can establish that an application is free of all security risks. A completed scan, when available, should clearly disclose what was checked, which targets and versions were covered, what could not be assessed and which items require review.</p>
      </section>
      <section id="reporting" className="legal-section">
        <h2>Reporting a security issue</h2>
        <p><strong>Do not publish sensitive vulnerability reports in public GitHub issues.</strong> Public issues are appropriate only for non-sensitive bugs and product feedback. Never post exploit details, credentials, customer information or vulnerable private endpoints there.</p>
        <p>A dedicated private vulnerability-reporting method must be enabled and published before ShipSafe handles customer source code or begins providing real reports. We do not invent a security email address or claim an unverified private inbox exists today. See <Link href="/contact">Contact</Link> for the currently available public feedback channel.</p>
      </section>
      <section id="incidents" className="legal-section">
        <h2>Incident readiness and changes</h2>
        <p>Before handling sensitive data, ShipSafe must establish incident triage, response ownership, a private communication channel, log-review practices and applicable regulatory reporting procedures. Response guarantees and certification statements will only be displayed once supported by actual operating procedures.</p>
        <p>Material changes to access permissions, hosting, scan coverage, report retention or payments should be reflected in the <Link href="/privacy">privacy notice</Link>, <Link href="/terms">terms</Link> and this page before the affected functionality goes live.</p>
        <p className="legal-note"><strong>Security is not a badge.</strong> ShipSafe's aim is accurate, explainable application security guidance—not misleading scores, false guarantees or unverified compliance claims.</p>
      </section>
    </LegalPage>
  );
}
