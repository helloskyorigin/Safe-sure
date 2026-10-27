import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Payments & Refunds | ShipSafe",
  description: "Understand ShipSafe's proposed $19 one-time report, current checkout status, delivery expectations and refund principles.",
};

const sections: LegalSection[] = [
  { id: "current-status", title: "Current payment status" },
  { id: "pricing", title: "The proposed $19 report" },
  { id: "delivery", title: "Report delivery" },
  { id: "payment-issues", title: "Payment errors or duplicates" },
  { id: "report-quality", title: "Report quality concerns" },
  { id: "refund-process", title: "How refunds will work" },
  { id: "rights", title: "Consumer rights and updates" },
];

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="POLICY / PAYMENTS"
      title="Payments & refunds."
      lead="One report. One transparent price. No recurring charges. Here is what the offer means and what must happen before checkout goes live."
      sections={sections}
      summary={[
        "No live checkout is connected to the current website, so you cannot be charged by ShipSafe today.",
        "The planned detailed report costs $19 once for a defined assessment; it is not a recurring subscription.",
        "A complete delivery, dispute and refund process will be published at or before the first purchase.",
      ]}
    >
      <section id="current-status" className="legal-section">
        <h2>Current payment status</h2>
        <p>The ShipSafe website is currently an informational preview. It contains no connected payment checkout, billing database or working purchase button. The "$19" displayed on the site describes the planned price of a future digital assessment report; it is not a charge being collected today.</p>
        <p>Do not enter card information or send money to a third party claiming to collect payment for this preview. The relevant payment processor and official checkout flow will be disclosed before accepting purchases.</p>
      </section>
      <section id="pricing" className="legal-section">
        <h2>The proposed $19 report</h2>
        <p>The intended model is a <strong>single $19 payment for detailed findings associated with one specified assessment</strong>. No account subscription, automatic renewal or recurring charge is proposed. A free preliminary overview will show issue counts grouped by severity where supported checks have run.</p>
        <p>A future checkout should show the final price, currency, any applicable taxes and the exact scope of the report before payment confirmation. The precise code revision or assessed target, report access and any recheck entitlement will also be stated with the product offer.</p>
      </section>
      <section id="delivery" className="legal-section">
        <h2>Report delivery</h2>
        <p>When the paid service launches, customers should receive the report described at checkout after a successful verified payment. Any estimated delivery window will be disclosed by the active product, not invented in advance.</p>
        <p>Technical failures, unsupported targets or incomplete scans should be handled transparently. The product must not generate fictional findings merely to complete a paid report. If a paid report cannot be supplied as promised, a corrective delivery or a refund review must be available under the final purchase policy.</p>
      </section>
      <section id="payment-issues" className="legal-section">
        <h2>Payment errors or duplicates</h2>
        <p>Before launching payment processing, ShipSafe will establish a private support channel for failed deliveries, duplicate payments, unexpected charges and mismatched checkout status. Any refund or reversal will be processed through the payment provider, subject to applicable rules and payment-network processing time.</p>
        <p>There is no customer billing history to retrieve from the present preview because no customer payments are being accepted.</p>
      </section>
      <section id="report-quality" className="legal-section">
        <h2>Report quality concerns</h2>
        <p>A security report provides evidence and recommendations for the checks actually performed; it cannot promise that every vulnerability will be found. A customer should have a way to raise a material discrepancy, a corrupted or inaccessible report, or a significant difference between the purchased description and delivered content.</p>
        <p>These requests will be governed by the final policy shown before checkout. The absence of a finding, by itself, does not prove a scan was defective, and buyers will not be asked to waive mandatory rights to receive the product as described.</p>
      </section>
      <section id="refund-process" className="legal-section">
        <h2>How refunds will work</h2>
        <p>Because sales are not yet enabled, this page does not pretend to describe an operational refund queue or guarantee an unimplemented automatic return system. Before the first paid order, we will publish:</p>
        <ul>
          <li>The situations eligible for a refund or correction, including failed delivery and duplicate charges.</li>
          <li>The private method to submit an order-related request and the information reasonably needed to locate it.</li>
          <li>Applicable request and response windows, plus the expected payment-provider processing method.</li>
          <li>Any limits applicable to delivered digital reports, subject to mandatory consumer law.</li>
        </ul>
        <p>Until checkout is activated, no purchase or refund request can be processed here. You can view current <Link href="/contact">contact options</Link> for non-sensitive inquiries.</p>
      </section>
      <section id="rights" className="legal-section">
        <h2>Consumer rights and updates</h2>
        <p>Nothing in a future checkout policy should exclude statutory consumer protections that apply to a particular transaction. ShipSafe will review its digital-product disclosures, grievance channel and refund terms against applicable law before accepting payment.</p>
        <p>Pricing, tax treatment, payment processor and the final commercial policy may change before launch. The policy presented during an actual purchase will govern that purchase, together with any non-waivable legal rights.</p>
        <p className="legal-note"><strong>No charges today:</strong> The landing page and demonstration are currently free to view. The $19 figure is a proposed one-time report price, not an active paid service.</p>
      </section>
    </LegalPage>
  );
}
