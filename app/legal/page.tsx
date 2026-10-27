import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, CreditCard, Fingerprint, Headphones, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Center | ShipSafe",
  description: "The official ShipSafe website policies and security information, organized in one place.",
};

const pages = [
  { href: "/privacy", title: "Privacy policy", desc: "What is processed when you visit ShipSafe, what is not collected and your choices.", icon: Fingerprint, section: "DATA" },
  { href: "/terms", title: "Terms of use", desc: "How the public preview may be used and what authorized assessments will require.", icon: BookOpen, section: "TERMS" },
  { href: "/refunds", title: "Payments & refunds", desc: "The planned one-time $19 offer, current payment status and consumer protections.", icon: CreditCard, section: "BILLING" },
  { href: "/security", title: "Security practices", desc: "Security principles, assessment limits and responsible vulnerability reporting.", icon: ShieldCheck, section: "TRUST" },
  { href: "/contact", title: "Contact & support", desc: "Where to send non-sensitive feedback and how private channels will be introduced.", icon: Headphones, section: "SUPPORT" },
];

export default function LegalCenter() {
  return (
    <div className="legal-site">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="legal-nav"><div className="container legal-nav-inner"><Link className="brand" href="/">shipsafe<span>.</span></Link><Link className="legal-back" href="/"><ArrowLeft size={16}/> Back to ShipSafe</Link></div></header>
      <main id="main" className="container legal-center">
        <p className="eyebrow">SHIPSAFE / TRUST & TRANSPARENCY</p>
        <h1>Clarity is part<br/>of security.</h1>
        <p className="legal-center-lead">Everything you need to know about the current website, the planned service and our approach to handling security information—organized without legal-page clutter.</p>
        <div className="legal-center-meta">Five published documents <span>·</span> Reviewed 27 October 2026</div>
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
        <div className="legal-center-foot"><ShieldCheck size={18}/><p>ShipSafe is currently a public product preview. These pages describe the present implementation and will be updated before live scanning or payment collection begins.</p></div>
      </main>
      <footer className="legal-footer"><div className="container legal-footer-inner"><Link href="/" className="brand">shipsafe<span>.</span></Link><nav aria-label="Footer legal navigation">{pages.map(item => <Link href={item.href} key={item.href}>{item.title}</Link>)}</nav></div></footer>
    </div>
  );
}
