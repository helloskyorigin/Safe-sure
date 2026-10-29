"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export default function FinalCTA({ onOpenAssessment }: { onOpenAssessment: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <section className="final-cta-section" aria-labelledby="final-cta-title">
      <div className="container">
        <motion.div className="final-cta-inner" initial={{ y: 26 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : .8 }}>
          <div className="cta-orbit" aria-hidden="true"><span/><span/></div>
          <span className="final-eyebrow"><ShieldCheck size={15}/> SECURITY INVESTIGATIONS</span>
          <h2 id="final-cta-title">Turn a security signal<br/><em>into a clear next step.</em></h2>
          <p>Start a bounded, read-only source investigation. Review potential risks, supporting evidence and suggested remediation in a single workspace.</p>
          <button type="button" className="button button-dark final-button" onClick={onOpenAssessment}>Start an investigation <ArrowUpRight size={17}/></button>
          <small>Public-source investigations are available now · No account required</small>
        </motion.div>
      </div>
    </section>
  );
}
