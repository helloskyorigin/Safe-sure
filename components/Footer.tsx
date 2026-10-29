"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Footer({ onOpenAssessment }: { onOpenAssessment: () => void }) {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-identity">
          <a href="#top" className="brand" aria-label="Secuvora home">secuvora<span>.</span></a>
          <p>Evidence and next steps for your application's security.</p>
          <span className="footer-independence">Evidence-backed investigations across supported source rules, configuration checks and published dependency advisories.</span>
        </div>
        <div className="footer-columns">
          <nav aria-label="Product navigation"><strong>Product</strong><a href="#product">The report</a><a href="#how">How it works</a><a href="#pricing">Full report</a><a href="#faq">Questions</a></nav>
          <nav aria-label="Legal navigation"><strong>Company & legal</strong><Link href="/legal">Legal center</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Pricing & billing</Link><Link href="/security">Security</Link><Link href="/contact">Contact</Link></nav>
        </div>
      </div>
      <div className="container copyright">
        <span>© {new Date().getFullYear()} Secuvora. All rights reserved.</span>
        <span className="footer-preview"><span className="status-light" /> Public source scanning available · private access requires configuration</span>
        <button type="button" onClick={onOpenAssessment}>Start investigation <ArrowUpRight size={14}/></button>
      </div>
    </footer>
  );
}
