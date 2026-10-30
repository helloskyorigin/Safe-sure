import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Secuvora",
  description: "How Secuvora handles repository data, GitHub tokens, and report retention.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="LEGAL / PRIVACY POLICY"
      title="Privacy policy."
      lead="Your source code is sensitive. Here is exactly what Secuvora accesses, processes, and retains."
      related={[
        { href: "/security", label: "Security Practices" },
        { href: "/terms", label: "Terms of Use" },
      ]}
    >
      <h2>1. Scope and data minimization</h2>
      <p>Secuvora is built for developers. We believe in strict data minimization: we only access the files and repositories you explicitly choose to investigate, and we never train AI models on your private source code.</p>
      <h2>2. What we collect</h2>
      <ul>
        <li><strong>GitHub Identity:</strong> When you connect your GitHub account for private investigations, we store your GitHub user ID, login, and an encrypted OAuth token needed to read your selected repositories.</li>
        <li><strong>Repository Source Snapshots:</strong> Source files loaded during an investigation are processed in memory to run our security rules and dependency checks.</li>
        <li><strong>Generated Reports:</strong> Investigation reports are saved securely so you can reopen them via Agent history.</li>
      </ul>
      <h2>3. How tokens and reports are stored</h2>
      <p>OAuth access tokens and encrypted reports are stored in secure, isolated server storage backed by authenticated encryption. Tokens are used solely to fetch repository contents during active scans and are never shared with third parties.</p>
      <h2>4. Public repository scans</h2>
      <p>Public repository investigations do not require a Secuvora account or GitHub OAuth sign-in. Results are stored locally in your browser session for instant recovery.</p>
      <h2>5. Cookies and analytics</h2>
      <p>Secuvora uses operational storage (localStorage and session cookies) solely to maintain your authentication session, UI appearance preferences (light/dark mode), and recent investigation history.</p>
      <h2>6. Your rights</h2>
      <p>You can disconnect Secuvora from your GitHub account at any time via your GitHub settings. You can also delete your saved investigation history from within the app.</p>
      <p className="legal-note">This policy reflects Secuvora's current architecture for GitHub-connected and public repository analysis.</p>
    </LegalPage>
  );
}
