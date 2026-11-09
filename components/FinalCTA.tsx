"use client";

import { ArrowUpRight, ShieldCheck } from "lucide-react";

export default function FinalCTA({ onOpenAssessment }: { onOpenAssessment: () => void }) {
  return (
    <section className="final-cta-section" aria-labelledby="final-cta-title">
      <div className="container">
        <div className="final-cta-inner">
          <div className="cta-orbit" aria-hidden="true"><span/><span/></div>
          <span className="final-eyebrow"><ShieldCheck size={15}/> APPLICATION SECURITY</span>
          <h2 id="final-cta-title">Before you launch.<br/><em>Check the code.</em></h2>
          <p>Find supported source-level risks, review the evidence and prioritize fixes before sharing your AI-built app.</p>
          <button type="button" className="button button-dark final-button" onClick={onOpenAssessment}>Check my app — free <ArrowUpRight size={17}/></button>
          <small>Free beta · Read-only GitHub access · No payment details required</small>
        </div>
      </div>
    </section>
  );
}
