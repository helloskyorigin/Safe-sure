import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Security Practices | Secuvora",
  description: "How Secuvora protects user data, tokens, and encrypted reports.",
};

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="TRUST / SECURITY PRACTICES"
      title="Security practices."
      lead="How Secuvora safeguards repository access, encrypted report storage, and developer data."
      related={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Use" },
      ]}
    >
      <h2>1. Read-only design</h2>
      <p>Secuvora investigations are strictly read-only. Our scanner inspects code and dependency definitions to surface security signals but never modifies your repository or pushes code changes.</p>
      <h2>2. Token and credential protection</h2>
      <p>GitHub OAuth tokens are handled securely on the server side and never exposed to the client browser. When potential credentials or secrets are detected in source code, Secuvora automatically masks them in report displays.</p>
      <h2>3. Encrypted report storage</h2>
      <p>Reports stored in server-side persistence are encrypted at rest. Access to stored reports is restricted to the authenticated GitHub user who initiated the investigation.</p>
      <h2>4. Responsible disclosure</h2>
      <p>If you discover a security vulnerability in Secuvora itself, please report it via our GitHub repository issues or contact channels so we can investigate and resolve it promptly.</p>
    </LegalPage>
  );
}
