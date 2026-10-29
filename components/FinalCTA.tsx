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
          <span className="final-eyebrow"><ShieldCheck size={15}/> APPLICATION SECURITY</span>
          <h2 id="final-cta-title">See what your application<br/><em>needs attention.</em></h2>
          <p>Check supported security risks in your application's source and dependencies. Review the evidence and practical next steps in one report.</p>
          <button type="button" className="button button-dark final-button" onClick={onOpenAssessment}>Check my application <ArrowUpRight size={17}/></button>
          <small>Public repository access needs no signup · Complete reports free</small>
        </motion.div>
      </div>
    </section>
  );
}
