import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | Secuvora",
  description: "Terms for Secuvora's read-only GitHub repository investigations, authorized use, report limitations and external services.",
};

const sections: LegalSection[] = [
  { id: "agreement", title: "About these terms" },
  { id: "availability", title: "What Secuvora provides" },
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
      lead="The rules for connecting a repository, using Secuvora's findings and understanding what an automated investigation can—and cannot—establish."
      sections={sections}
      summary={[
        "Secuvora uses read-only GitHub authorization and only analyzes repositories made available through the connected GitHub App.",
        "You may submit only repositories you own or are authorized to assess.",
        "Automated findings are evidence for review, not a penetration test, certification or guarantee of security.",
      ]}
    >
      <section id="agreement" className="legal-section">
        <h2>About these terms</h2>
        <p>These terms apply to access to the Secuvora website and its repository investigation features. “Secuvora” means the software project presented here; this wording does not assert that a separately incorporated company exists.</p>
        <p>By using the service, you agree to use it lawfully and within the authorization boundaries below. Mandatory rights that cannot legally be excluded remain unaffected.</p>
      </section>

      <section id="availability" className="legal-section">
        <h2>What Secuvora provides</h2>
        <p>Secuvora provides a read-only GitHub repository investigation workflow, encrypted short-term report recovery for connected scans, an illustrative sample report and supporting documentation. The current scanner applies bounded static source/configuration rules and published dependency-advisory checks. It does not execute repository code or perform active runtime penetration testing.</p>
        <p>GitHub-connected features depend on valid GitHub App authorization and deployment infrastructure. If those dependencies are unavailable, Secuvora may refuse or interrupt a scan rather than fabricate progress or results.</p>
      </section>

      <section id="acceptable-use" className="legal-section">
        <h2>Acceptable use</h2>
        <p>Do not interfere with service availability, bypass access controls, abuse rate limits, impersonate another user, submit malicious requests intended to attack the service, or use Secuvora in violation of applicable law.</p>
        <p>Do not represent a Secuvora report as an official audit, penetration-test engagement, compliance certification or proof that software is free of vulnerabilities.</p>
      </section>

      <section id="authorization" className="legal-section">
        <h2>Authorized security testing</h2>
        <p>You must own the repository you submit or have explicit authority to assess it. GitHub authorization establishes technical access through the connected account and App installation; it does not by itself resolve every contractual or legal right to test a codebase.</p>
        <p>Secuvora requests read-only repository access and does not request permission to push code. Nothing on this website grants permission to attack third-party infrastructure or perform intrusive testing outside the bounded product workflow.</p>
      </section>

      <section id="results" className="legal-section">
        <h2>Reliability of information</h2>
        <p>Automated security analysis is limited by available source, implemented rules, package metadata and application context. Findings may be incomplete, may contain false positives or may require manual verification. A low finding count does not establish that a project is secure.</p>
        <p>The sample results experience is fictional and labeled as illustrative. Real connected reports should be interpreted together with their evidence, coverage information and stated limitations.</p>
      </section>

      <section id="ownership" className="legal-section">
        <h2>Intellectual property</h2>
        <p>Secuvora's original brand presentation, interface and written product content remain part of the project. Third-party software, trademarks and materials remain subject to their own rights and licenses.</p>
        <p>Connecting a repository does not transfer ownership of that repository to Secuvora. The service reads source only for the requested investigation and does not intentionally retain a complete source archive.</p>
      </section>

      <section id="third-party" className="legal-section">
        <h2>External services</h2>
        <p>GitHub, OSV.dev, the deployment host and report-storage provider operate independently and apply their own terms and policies. Availability of those services can affect Secuvora's operation.</p>
      </section>

      <section id="disclaimers" className="legal-section">
        <h2>Disclaimers and liability</h2>
        <p>Secuvora is provided for automated security review and developer evaluation without a promise of uninterrupted availability, complete vulnerability coverage or error-free output. Findings should be reviewed before consequential remediation or release decisions.</p>
        <p>To the extent permitted by applicable law, the project does not accept responsibility for losses caused solely by treating an automated or illustrative result as a comprehensive professional security assurance. Nothing here limits rights or liabilities that cannot lawfully be limited.</p>
      </section>

      <section id="revisions" className="legal-section">
        <h2>Updates and questions</h2>
        <p>These terms may change when repository permissions, scan scope, report retention, support or commercial terms materially change. If a paid service is introduced, seller identity, pricing, tax, cancellation/refund terms and appropriate support details must be disclosed before purchase.</p>
        <p>For ordinary non-sensitive feedback see <Link href="/contact">Contact</Link>. For data and security details see <Link href="/privacy">Privacy</Link> and <Link href="/security">Security</Link>.</p>
        <p className="legal-note"><strong>Important:</strong> No SOC 2, ISO 27001, penetration-test certification or staffed support commitment is claimed unless it is explicitly documented and verifiable.</p>
      </section>
    </LegalPage>
  );
}
