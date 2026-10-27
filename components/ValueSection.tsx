"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Braces, ListChecks, ScanEye } from "lucide-react";

const cards = [
  { icon: ScanEye, count: "01", title: "See the signal.", text: "Focus on findings with explainable severity instead of a vague single security score.", word: "Detect" },
  { icon: Braces, count: "02", title: "Get the context.", text: "Understand which file or configuration is implicated and what supporting evidence means.", word: "Understand" },
  { icon: ListChecks, count: "03", title: "Make the fix.", text: "Follow a practical remediation checklist and verify the result in your own application.", word: "Resolve" },
];

export default function ValueSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="value-section section" aria-labelledby="value-heading">
      <div className="container">
        <motion.div className="value-heading" initial={{ y: 24 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : .7 }}>
          <div><p className="eyebrow">MADE FOR BUILDERS</p><h2 id="value-heading">A security report<br/>you can act on.</h2></div>
          <p>ShipSafe is designed to turn technical findings into a clear next decision. No bloated dashboard required.</p>
        </motion.div>
        <div className="value-grid">
          {cards.map((card, i) => (
            <motion.article key={card.count} className="value-card"
              initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={{ once: true, amount: .2 }}
              transition={{ duration: reduceMotion ? 0 : .68, delay: reduceMotion ? 0 : i * .12 }}>
              <div className="value-card-top"><span className="value-icon"><card.icon size={22}/></span><span className="value-count">{card.count} / 03</span></div>
              <span className="value-watermark" aria-hidden="true">{card.word}</span>
              <div className="value-card-content"><h3>{card.title}</h3><p>{card.text}</p><ArrowUpRight size={18} aria-hidden="true"/></div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
