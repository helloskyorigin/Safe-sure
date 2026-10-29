import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Security & Responsible Use | Secuvora",
  description: "Secuvora's repository permissions, scan boundaries, report protection, accuracy limits and responsible reporting guidance.",
};

const sections: LegalSection[] = [
  { id: "status", title: "Current security scope" },
  { id: "permissions", title: "Authorization and permissions" },
  { id: "scanning", title: "Assessment design" },
  { id: "secrets", title: "Secrets, retention and reports" },
  { id: "limitations", title: "Accuracy and limitations" },
  { id: "reporting", title: "Reporting a security issue" },
  { id: "incidents", title: "Operational readiness" },
];

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="TRUST / SECURITY"
      title="Security practices."
      lead="Security claims should match the system that actually exists. These are Secuvora's current controls and explicit boundaries."
      sections={sections}
      summary={[
        "Repository access is granted through a GitHub App and used read-only; Secuvora does not request permission to push code.",
        "The scanner performs bounded static checks and dependency-advisory matching without executing customer source.",
        "Connected reports are encrypted at rest with limited retention, but no third-party security certification or zero-risk guarantee is claimed.",
      ]}
    >
      <section id="status" className="legal-section">
        <h2>Current security scope</h2>
        <p>Secuvora performs read-only GitHub source investigations against repositories explicitly available through the connected GitHub App. It fetches repository content, applies supported source/configuration rules and checks supported pinned dependencies against published OSV advisories.</p>
        <p>The current product is not an active penetration-testing platform and does not execute customer application code. The fictional sample report is separate from real findings and remains labeled. Secuvora does not claim SOC 2, ISO 27001, an independent penetration-test certification or another third-party security attestation.</p>
      </section>

      <section id="permissions" className="legal-section">
        <h2>Authorization and permissions</h2>
        <p>The GitHub App is intended to request repository Contents read access and required repository Metadata access. Users choose which repositories are granted through GitHub. Secuvora does not request repository write permission as part of this flow.</p>
        <p>Users remain responsible for ensuring they own or are authorized to assess the selected repository. Technical access through GitHub is not permission to conduct intrusive testing against unrelated infrastructure.</p>
      </section>

      <section id="scanning" className="legal-section">
        <h2>Assessment design</h2>
        <p>The current scanner bounds source sizes, file counts and execution time, and it does not install dependencies or run project build scripts. Security checks are intended to stay passive and evidence-led.</p>
        <ul>
          <li>Repository source is read through authenticated GitHub APIs for the requested investigation.</li>
          <li>Customer code is not intentionally executed.</li>
          <li>Supported findings include file/line evidence, rule identifiers, confidence and coverage information where available.</li>
          <li>Dependency checks use pinned versions and published advisory data rather than guessing package risk.</li>
          <li>Mutation endpoints enforce same-origin request checks and connected scans use shared quotas when durable storage is configured.</li>
        </ul>
        <p>Broader commercial or enterprise use would still benefit from dedicated isolated workers, operational monitoring, edge abuse controls and independent security testing.</p>
      </section>

      <section id="secrets" className="legal-section">
        <h2>Secrets, retention and reports</h2>
        <p>Suspected credential values are masked in report evidence. A complete source-code archive is not intentionally retained by the application.</p>
        <p>Connected reports are encrypted with AES-GCM before server-side storage, associated with the authenticated GitHub user, expire after up to seven days and can be deleted earlier from Agent history. GitHub user access tokens are kept inside encrypted HttpOnly session cookies rather than report storage. Hosting-level request logs may exist separately under provider settings.</p>
      </section>

      <section id="limitations" className="legal-section">
        <h2>Accuracy and limitations</h2>
        <p>Automated findings can be incomplete, context-dependent or false positives. Some vulnerabilities require runtime behavior, secrets, infrastructure access, business logic or manual testing that the current scanner cannot observe.</p>
        <p>A completed report should be treated as one security input, not proof that an application is safe. Severity should remain tied to evidence and context rather than inflated to create urgency.</p>
      </section>

      <section id="reporting" className="legal-section">
        <h2>Reporting a security issue</h2>
        <p><strong>Do not publish sensitive vulnerabilities in public GitHub issues.</strong> Public issues are suitable only for non-sensitive product bugs and feedback. Never post credentials, customer data, working exploits or private repository content there.</p>
        <p>A dedicated confidential vulnerability-reporting address is not currently published. Until one is available, do not send sensitive disclosures through the public feedback channel. See <Link href="/contact">Contact</Link> for current non-sensitive options.</p>
      </section>

      <section id="incidents" className="legal-section">
        <h2>Operational readiness</h2>
        <p>Production operation should maintain access control, report deletion, log review, credential rotation, abuse monitoring and incident-response procedures appropriate to the actual deployment. Response-time or certification claims should only be published when supported by real operating processes.</p>
        <p>Material changes to permissions, providers, retention, scan coverage or commercial terms should be reflected in <Link href="/privacy">Privacy</Link>, <Link href="/terms">Terms</Link> and this page.</p>
        <p className="legal-note"><strong>Security is not a badge.</strong> Secuvora's goal is explainable evidence and useful remediation—not an unverified promise that software is secure.</p>
      </section>
    </LegalPage>
  );
}
