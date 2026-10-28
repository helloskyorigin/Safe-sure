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
          <span className="final-eyebrow"><ShieldCheck size={15}/> YOUR ON-DEMAND SECURITY AGENT</span>
          <h2 id="final-cta-title">Understand your code.<br/><em>Whenever you want.</em></h2>
          <p>Start an agent investigation on a GitHub repository. See actual findings, redacted evidence, affected code and practical fixes.</p>
          <button type="button" className="button button-dark final-button" onClick={onOpenAssessment}>Run security agent <ArrowUpRight size={17}/></button>
          <small>No separate Secuvora signup planned · No report paywall</small>
        </motion.div>
      </div>
    </section>
  );
}
