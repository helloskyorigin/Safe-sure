import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CircleAlert, MessageSquareText } from "lucide-react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Contact & Support | ShipSafe",
  description: "Contact ShipSafe about non-sensitive feedback and learn how private support will be provided before the commercial service launches.",
};

const sections: LegalSection[] = [
  { id: "feedback", title: "Product feedback" },
  { id: "security-reports", title: "Sensitive security issues" },
  { id: "privacy", title: "Privacy requests" },
  { id: "billing", title: "Report access and support" },
  { id: "updates", title: "Future contact options" },
];

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="COMPANY / CONTACT"
      title="Contact ShipSafe."
      lead="Questions, product feedback or a website bug? Here is the appropriate channel to use today—and what not to share in public."
      sections={sections}
      summary={[
        "Public GitHub issues are open for non-sensitive website bugs, suggestions and general product questions.",
        "Do not post private source code, credentials, security weaknesses or personal records in public issues.",
        "Dedicated private support, privacy and security-reporting channels must be published before sensitive customer data is accepted.",
      ]}
    >
      <section id="feedback" className="legal-section">
        <h2>Product feedback</h2>
        <p>ShipSafe is a developer-focused project and its public code repository has an enabled Issues section. The current way to share ordinary, non-sensitive bug reports and feature feedback is to create a GitHub issue.</p>
        <div className="legal-contact-card">
          <span className="legal-contact-icon"><MessageSquareText size={20}/></span>
          <div><strong>GitHub issues</strong><p>Best for layout bugs, accessibility feedback, typos and product suggestions. Issues are public and may be indexed by search engines.</p>
          <a href="https://github.com/helloskyorigin/Safe-sure/issues/new" target="_blank" rel="noopener noreferrer">Open a public issue <ArrowUpRight size={15} aria-hidden="true"/></a></div>
        </div>
        <p>Useful feedback includes the relevant page URL, browser/device details, reproducible steps and the expected behavior. Remove private information from screenshots before posting.</p>
      </section>
      <section id="security-reports" className="legal-section">
        <h2>Sensitive security issues</h2>
        <div className="legal-caution"><CircleAlert size={18} aria-hidden="true"/><p><strong>Do not disclose vulnerabilities publicly.</strong> Never post tokens, private source code, customer data, working exploits or unpatched vulnerabilities in GitHub issues.</p></div>
        <p>A verified confidential reporting route has not yet been published. Before handling private source or sensitive disclosures, a confidential contact route and disclosure process must be configured. This page will be updated once the channel is active.</p>
      </section>
      <section id="privacy" className="legal-section">
        <h2>Privacy requests</h2>
        <p>The current website does not offer ShipSafe user accounts, upload personal scan data or collect purchases. The <Link href="/privacy">privacy policy</Link> describes ordinary infrastructure-level information.</p>
        <p>For sensitive personal-data access, correction or deletion requests, please do not use public issues. A suitable private request method must be provided before the service starts accepting identifiable customer information.</p>
      </section>
      <section id="billing" className="legal-section">
        <h2>Billing and report support</h2>
        <p>There is currently no live checkout or customer billing record. Public scan reports are temporarily available in the same browser tab; there is no account-based recovery. A private channel is still needed for sensitive report and access issues. For the current status read <Link href="/refunds">Payments & refunds</Link>.</p>
      </section>
      <section id="updates" className="legal-section">
        <h2>Future contact options</h2>
        <p>ShipSafe intends to provide private customer-support and vulnerability-reporting channels as part of its launch readiness. We will list their verified details here after they are created and tested, rather than publish an address that does not exist.</p>
        <p>For now, explore the <Link href="/">homepage</Link>, our <Link href="/security">security practices</Link> and the public GitHub repository for non-sensitive updates.</p>
        <p className="legal-note"><strong>Contact transparency:</strong> The project does not claim a staffed help desk, service-level response time or registered corporate office that has not been established.</p>
      </section>
    </LegalPage>
  );
}
