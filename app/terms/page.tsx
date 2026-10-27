import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | ShipSafe",
  description: "Terms for using the ShipSafe pre-launch website and illustrative security product preview.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="LEGAL / TERMS" title="Terms of use." lead="Clear boundaries for exploring ShipSafe while the security assessment product is in development.">
      <h2>1. The current offering</h2>
      <p>ShipSafe is currently a pre-launch informational website. The preview of security findings is illustrative, not the result of an assessment of your application. Application connection, scanning and checkout are not yet available.</p>
      <h2>2. Permitted use</h2>
      <p>You may browse the website and learn about the planned product for lawful purposes. You must not misuse the site, impair its operation, attempt unauthorized access or present its illustrative findings as real assessments.</p>
      <h2>3. Authorization for future assessments</h2>
      <p>When scanning launches, you will be responsible for ensuring you own or have explicit authorization to assess any application or code you submit. Automated checks have limitations, can produce false positives and do not guarantee that an application is secure. More specific service terms will be presented before scanning becomes available.</p>
      <h2>4. Pricing and checkout</h2>
      <p>The current site describes a proposed $19 one-time detailed report. This is product information only, not an active offer to purchase. There is no checkout, subscription or charge through the present site. Applicable purchasing terms will be available before transactions are enabled.</p>
      <h2>5. No professional certification</h2>
      <p>Illustrative security explanations on this website are for educational and product-demonstration purposes. They are not a penetration-test certificate, audit opinion, guarantee, legal advice or substitute for an appropriate security review.</p>
      <h2>6. Intellectual property</h2>
      <p>The ShipSafe name, site text and original visual presentation are part of the project. Third-party names or tools remain the property of their respective owners. Nothing on this site grants permission to misuse others' intellectual property.</p>
      <h2>7. Availability and changes</h2>
      <p>The preview may change, be unavailable or contain errors. We may update its content and these terms while preparing the product for launch.</p>
      <h2>8. Questions</h2>
      <p>For public, non-sensitive questions, see the <a href="/contact">contact options</a>. Do not disclose private credentials, personal records or confidential security reports in public GitHub issues.</p>
      <p className="legal-note">Before commercial launch, operator identity, applicable jurisdiction, support channels and purchase-specific terms must be completed and reviewed.</p>
    </LegalPage>
  );
}
