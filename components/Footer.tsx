"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Footer({ onOpenAssessment }: { onOpenAssessment: () => void }) {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-identity">
          <a href="#top" className="brand" aria-label="ShipSafe home">shipsafe<span>.</span></a>
          <p>Know the risks before you ship.</p>
          <span className="footer-independence">Security assessments for independent builders.</span>
        </div>
        <div className="footer-columns">
          <nav aria-label="Product navigation"><strong>Product</strong><a href="#product">The report</a><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#faq">Questions</a></nav>
          <nav aria-label="Legal navigation"><strong>Company & legal</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refunds">Payments & refunds</Link><Link href="/security">Security</Link><Link href="/contact">Contact</Link></nav>
        </div>
      </div>
      <div className="container copyright">
        <span>© {new Date().getFullYear()} ShipSafe. All rights reserved.</span>
        <span className="footer-preview"><span className="status-light" /> Product preview · assessments coming soon</span>
        <button type="button" onClick={onOpenAssessment}>Explore ShipSafe <ArrowUpRight size={14}/></button>
      </div>
    </footer>
  );
}
