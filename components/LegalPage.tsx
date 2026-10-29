import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, FileText, LockKeyhole } from "lucide-react";
import LegalActions from "@/components/LegalActions";
import ThemeToggle from "@/components/ThemeToggle";
import Brand from "@/components/Brand";

export type LegalSection = { id: string; title: string };

type Props = {
  eyebrow: string;
  title: string;
  lead: string;
  sections: LegalSection[];
  summary: string[];
  children: ReactNode;
  updated?: string;
};

const related = [
  { href: "/legal", label: "Legal center" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refunds", label: "Pricing & billing" },
  { href: "/security", label: "Security" },
  { href: "/contact", label: "Contact" },
];

export default function LegalPage({
  eyebrow, title, lead, sections, summary, children, updated = "28 October 2026",
}: Props) {
  return (
    <div className="legal-site">
      <a href="#legal-body" className="skip-link">Skip to policy</a>
      <header className="legal-nav">
        <div className="container legal-nav-inner">
          <Brand label="Secuvora homepage" />
          <div className="legal-nav-actions"><ThemeToggle/><Link href="/" className="legal-back"><ArrowLeft size={16} aria-hidden="true"/> Back to Secuvora</Link></div>
        </div>
      </header>

      <main id="main" className="legal-main container" tabIndex={-1}>
        <nav className="legal-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
        <div className="legal-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-lead">{lead}</p>
          <div className="legal-metadata">
            <span className="legal-date"><FileText size={15} aria-hidden="true"/> Last updated {updated}</span>
            <span className="legal-stage"><CheckCircle2 size={15} aria-hidden="true"/> Current published policy</span>
          </div>
        </div>

        <div className="legal-quick" aria-label="At a glance">
          <div className="legal-quick-top"><LockKeyhole size={16} aria-hidden="true"/><strong>At a glance</strong><span>Plain-language summary</span></div>
          <ul>{summary.map(item => <li key={item}><CheckCircle2 size={17} aria-hidden="true"/><span>{item}</span></li>)}</ul>
        </div>

        <nav aria-label="Policy sections on smaller screens" className="legal-mobile-outline">
          <details>
            <summary>In this document <span>{sections.length} sections</span></summary>
            <ol>
              {sections.map((section, i) => <li key={section.id}>
                <a href={"#" + section.id}>
                  <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              </li>)}
            </ol>
          </details>
        </nav>
        <div className="legal-grid">
          <aside className="legal-aside">
            <nav aria-label="On this page" className="legal-toc">
              <strong>ON THIS PAGE</strong>
              {sections.map((section, i) => <a key={section.id} href={"#" + section.id}><span>{String(i + 1).padStart(2, "0")}</span>{section.title}</a>)}
            </nav>
            <div className="legal-aside-divider"/>
            <LegalActions />
          </aside>
          <article className="legal-content" id="legal-body">{children}</article>
        </div>

        <div className="legal-end">
          <div><span className="eyebrow">QUESTIONS OR FEEDBACK?</span><strong>Clarity should never be optional.</strong><p>See how to reach the project and how to handle sensitive reports appropriately.</p></div>
          <Link href="/contact" className="button button-dark">Contact options <ArrowUpRight size={16} aria-hidden="true"/></Link>
        </div>

        <nav className="legal-related" aria-label="Other policies">
          <span>Explore other policies</span>
          <div>{related.map(item => <Link key={item.href} href={item.href}>{item.label}<ArrowUpRight size={13} aria-hidden="true"/></Link>)}</div>
        </nav>
      </main>

      <footer className="legal-footer">
        <div className="container legal-footer-inner">
          <div><Brand /><p>Application security, explained clearly.</p></div>
          <nav aria-label="Footer legal links">{related.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
        </div>
        <div className="container legal-footer-bottom">© 2026 Secuvora · Product information, policies and security principles.</div>
      </footer>
    </div>
  );
}
