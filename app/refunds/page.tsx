import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Payments & Refunds | ShipSafe",
  description: "Current payment status and planned one-time report model for ShipSafe.",
};

export default function RefundsPage() {
  return (
    <LegalPage eyebrow="LEGAL / BILLING" title="Payments & refunds." lead="One transparent price is the goal. This page makes clear what is and is not available today.">
      <h2>1. No payments are currently collected</h2>
      <p>ShipSafe is a pre-launch product preview. No live checkout exists on this website. We are not currently selling assessments or collecting card information. If a third party claims to sell a ShipSafe report through this page, treat that claim cautiously.</p>
      <h2>2. Planned pricing</h2>
      <p>The proposed paid offering is a one-time $19 detailed report for a specific assessment, without a recurring subscription. An initial severity overview is planned to be available at no charge. Actual final scope and pricing will be confirmed at the active checkout.</p>
      <h2>3. Refund policy at launch</h2>
      <p>Before accepting any payment, ShipSafe will publish a definitive refund and delivery policy, including what happens if payment succeeds but a report is not delivered, a technical error occurs or a duplicate charge is made. Any mandatory consumer rights under applicable law will be respected.</p>
      <h2>4. No billing information today</h2>
      <p>The current marketing website does not ask for billing or card details. When checkout is implemented, the payment processor and relevant data handling will be disclosed before payment.</p>
      <h2>5. Questions</h2>
      <p>For general inquiries, review our <a href="/contact">contact page</a>. A private billing-support channel will be published before transactions begin.</p>
      <p className="legal-note">This is an accurate pre-launch billing disclosure, not a finalized commercial refund agreement.</p>
    </LegalPage>
  );
}
