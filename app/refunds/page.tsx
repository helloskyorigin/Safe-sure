import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Pricing & Billing Status | Secuvora",
  description: "Secuvora's current report access and billing status. The service does not currently process customer payments.",
};

const sections: LegalSection[] = [
  { id: "current", title: "Current access" },
  { id: "delivery", title: "Report access and delivery" },
  { id: "payments", title: "Billing and refunds" },
  { id: "changes", title: "Future commercial changes" },
  { id: "questions", title: "Questions and contact" },
];

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="POLICY / BILLING"
      title="Pricing & billing."
      lead="The current product does not ask for payment. This page explains report access now and what would need to change before any future paid offering."
      sections={sections}
      summary={[
        "Secuvora currently does not collect payment-card details, create customer orders or issue invoices.",
        "Connected GitHub investigations can produce a complete report without a separate paid-results gate.",
        "Any future paid offering must publish its price, seller details, renewal or one-time terms, refund rules and support route before checkout.",
      ]}
    >
      <section id="current" className="legal-section">
        <h2>Current access</h2>
        <p>The current Secuvora experience lets an authorized GitHub user run a bounded repository investigation and view the resulting findings, evidence, impact context, remediation and verification guidance. The sample report remains fictional and clearly labeled.</p>
        <p>There is no active subscription, report purchase or premium-results unlock in the current application.</p>
      </section>

      <section id="delivery" className="legal-section">
        <h2>Report access and delivery</h2>
        <p>Connected reports are associated with the authenticated GitHub user and can be reopened from Agent history while the encrypted report record remains within its retention period. Users can delete individual connected reports from that history.</p>
        <p>Legacy browser-only reports created by older public-scan flows may remain local to the device. Report output must reflect completed checks and must not invent findings to fill gaps in analysis.</p>
      </section>

      <section id="payments" className="legal-section">
        <h2>Billing and refunds</h2>
        <p>Secuvora does not currently process customer payments, so there is no Secuvora order to cancel or refund. The application should never ask for payment-card information unless a separately documented checkout is introduced.</p>
        <p>If a future offering becomes paid, applicable consumer protections remain in effect and the commercial policy must explain price, taxes where relevant, seller identity, delivery, cancellation or refund eligibility and a private support method before purchase.</p>
      </section>

      <section id="changes" className="legal-section">
        <h2>Future commercial changes</h2>
        <p>Any future checkout, subscription or paid report would require updated user-facing terms and billing disclosures before it goes live. Nothing on this page creates a recurring payment obligation.</p>
        <p>Material changes to data handling would also be reflected in <Link href="/privacy">Privacy</Link> and <Link href="/terms">Terms</Link>.</p>
      </section>

      <section id="questions" className="legal-section">
        <h2>Questions and contact</h2>
        <p>For non-sensitive product feedback, see <Link href="/contact">Contact</Link>. Do not place private source code, credentials, personal records or undisclosed vulnerabilities in a public support channel.</p>
        <p className="legal-note"><strong>Current billing status:</strong> No customer checkout or payment collection is enabled.</p>
      </section>
    </LegalPage>
  );
}
