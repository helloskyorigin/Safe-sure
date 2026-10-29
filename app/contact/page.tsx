import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CircleAlert, MessageSquareText } from "lucide-react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Contact & Support | Secuvora",
  description: "Current Secuvora feedback and support channels, including clear boundaries for sensitive security or privacy information.",
};

const sections: LegalSection[] = [
  { id: "feedback", title: "Product feedback" },
  { id: "security-reports", title: "Sensitive security issues" },
  { id: "privacy", title: "Privacy requests" },
  { id: "reports", title: "Repository and report support" },
  { id: "updates", title: "Private support channel" },
];

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="COMPANY / CONTACT"
      title="Contact Secuvora."
      lead="Use the public project channel for ordinary product feedback. Keep credentials, private source and undisclosed vulnerabilities out of public issues."
      sections={sections}
      summary={[
        "GitHub issues are available for non-sensitive website bugs, suggestions and general product questions.",
        "Do not post private source code, credentials, security weaknesses or personal records in public issues.",
        "A dedicated confidential support and vulnerability-reporting channel is not currently published.",
      ]}
    >
      <section id="feedback" className="legal-section">
        <h2>Product feedback</h2>
        <p>The current channel for ordinary, non-sensitive bug reports and feature feedback is the project's GitHub Issues page.</p>
        <div className="legal-contact-card">
          <span className="legal-contact-icon"><MessageSquareText size={20}/></span>
          <div><strong>GitHub issues</strong><p>Use for layout bugs, accessibility feedback, typos and non-sensitive product suggestions. Issues are public and may be indexed by search engines.</p>
          <a href="https://github.com/helloskyorigin/Safe-sure/issues/new" target="_blank" rel="noopener noreferrer">Open a public issue <ArrowUpRight size={15} aria-hidden="true"/></a></div>
        </div>
        <p>Useful feedback includes the page URL, browser/device details, reproducible steps and expected behavior. Remove private information from screenshots before posting.</p>
      </section>

      <section id="security-reports" className="legal-section">
        <h2>Sensitive security issues</h2>
        <div className="legal-caution"><CircleAlert size={18} aria-hidden="true"/><p><strong>Do not disclose vulnerabilities publicly.</strong> Never post tokens, private source, customer data, working exploits or unpatched vulnerabilities in GitHub issues.</p></div>
        <p>A verified confidential reporting route has not yet been published. Until one exists, the public feedback channel should not be used for a sensitive disclosure.</p>
      </section>

      <section id="privacy" className="legal-section">
        <h2>Privacy requests</h2>
        <p>Connected scans use GitHub identity for authorization and can retain encrypted reports for a limited period. Individual reports can be deleted from Agent history. See the <Link href="/privacy">Privacy Policy</Link> for current processing and retention details.</p>
        <p>Do not submit sensitive personal-data requests through a public issue. A private request route should be published before the service makes formal response-time commitments.</p>
      </section>

      <section id="reports" className="legal-section">
        <h2>Repository and report support</h2>
        <p>If a repository does not appear in the selector, use <strong>Manage repository access</strong> on the assessment screen and confirm the repository is granted to the Secuvora GitHub App. If a report is no longer needed, delete it from Agent history.</p>
        <p>General non-sensitive access bugs can be reported through GitHub Issues. Never paste a private repository's source, credentials or full report evidence into a public ticket.</p>
      </section>

      <section id="updates" className="legal-section">
        <h2>Private support channel</h2>
        <p>Secuvora does not currently claim a staffed private help desk, service-level response time, confidential vulnerability inbox or registered corporate office that has not been established. Verified private support details should be added here once created and tested.</p>
        <p>For now, review the <Link href="/security">Security practices</Link> and use the public project channel only for information safe to disclose publicly.</p>
      </section>
    </LegalPage>
  );
}
