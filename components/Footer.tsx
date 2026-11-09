"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Brand from "@/components/Brand";

export default function Footer({ onOpenAssessment }: { onOpenAssessment: () => void }) {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-identity">
          <Brand href="#top" />
          <p>Source-level security checks for the apps you build with AI.</p>
          <span className="footer-independence">Evidence-backed investigations across supported source rules, configuration checks and published dependency advisories.</span>
        </div>
        <div className="footer-columns">
          <nav aria-label="Product navigation"><strong>Product</strong><a href="#how">How it works</a><a href="#security">What we check</a><a href="#product">Sample report</a><a href="#faq">FAQ</a></nav>
          <nav aria-label="Legal navigation"><strong>Company & legal</strong><Link href="/legal">Legal center</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Pricing & billing</Link><Link href="/security">Security</Link><Link href="/contact">Contact</Link></nav>
        </div>
      </div>
      <div className="container copyright">
        <span>© {new Date().getFullYear()} Secuvora — All rights reserved.</span>
        <span className="footer-preview"><span className="status-light" /> Read-only GitHub investigations · selected-repository access</span>
        <button type="button" onClick={onOpenAssessment}>Check my app — free <ArrowUpRight size={14}/></button>
      </div>
    </footer>
  );
}
