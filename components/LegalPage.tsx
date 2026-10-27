import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export default function LegalPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <div className="legal-site">
      <header className="legal-nav">
        <div className="container legal-nav-inner">
          <Link href="/" className="brand" aria-label="ShipSafe home">shipsafe<span>.</span></Link>
          <Link href="/" className="legal-back"><ArrowLeft size={16}/> Back to homepage</Link>
        </div>
      </header>
      <main id="main" className="legal-main container">
        <div className="legal-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-lead">{lead}</p>
          <div className="legal-metadata"><span>Updated October 27, 2026</span><span className="legal-stage"><ShieldCheck size={14}/> Pre-launch information</span></div>
        </div>
        <div className="legal-grid">
          <aside className="legal-aside">
            <strong>About these pages</strong>
            <p>ShipSafe is currently a product preview. Policies will be reviewed and updated before payments or source-code access are enabled.</p>
            <Link href="/contact">Contact and feedback <ArrowUpRight size={14}/></Link>
          </aside>
          <article className="legal-content">{children}</article>
        </div>
        <div className="legal-end"><strong>Questions about these terms?</strong><p>Read our contact options or return to ShipSafe.</p><Link href="/contact" className="button button-dark">Contact options <ArrowUpRight size={16}/></Link></div>
      </main>
      <footer className="legal-footer">
        <div className="container legal-footer-inner">
          <Link className="brand" href="/">shipsafe<span>.</span></Link>
          <nav aria-label="Legal pages"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Refunds</Link><Link href="/security">Security</Link><Link href="/contact">Contact</Link></nav>
        </div>
      </footer>
    </div>
  );
}
