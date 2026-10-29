"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, FileCode2, Fingerprint, GitBranch, ShieldCheck } from "lucide-react";

interface HeroProps {
  onOpenAssessment: () => void;
}

const specimenFindings = [
  { severity: "HIGH", code: "SRC-104", title: "Potential credential in client source", location: "src/config/client.ts:18", tone: "high" },
  { severity: "HIGH", code: "DEP-208", title: "Published dependency advisory", location: "package-lock.json", tone: "high" },
  { severity: "MEDIUM", code: "CFG-031", title: "TLS validation override", location: "lib/transport.ts:42", tone: "medium" },
] as const;

export default function Hero({ onOpenAssessment }: HeroProps) {
  return (
    <section className="hero sec-hero" aria-labelledby="sec-hero-heading">
      <div className="sec-hero-grid" aria-hidden="true"/>
      <div className="container sec-hero-inner">
        <div className="hero-text sec-hero-copy">
          <p className="eyebrow sec-eyebrow"><span className="sec-eyebrow-mark"/> SECUVORA / SECURITY INVESTIGATIONS</p>
          <h1 id="sec-hero-heading">Security risks don&apos;t exist <em>in isolation.</em></h1>
          <p className="hero-sub sec-hero-sub">
            Investigate potential exposure, inspect the evidence and prioritize what matters.
            Start with read-only source and dependency analysis.
          </p>
          <div className="hero-action sec-hero-actions">
            <div className="hero-cta-row">
              <Link href="/assess" onClick={(e) => { e.preventDefault(); onOpenAssessment(); }}
                className="sec-primary-cta" data-start>
                Start an investigation <ArrowUpRight size={17} aria-hidden="true"/>
              </Link>
              <Link href="/assess/results" className="sec-secondary-cta">
                Explore a sample report <ArrowRight size={16} aria-hidden="true"/>
              </Link>
            </div>
            <p className="under-cta sec-hero-proof">
              <ShieldCheck size={15} aria-hidden="true"/> Read-only today
              <span aria-hidden="true">·</span> Evidence, not a security score
              <span aria-hidden="true">·</span> Free public-source review
            </p>
          </div>
        </div>

        <div className="sec-console-wrap" aria-label="Illustrative security investigation report preview">
          <div className="sec-console">
            <div className="sec-console-bar">
              <div className="sec-console-identity"><span className="sec-console-symbol"><Fingerprint size={17}/></span>
                <span>SECUVORA <span className="sec-console-slash">/</span> INVESTIGATIONS</span></div>
              <span className="sec-specimen-tag">ILLUSTRATIVE SAMPLE</span>
            </div>
            <div className="sec-console-heading">
              <div className="sec-console-kicker">CASE / SAMPLE-001 <span aria-hidden="true">·</span> STATIC REVIEW</div>
              <h2>Investigation overview</h2>
              <div className="sec-console-subline"><GitBranch size={14} aria-hidden="true"/> demo/source-example <span aria-hidden="true">·</span> Fictional repository</div>
            </div>
            <div className="sec-case-summary">
              <div><small>REVIEW STATE</small><strong><Check size={14}/> Example complete</strong></div>
              <div><small>CANDIDATE SIGNALS</small><strong>03 <span>illustrative</span></strong></div>
              <div><small>METHOD</small><strong>Read-only source</strong></div>
            </div>
            <div className="sec-console-sectionline">
              <span>FINDINGS / EXAMPLE</span><span>SEVERITY</span>
            </div>
            <div className="sec-console-list">
              {specimenFindings.map((f) => (
                <div className="sec-console-finding" key={f.code}>
                  <div className="sec-finding-symbol"><FileCode2 size={16}/></div>
                  <div className="sec-finding-text"><span>{f.code} <span aria-hidden="true">/</span> {f.location}</span><strong>{f.title}</strong></div>
                  <span className={"sec-finding-level " + f.tone}>{f.severity}</span>
                </div>
              ))}
            </div>
            <div className="sec-console-detail">
              <div className="sec-console-sectionline"><span>EVIDENCE / EXAMPLE</span><span>REDACTED</span></div>
              <code><span className="sec-code-no">18</span><span className="sec-code-kw">const</span> serviceToken = <span className="sec-code-value">&quot;[REDACTED]&quot;</span>;</code>
              <p>Investigate origin and exposure. Validate before acting.</p>
            </div>
            <div className="sec-console-bottom">
              <span><span className="sec-console-green"/> Fictional walkthrough — not a completed scan</span>
              <Link href="/assess/results">View sample <ChevronRight size={14}/></Link>
            </div>
          </div>
          <div className="sec-console-footnote">An example of the investigation interface. No real application was assessed.</div>
        </div>
      </div>
    </section>
  );
}
