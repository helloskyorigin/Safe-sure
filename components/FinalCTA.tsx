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
          <span className="final-eyebrow"><ShieldCheck size={15}/> SECURITY, WITHOUT THE GUESSWORK</span>
          <h2 id="final-cta-title">Ship with more<br/><em>confidence.</em></h2>
          <p>From the initial overview to evidence, file locations and practical fix steps—full report details included.</p>
          <button type="button" className="button button-dark final-button" onClick={onOpenAssessment}>Assess your application <ArrowUpRight size={17}/></button>
          <small>No separate ShipSafe signup planned · No report paywall</small>
        </motion.div>
      </div>
    </section>
  );
}
