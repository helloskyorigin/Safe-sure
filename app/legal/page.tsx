import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, CreditCard, Fingerprint, Headphones, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Brand from "@/components/Brand";

export const metadata: Metadata = {
  title: "Legal Center | Secuvora",
  description: "Terms, privacy, refunds, and security disclosures for Secuvora investigations.",
};

const pages = [
  { href: "/privacy", title: "Privacy Policy", icon: Fingerprint, lead: "How Secuvora collects, handles and minimizes data during source investigations." },
  { href: "/terms", title: "Terms of Use", icon: BookOpen, lead: "Rules and authorized permissions for running automated security agent checks." },
  { href: "/refunds", title: "Billing & Delivery", icon: CreditCard, lead: "Free assessment tier, one-time report access, and transparent pricing." },
  { href: "/security", title: "Security Practices", icon: ShieldCheck, lead: "How we protect your repository access tokens and encrypted reports." },
  { href: "/contact", title: "Contact & Support", icon: Headphones, lead: "Get in touch for support, security disclosures, or enterprise questions." },
];

export default function LegalCenterPage() {
  return (
    <div className="legal-site">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="legal-nav"><div className="container legal-nav-inner"><Brand /><div className="legal-nav-actions"><ThemeToggle/><Link className="legal-back" href="/"><ArrowLeft size={16}/> Back to Secuvora</Link></div></div></header>
      <main id="main" className="container legal-center">
        <p className="eyebrow">SECUVORA / TRUST & TRANSPARENCY</p>
        <h1>Clarity is part<br/>of security.</h1>
        <p className="legal-center-lead">Clear policies, transparent data handling, and responsible security boundaries for developers and teams.</p>
        <div className="legal-center-grid">
          {pages.map(item => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href} className="legal-center-card">
                <div className="legal-center-icon"><Icon size={20}/></div>
                <strong>{item.title}</strong>
                <p>{item.lead}</p>
                <span className="legal-center-more">Read document <ArrowUpRight size={14}/></span>
              </Link>
            );
          })}
        </div>
        <div className="legal-center-foot"><ShieldCheck size={18}/><p>Secuvora supports read-only GitHub-connected repository investigations and short-term encrypted report recovery when the required deployment services are available. The scanner is bounded automated analysis, not a penetration test or certification. Customer billing is not enabled.</p></div>
      </main>
      <footer className="legal-footer"><div className="container legal-footer-inner"><Brand /><nav aria-label="Footer legal navigation">{pages.map(item => <Link href={item.href} key={item.href}>{item.title}</Link>)}</nav></div></footer>
    </div>
  );
}
