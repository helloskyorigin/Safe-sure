import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Billing & Delivery | Secuvora",
  description: "Secuvora pricing, free tier, and delivery model.",
};

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="LEGAL / BILLING & DELIVERY"
      title="Billing & delivery."
      lead="Transparent information regarding Secuvora's assessment tiers and report access."
      related={[
        { href: "/terms", label: "Terms of Use" },
        { href: "/privacy", label: "Privacy Policy" },
      ]}
    >
      <h2>1. Free core investigations</h2>
      <p>Secuvora provides full reports, exact file locations, evidence excerpts, and remediation checklists at no charge. There are no paywalls blocking specific findings.</p>
      <h2>2. One-time reports and access</h2>
      <p>Reports generated during public or connected repository investigations are delivered immediately in your browser or saved securely to your agent history.</p>
      <h2>3. Subscriptions and billing</h2>
      <p>Customer billing and recurring subscriptions are not currently active on Secuvora. All core developer tools and sample reports are provided freely.</p>
      <h2>4. Support</h2>
      <p>If you experience any technical issues accessing an investigation report or connecting your GitHub repository, please reach out via our contact page.</p>
    </LegalPage>
  );
}
