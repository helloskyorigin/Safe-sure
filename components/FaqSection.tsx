"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";

const faqs = [
  {
    question: "Do I need a ShipSafe account?",
    answer: "No separate ShipSafe signup is planned. Source access will still need explicit authorization through the connection provider.",
  },
  {
    question: "Will ShipSafe modify my application?",
    answer: "The intended assessment is read-only. You review and apply any suggested changes yourself. Live scanning is not connected to this preview yet.",
  },
  {
    question: "What exactly is free?",
    answer: "When scanning launches, the full report is planned to be available without payment: severity counts, affected files, evidence, impact, remediation and verification steps.",
  },
  {
    question: "Does a clean report guarantee safety?",
    answer: "No. Automated analysis is limited by its rules, available data and context. Findings can be incomplete or require verification.",
  },
  {
    question: "Can I view the full report right now?",
    answer: "You can explore the complete fictional example report now. Actual results will become available only after the real scanner and verified access are connected.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="section bordered faq-section">
      <div className="container faq-grid">
        <div className=""><p className="eyebrow">GOOD TO KNOW</p><h2>Straight answers.<br/>No fine print.</h2><p className="faq-intro">Details that help you decide, without a maze of fine print.</p></div>
        <div className="faq-list ">
          {faqs.map((faq, index) => (
            <div className={"faq-entry " + (open === index ? "expanded" : "")} key={faq.question}>
              <h3>
                <button className="faq-trigger" type="button" onClick={() => setOpen(open === index ? null : index)}
                  aria-expanded={open === index} aria-controls={"faq-answer-" + index}>
                  <span>{faq.question}</span><motion.span className="faq-plus" aria-hidden="true" animate={{ rotate: open === index ? 45 : 0 }} transition={{ duration: reduceMotion ? 0 : .25 }}><Plus size={20}/></motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {open === index && (
                  <motion.div key="content" id={"faq-answer-" + index} initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }} exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : .34, ease: "easeInOut" }} style={{ overflow: "hidden" }}>
                    <p className="faq-answer">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
