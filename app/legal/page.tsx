import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, CreditCard, Fingerprint, Headphones, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Center | Secuvora",
  description: "Secuvora privacy, terms, billing status, security practices and support information.",
};

const pages = [
  { href: "/privacy", title: "Privacy policy", desc: "GitHub authorization, repository processing, report retention and your controls.", icon: Fingerprint, section: "DATA" },
  { href: "/terms", title: "Terms of use", desc: "Authorized use, repository access and the limits of automated security findings.", icon: BookOpen, section: "TERMS" },
  { href: "/refunds", title: "Pricing & billing", desc: "Current report access, payment status and what must change before future checkout.", icon: CreditCard, section: "BILLING" },
  { href: "/security", title: "Security practices", desc: "Read-only permissions, scan boundaries, encrypted reports and responsible reporting.", icon: ShieldCheck, section: "TRUST" },
  { href: "/contact", title: "Contact & support", desc: "Current non-sensitive feedback channel and boundaries for private disclosures.", icon: Headphones, section: "SUPPORT" },
];

export default function LegalCenter() {
  return (
    <div className="legal-site">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="legal-nav"><div className="container legal-nav-inner"><Link className="brand" href="/">secuvora<span>.</span></Link><Link className="legal-back" href="/"><ArrowLeft size={16}/> Back to Secuvora</Link></div></header>
      <main id="main" className="container legal-center">
        <p className="eyebrow">SECUVORA / TRUST & TRANSPARENCY</p>
        <h1>Clarity is part<br/>of security.</h1>
        <p className="legal-center-lead">How repository access, reports, billing status and security boundaries work—without hiding the important details.</p>
        <div className="legal-center-meta">Five published documents <span>·</span> Reviewed 29 October 2026</div>
        <div className="legal-center-grid">
          {pages.map(({ href, title, desc, icon: Icon, section }, i) => (
            <Link key={href} className="legal-center-card" href={href}>
              <span className="legal-center-card-top"><span className="legal-center-icon"><Icon size={21}/></span><span>{String(i + 1).padStart(2, "0")} / {section}</span></span>
              <strong>{title}</strong>
              <p>{desc}</p>
              <span className="legal-center-more">Read document <ArrowUpRight size={16}/></span>
            </Link>
          ))}
        </div>
        <div className="legal-center-foot"><ShieldCheck size={18}/><p>Secuvora supports read-only GitHub-connected repository investigations and short-term encrypted report recovery when the required deployment services are available. The scanner is bounded automated analysis, not a penetration test or certification. Customer billing is not enabled.</p></div>
      </main>
      <footer className="legal-footer"><div className="container legal-footer-inner"><Link href="/" className="brand">secuvora<span>.</span></Link><nav aria-label="Footer legal navigation">{pages.map(item => <Link href={item.href} key={item.href}>{item.title}</Link>)}</nav></div></footer>
    </div>
  );
}
