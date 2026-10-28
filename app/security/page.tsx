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
        "Public read-only scanning is available. Optional private GitHub authorization and encrypted reports require configured credentials; runtime penetration testing is not performed.",
        "The planned assessment will prioritize explicit authorization, least privilege and evidence-based findings.",
        "No certification, zero-risk guarantee or private vulnerability-reporting inbox is claimed.",
      ]}
    >
      <section id="status" className="legal-section">
        <h2>Current security scope</h2>
        <p>ShipSafe now includes a read-only public GitHub source scanner. It fetches a pinned revision, applies supported static rules and optionally checks pinned dependencies against OSV. Separately, the fictional report remains a demonstration. Private repository authorization and seven-day encrypted report recovery are implemented but unavailable until the operator configures the GitHub App and database. Active penetration testing and payments are not enabled.</p>
        <p>This page documents current boundaries and future engineering requirements. It does not claim SOC 2, ISO 27001, a completed penetration test, an audit certification or any other third-party security attestation.</p>
      </section>
      <section id="permissions" className="legal-section">
        <h2>Authorization and permissions</h2>
        <p>Public source scanning is initiated by submitting a public repository address. No write access is requested. Private repository connections will require user authorization. Where access to a source repository is needed, the intended design is to request selected-resource read permissions rather than unrestricted access or write permission.</p>
        <p>Users must own the application or have demonstrable authorization for the relevant assessment. Access to a public website or open-source project is not, by itself, permission to conduct disruptive or intrusive testing.</p>
      </section>
      <section id="scanning" className="legal-section">
        <h2>Safe assessment design</h2>
        <p>Public scanning has bounded file counts, source sizes and execution time, and does not execute customer code. Before broader commercial/private use, further security validation is required:</p>
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
        <p>Public source is processed transiently in a scan request, and report JSON is kept in the user's browser tab sessionStorage. Private reports, when configured, use owner-scoped AES-GCM authenticated encryption in a server-side Redis store with seven-day expiry and delete support. No complete source archive is intentionally retained. Hosting logs may exist separately; actual operational policies and independent testing must be confirmed before enabling private scans.</p>
      </section>
      <section id="limitations" className="legal-section">
        <h2>Accuracy and limitations</h2>
        <p>Automated findings may be false positives, low impact in context or incomplete. Some categories of vulnerability require manual testing, application credentials, active interaction or deeper system access. Severity should be supported by evidence, not inflated to increase sales.</p>
        <p>No security assessment can establish that an application is free of all security risks. A completed scan, when available, should clearly disclose what was checked, which targets and versions were covered, what could not be assessed and which items require review.</p>
      </section>
      <section id="reporting" className="legal-section">
        <h2>Reporting a security issue</h2>
        <p><strong>Do not publish sensitive vulnerability reports in public GitHub issues.</strong> Public issues are appropriate only for non-sensitive bugs and product feedback. Never post exploit details, credentials, customer information or vulnerable private endpoints there.</p>
        <p>A dedicated private vulnerability-reporting method should be configured before accepting private source code or sensitive security disclosures. We do not invent a security email address or claim an unverified private inbox exists today. See <Link href="/contact">Contact</Link> for the currently available public feedback channel.</p>
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
