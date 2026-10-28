"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";

const faqs = [
  {
    question: "Do I need a Secuvora account?",
    answer: "No separate Secuvora signup is planned. Source access will still need explicit authorization through the connection provider.",
  },
  {
    question: "Will Secuvora modify my application?",
    answer: "No. The agent performs bounded read-only source analysis and advisory lookups. It does not modify code or apply patches; you review and make changes yourself.",
  },
  {
    question: "What exactly is free?",
    answer: "Public scans already provide full findings, evidence, impact, remediation and verification guidance without a paywall.",
  },
  {
    question: "Does the agent guarantee my code is secure?",
    answer: "No. Secuvora currently uses automated static rules and OSV advisories; it does not perform full runtime, cross-file taint analysis or LLM reasoning. Findings can be incomplete and require human verification.",
  },
  {
    question: "Can I view the full report right now?",
    answer: "Yes. Run a real public GitHub repository analysis now or explore the clearly labeled fictional sample report. Private access needs an authorized GitHub App configuration.",
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
