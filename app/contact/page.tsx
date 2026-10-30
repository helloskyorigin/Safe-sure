import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Contact & Support | Secuvora",
  description: "Get in touch with the Secuvora team for support, feedback, or security inquiries.",
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="SUPPORT / CONTACT"
      title="Contact & support."
      lead="How to reach out for product feedback, questions, or security inquiries."
      related={[
        { href: "/security", label: "Security Practices" },
        { href: "/privacy", label: "Privacy Policy" },
      ]}
    >
      <h2>GitHub repository & community</h2>
      <p>For bug reports, feature requests, or general feedback, please visit our public repository issue tracker.</p>
      <p>
        <a className="legal-external" href="https://github.com/helloskyorigin/Safe-sure/issues" target="_blank" rel="noopener noreferrer">
          Open GitHub issues <ArrowUpRight size={15}/>
        </a>
      </p>
      <h2>Security disclosures</h2>
      <p>To report a security vulnerability or sensitive concern regarding Secuvora, please use our private communication channels or open a confidential security advisory.</p>
      <h2>Useful links</h2>
      <p>Review our <Link href="/privacy">privacy policy</Link>, <Link href="/terms">terms of use</Link>, and <Link href="/security">security practices</Link>.</p>
    </LegalPage>
  );
}
