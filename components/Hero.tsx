"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

interface HeroProps {
  onOpenAssessment: () => void;
}

export default function Hero({ onOpenAssessment }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const previewRise = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const handleAssessmentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenAssessment();
  };

  return (
    <section className="hero" ref={heroRef}>
      <div className="glow glow-left" aria-hidden="true"></div>
      <div className="glow glow-right" aria-hidden="true"></div>
      <div className="container hero-grid">
        <div className="hero-text">
          <p className="eyebrow animate">
            <span className="eyebrow-dash"></span> AI SECURITY AGENT · BETA
          </p>
          <motion.h1 initial={{ y: 16 }} animate={{ y: 0 }} transition={{ duration: reduceMotion ? 0 : .75, delay: reduceMotion ? 0 : .12, ease: "easeOut" }}>
            Meet Secuvora.
            <br />
            <em>Your AI security agent.</em>
          </motion.h1>
          <p className="hero-sub animate delay-2">
            Your security agent for any stage of development. Today's beta investigates source code, credentials, dependencies and configurations using real rules and published advisories. Model-powered reasoning is coming next.
          </p>
          <div className="hero-action animate delay-3">
            <a
              href="/assess"
              onClick={handleAssessmentClick}
              data-start
              className="button button-dark button-primary"
            >
              Run security agent{" "}
              <span className="button-arrow" aria-hidden="true">
                →
              </span>
            </a>
            <p className="under-cta">
              <span className="tiny-check">✓</span> Read-only security review{" "}
              <span className="dot-separator">·</span> Full report included · free
            </p>
          </div>
        </div>

        <motion.div className="preview-wrap" style={reduceMotion ? undefined : { y: previewRise }}>
          <div className="preview-halo" aria-hidden="true"></div>
          <div className="preview">
            <div className="preview-top">
              <strong className="preview-brand">
                secuvora<span>.</span>
              </strong>
              <span className="example-tag">
                <span className="example-dot"></span> ILLUSTRATIVE REPORT
              </span>
            </div>
            <div className="preview-body">
              <div className="preview-heading">
                <div>
                  <div className="preview-overline">AUTOMATED SECURITY AGENT</div>
                  <h2>Agent security report</h2>
                  <p>
                    example-app <span>·</span> Illustrative results
                  </p>
                </div>
                <span className="complete-tag">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m5 12 4 4L19 6" />
                  </svg>{" "}
                  Complete
                </span>
              </div>

              <div className="severity-grid" aria-label="Sample severity counts">
                <div className="severity severity-critical">
                  <div className="severity-name">
                    <i></i>Critical
                  </div>
                  <strong>02</strong>
                </div>
                <div className="severity severity-high">
                  <div className="severity-name">
                    <i></i>High
                  </div>
                  <strong>04</strong>
                </div>
                <div className="severity severity-medium">
                  <div className="severity-name">
                    <i></i>Medium
                  </div>
                  <strong>06</strong>
                </div>
                <div className="severity severity-low">
                  <div className="severity-name">
                    <i></i>Low
                  </div>
                  <strong>01</strong>
                </div>
              </div>

              <div className="findings-head">
                <h3>Potential findings</h3>
                <span>Severity</span>
              </div>

              <div className="findings">
                <div className="finding">
                  <div className="finding-symbol symbol-red">!</div>
                  <div className="finding-copy">
                    <strong>Exposed credential</strong>
                    <small>Potential API key in application code</small>
                  </div>
                  <span className="pill pill-critical">Critical</span>
                </div>
                <div className="finding">
                  <div className="finding-symbol symbol-orange">◇</div>
                  <div className="finding-copy">
                    <strong>Vulnerable dependency</strong>
                    <small>Known package security advisory</small>
                  </div>
                  <span className="pill pill-high">High</span>
                </div>
                <div className="finding">
                  <div className="finding-symbol symbol-yellow">!</div>
                  <div className="finding-copy">
                    <strong>TLS verification override</strong>
                    <small>Insecure certificate validation</small>
                  </div>
                  <span className="pill pill-medium">Medium</span>
                </div>
              </div>

              <div className="preview-bottom">
                <span>
                  <i></i> Evidence-backed agent analysis
                </span>
                <span>Preview only</span>
              </div>
            </div>
          </div>
          <div className="floating-label" aria-hidden="true">
            <span>✓</span> Clear findings. Actionable fixes.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
