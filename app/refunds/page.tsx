import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Pricing & Billing Status | ShipSafe",
  description: "Full ShipSafe security reports are planned to be free. No checkout, subscriptions or payment collection are active.",
};

const sections: LegalSection[] = [
  { id: "current", title: "Current status" },
  { id: "free", title: "Full reports without a paywall" },
  { id: "delivery", title: "Report access and delivery" },
  { id: "payments", title: "No payments or refunds" },
  { id: "changes", title: "Future policy changes" },
  { id: "questions", title: "Questions and contact" },
];

export default function RefundsPage() {
  return (
    <LegalPage eyebrow="POLICY / PRICING" title="Pricing & billing."
      lead="Clear terms, even while the product is still in development. ShipSafe's current plan is to provide the complete security report without a payment gate."
      sections={sections}
      summary={[
        "The complete report experience—including findings, evidence, impact and fixes—is planned to be free.",
        "The current site does not accept payment, collect billing details or issue invoices.",
        "Sample results are freely viewable, and public repository source scans can now generate complete reports.",
      ]}
    >
      <section id="current" className="legal-section">
        <h2>Current status</h2>
        <p>ShipSafe is currently a public product preview. You can view a clearly labeled, fictional full-report example at <Link href="/assess/results">Results</Link>, including findings, code locations, evidence, remediation and verification. The example is not an assessment of your application.</p>
        <p>Read-only public source scanning is available. Private GitHub authorization, durable report storage and authenticated report recovery have not launched. No customer security data or payment card details are collected through the preview.</p>
      </section>
      <section id="free" className="legal-section">
        <h2>Full reports without a paywall</h2>
        <p>Our current product direction is to show the full security report without a paid upgrade. When a real report is available, the intended experience is to include severity summaries, affected locations, evidence, possible impact, fix steps, verification guidance, and explicit scan limitations together.</p>
        <p>There is no subscription, one-time report charge or premium unlock in the current website experience.</p>
      </section>
      <section id="delivery" className="legal-section">
        <h2>Report access and delivery</h2>
        <p>A public scan report can be viewed in the same browser tab after it completes, using temporary session storage. There is no durable report recovery service. Future private report access will require verified authorization. The system must show whether checks completed, failed or were skipped. Report details must not be fabricated to fill gaps in analysis.</p>
        <p>A sample report is downloadable from the preview for demonstration purposes, clearly identified as synthetic example data.</p>
      </section>
      <section id="payments" className="legal-section">
        <h2>No payments or refunds</h2>
        <p>The current service does not process payments or issue paid reports, so no order can be placed and no refund can be requested for a ShipSafe report. If someone asks you to pay for access to the current sample or claims a payment is required here, treat that as suspicious.</p>
        <p>If ShipSafe later introduces a separately priced product, the price, tax disclosures, seller identity, refund eligibility and a private support route must be published before any purchase is requested. Applicable mandatory consumer protections will remain in effect.</p>
      </section>
      <section id="changes" className="legal-section">
        <h2>Future policy changes</h2>
        <p>Any future paid offering would require an updated policy and appropriate checkout disclosures. Nothing on this page authorizes a charge or creates an ongoing payment obligation.</p>
        <p>Changes affecting the product's scope or data collection will also be reflected in our <Link href="/privacy">privacy</Link> and <Link href="/terms">terms</Link> pages.</p>
      </section>
      <section id="questions" className="legal-section">
        <h2>Questions and contact</h2>
        <p>For non-sensitive product feedback, visit <Link href="/contact">Contact</Link>. Please do not post private application code, credentials or personal records in public support channels.</p>
        <p className="legal-note"><strong>Product preview:</strong> Full example results are available now; real reports will be available only after the authorized scanning system is built and verified.</p>
      </section>
    </LegalPage>
  );
}
