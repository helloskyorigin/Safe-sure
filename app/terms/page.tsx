import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | Secuvora",
  description: "Terms and permissions for using the Secuvora security agent.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="LEGAL / TERMS OF USE"
      title="Terms of use."
      lead="Clear boundaries for using the Secuvora automated security investigation platform."
      related={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/security", label: "Security Practices" },
      ]}
    >
      <h2>1. Acceptance of terms</h2>
      <p>By accessing or using Secuvora, you agree to these terms. Secuvora provides automated, read-only security checks for software repositories.</p>
      <h2>2. Authorized use</h2>
      <p>You confirm that you own or have explicit authorization from the repository owner to inspect any codebase you submit to Secuvora. You must not use the platform to scan codebases without authorization.</p>
      <h2>3. Nature of automated analysis</h2>
      <p>Secuvora provides static source checks, configuration analysis, and dependency advisory matching. Automated scans have limitations, can produce false positives or false negatives, and do not constitute a formal penetration test, security audit, or guarantee of bug-free software.</p>
      <h2>4. Intellectual property</h2>
      <p>The Secuvora brand, interface design, scanner rules, and platform software are property of Secuvora. Your source code remains your intellectual property.</p>
      <h2>5. Limitation of liability</h2>
      <p>Secuvora is provided on an &quot;as is&quot; basis without warranties of any kind. We are not liable for any direct or indirect damages arising from the use of our security reports or remediation suggestions.</p>
      <h2>6. Changes to terms</h2>
      <p>We may update these terms as the platform evolves. Continued use after changes constitutes acceptance.</p>
    </LegalPage>
  );
}
