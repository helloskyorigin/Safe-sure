import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | ShipSafe",
  description: "The conditions for visiting ShipSafe, using its interactive demonstrations and understanding the scope of future assessments.",
};

const sections: LegalSection[] = [
  { id: "agreement", title: "About these terms" },
  { id: "availability", title: "What is available today" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "authorization", title: "Authorized security testing" },
  { id: "results", title: "Reliability of information" },
  { id: "ownership", title: "Intellectual property" },
  { id: "third-party", title: "External services" },
  { id: "disclaimers", title: "Disclaimers and liability" },
  { id: "revisions", title: "Updates and questions" },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="POLICY / TERMS"
      title="Terms of use."
      lead="A straightforward explanation of what ShipSafe offers today, how the preview may be used and what to expect before the service goes live."
      sections={sections}
      summary={[
        "The current site is a public preview and does not provide live vulnerability scanning or paid reports.",
        "Example assessments are illustrative, not results from your website or source code.",
        "Only applications you own or are expressly authorized to test may be assessed when scanning becomes available.",
      ]}
    >
      <section id="agreement" className="legal-section">
        <h2>About these terms</h2>
        <p>These terms apply to access to the ShipSafe website and its publicly available product demonstrations. “ShipSafe” means the project presented on this website; this wording does not assert that a separately incorporated company exists. Additional verified operator and business-identification information will be published before commercial checkout is enabled.</p>
        <p>By using this preview, you agree to use it lawfully and respect the restrictions below. If you do not agree, you should not use the website. Where mandatory legal rights apply, nothing here is intended to remove them.</p>
      </section>
      <section id="availability" className="legal-section">
        <h2>What is available today</h2>
        <p>The website contains product descriptions, a pricing proposal, an interactive sample report and informational pages. <strong>No real application scanning, GitHub authorization, production report delivery or payment processing is enabled at this stage.</strong> Interface controls marked as examples demonstrate intended functionality only.</p>
        <p>The proposed commercial service is a one-time detailed assessment report. Before it becomes available, the scope, payment terms and service-specific agreement will be published and displayed at the relevant transaction point.</p>
      </section>
      <section id="acceptable-use" className="legal-section">
        <h2>Acceptable use</h2>
        <p>You may browse and share links to the public website for legitimate evaluation and feedback. Do not interfere with its availability, bypass access controls, attempt unauthorized extraction of information, impersonate others, introduce malicious code or use the site in violation of applicable law.</p>
        <p>Do not misrepresent sample findings as verified results, claim an official audit or security certification on the basis of this website, or submit private credentials through public issues or other unprotected channels.</p>
      </section>
      <section id="authorization" className="legal-section">
        <h2>Authorized security testing</h2>
        <p>The planned security product is intended for testing applications or code you own or have explicit authority to assess. Merely knowing a URL or having access to a public repository does not automatically grant permission to perform intrusive testing.</p>
        <p>Future use of assessment features will require you to confirm your authority to test the relevant target. The service will document its permitted scan scope, access model, restrictions and any additional rules before being activated. Nothing in this website grants permission to attack third-party services.</p>
      </section>
      <section id="results" className="legal-section">
        <h2>Reliability of information</h2>
        <p>Software security assessments are inherently limited by available code or endpoints, implemented checks, configuration and context. Automated findings may be incomplete, may require manual review or may be false positives. A low finding count does not establish that an application is safe.</p>
        <p>Examples shown in the current report preview are fabricated solely to illustrate the intended interface and must not be treated as factual vulnerability findings. Future paid reports should disclose their assessment scope and supporting evidence.</p>
      </section>
      <section id="ownership" className="legal-section">
        <h2>Intellectual property</h2>
        <p>ShipSafe's original brand presentation, content, illustrations and interface are part of the project. Third-party components, libraries, trademarks and materials remain subject to their respective licenses and rights. Access to the website does not transfer ownership of any intellectual property.</p>
        <p>Future application submissions will remain the responsibility of their respective owners. ShipSafe is not requesting or accepting customer source code through this preview.</p>
      </section>
      <section id="third-party" className="legal-section">
        <h2>External services</h2>
        <p>Links to GitHub or other external resources are provided for convenience. These services are operated independently and apply their own terms, privacy statements and policies. We are not responsible for content or practices on sites outside our control.</p>
      </section>
      <section id="disclaimers" className="legal-section">
        <h2>Disclaimers and liability</h2>
        <p>The pre-launch website and its illustrative content are provided for general information and evaluation, without a promise of uninterrupted availability or error-free information. The examples do not constitute a security certification, penetration-test engagement, legal opinion or professional assurance of system safety.</p>
        <p>To the extent permitted by applicable law, the project does not accept responsibility for decisions made solely on the basis of illustrative content or for third-party products linked here. Nothing in these terms limits liability or remedies that cannot lawfully be excluded.</p>
      </section>
      <section id="revisions" className="legal-section">
        <h2>Updates and questions</h2>
        <p>We may update these website terms as the preview evolves. Any active paid service must provide the applicable commercial terms before a purchase takes place, including operator identity, required legal notices and the available complaint and refund process.</p>
        <p>For ordinary non-sensitive feedback see <Link href="/contact">Contact</Link>. For information about the present data practices and planned security controls, see <Link href="/privacy">Privacy</Link> and <Link href="/security">Security</Link>.</p>
        <p className="legal-note"><strong>Important:</strong> These terms govern the currently published preview. They do not pretend that a live paid scanning service, registered corporate identity or private customer-support desk already exists.</p>
      </section>
    </LegalPage>
  );
}
