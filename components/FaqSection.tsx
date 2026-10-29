"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";

const faqs = [
  {
    question: "What GitHub access does Secuvora request?",
    answer: "Secuvora uses a GitHub App with read-only repository access. You choose which repositories the App can access, and the product does not request permission to push changes.",
  },
  {
    question: "Why is one of my repositories missing?",
    answer: "The selector can only show repositories granted to the Secuvora GitHub App. Open Manage repository access on the source screen, add the missing repository in GitHub, then return and refresh.",
  },
  {
    question: "Will the security agent change my code?",
    answer: "No. The current agent performs bounded read-only source analysis and advisory lookups. It does not modify code, open pull requests or apply patches.",
  },
  {
    question: "Is the agent powered by AI models yet?",
    answer: "Not yet. Secuvora currently uses deterministic security checks and OSV vulnerability intelligence to produce evidence-backed findings. Model-powered reasoning is planned; no report is presented as AI-verified.",
  },
  {
    question: "Does the agent guarantee my code is secure?",
    answer: "No. Automated static rules and dependency advisories can miss issues or require human verification. A completed investigation is evidence for review, not a security certification.",
  },
  {
    question: "How are connected reports handled?",
    answer: "GitHub-connected reports are stored in account-scoped encrypted storage with a limited retention period and can be deleted from Agent history. Source code is read for analysis and is not intentionally kept as a source archive.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="section bordered faq-section">
      <div className="container faq-grid">
        <div><p className="eyebrow">GOOD TO KNOW</p><h2>Straight answers.<br/>No fine print.</h2><p className="faq-intro">The important details before you connect a repository.</p></div>
        <div className="faq-list">
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
