import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Security Practices | ShipSafe",
  description: "ShipSafe's current product status, responsible security principles and planned safeguards.",
};

export default function SecurityPage() {
  return (
    <LegalPage eyebrow="TRUST / SECURITY" title="Security practices." lead="A security product should be precise about what it actually protects, measures and promises.">
      <h2>1. Current stage</h2>
      <p>ShipSafe currently serves a landing page and interactive illustrative examples. There is no production scanning engine, source-code integration or paid reporting backend connected to this website. The example findings do not represent live scans.</p>
      <h2>2. Intended access boundaries</h2>
      <p>The planned assessment flow will use explicit authorization and the minimum permissions reasonably needed to inspect a selected application. The product is designed for read-only assessment rather than making changes to your code. Implementation and security verification are required before launch.</p>
      <h2>3. Planned safeguards</h2>
      <ul>
        <li>Isolate analysis of untrusted application content.</li>
        <li>Avoid executing submitted application scripts by default.</li>
        <li>Mask potential credentials in reports and diagnostic logs.</li>
        <li>Minimize source-code retention and document deletion windows.</li>
        <li>Make security findings traceable to evidence and describe coverage limitations.</li>
        <li>Unlock any paid report only after server-verified payment.</li>
      </ul>
      <p>These are engineering requirements, not a claim that an unlaunched backend is already compliant or certified.</p>
      <h2>4. Responsible use</h2>
      <p>Future assessment functionality will be intended only for applications users own or are authorized to evaluate. We will not advertise security grades as proof of comprehensive protection.</p>
      <h2>5. Vulnerability reports</h2>
      <p>Do not publish exploit details, personal data, tokens or vulnerable private endpoints in public GitHub issues. A private security-reporting channel is not yet published; it must be provided before broader production rollout. You can use the <a href="/contact">contact page</a> for non-sensitive questions.</p>
      <h2>6. Updates</h2>
      <p>This page will be revised alongside implementation, independent validation and the introduction of live scanning and payments.</p>
    </LegalPage>
  );
}
