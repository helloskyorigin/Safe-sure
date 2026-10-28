"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2,
  ChevronDown, ChevronRight, Code2, FileSearch, Github, GitBranch,
  Info, KeyRound, Layers3, LockKeyhole, ScanSearch, ShieldCheck, X,
} from "lucide-react";

const easer = [0.22, 1, 0.36, 1] as const;

const stages = [
  { number: "01", title: "Connect application", description: "Authorize a selected application on GitHub.", icon: Github },
  { number: "02", title: "Run assessment", description: "Analyze available code, dependencies and security signals.", icon: ScanSearch },
  { number: "03", title: "Understand results", description: "See severity, evidence and fixes together—with no paywall.", icon: FileSearch },
] as const;

const checks = [
  { icon: KeyRound, title: "Potential exposed secrets", description: "Look for patterns that suggest credentials were placed in source code." },
  { icon: Layers3, title: "Vulnerable dependencies", description: "Compare supported package versions against published advisories." },
  { icon: Code2, title: "Application security patterns", description: "Review supported source and configuration patterns for security concerns." },
] as const;

export default function AssessmentStart() {
  const reducedMotion = useReducedMotion();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  const entrance = (delay: number) => ({
    initial: { opacity: 1, y: reducedMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducedMotion ? 0 : .75, delay: reducedMotion ? 0 : delay, ease: easer },
  });

  return (
    <div className="assess-page">
      <a href="#assess-main" className="skip-link">Skip to assessment</a>
      <header className="assess-header">
        <div className="assess-container assess-header-inner">
          <Link href="/" className="brand" aria-label="ShipSafe home">shipsafe<span>.</span></Link>
          <span className="assess-header-center"><span className="assess-header-dot" /> APPLICATION SECURITY</span>
          <Link href="/" className="assess-back"><ArrowLeft size={15} /> <span>Back to website</span></Link>
        </div>
      </header>

      <main id="assess-main">
        <div className="assess-container">
          <div className="assess-progress" aria-label="Assessment progress">
            {stages.map((step, index) => (
              <div key={step.number} className={"assess-progress-step " + (index === 0 ? "current" : "future")}
                aria-current={index === 0 ? "step" : undefined}>
                <span className="assess-progress-circle">{step.number}</span>
                <span className="assess-progress-label">{step.title}</span>
                {index < stages.length - 1 && <span className="assess-progress-connector" aria-hidden="true" />}
              </div>
            ))}
          </div>

          <div className="assess-hero-grid">
            <div className="assess-left">
              <motion.div {...entrance(.03)}>
                <p className="assess-eyebrow"><span /> STEP 01 OF 03 · CONNECTION</p>
                <h1>Better security<br />starts with <em>clarity.</em></h1>
                <p className="assess-lead">Choose the application you&apos;re preparing to ship. ShipSafe is designed to explain potential security risks before they become bigger problems.</p>
              </motion.div>

              <motion.section aria-labelledby="assess-card-title" className="assess-connect-card" {...entrance(.14)}>
                <div className="assess-card-top">
                  <div className="assess-github-icon"><Github size={26} strokeWidth={1.8}/></div>
                  <span className="assess-pill"><span /> INTEGRATION PENDING</span>
                </div>
                <h2 id="assess-card-title">Connect your application</h2>
                <p className="assess-card-description">GitHub will let you choose which repositories the ShipSafe GitHub App can access. Only authorized applications should be assessed.</p>
                <button className="assess-primary" type="button" onClick={() => setDialogOpen(true)}>
                  <Github size={20} aria-hidden="true"/>
                  <span>Connect with GitHub</span>
                  <ArrowRight size={18} aria-hidden="true"/>
                </button>
                <p className="assess-availability"><Info size={14}/> GitHub connection is not enabled yet. This button explains the current status.</p>
                <div className="assess-card-divider"/>
                <div className="assess-assurances" aria-label="Connection principles">
                  <span><ShieldCheck size={16}/> Read-only by design</span>
                  <span><LockKeyhole size={16}/> Select access</span>
                  <span><CheckCircle2 size={16}/> No ShipSafe signup</span>
                </div>
                <button type="button" className="assess-permissions-trigger" aria-expanded={detailsOpen} aria-controls="assess-permissions"
                  onClick={() => setDetailsOpen(value => !value)}>
                  What access will ShipSafe request?
                  <motion.span animate={{ rotate: detailsOpen ? 180 : 0 }} transition={{ duration: reducedMotion ? 0 : .24 }}><ChevronDown size={17}/></motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {detailsOpen && (
                    <motion.div id="assess-permissions" className="assess-permissions" key="permissions"
                      initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : .32 }}
                      style={{ overflow: "hidden" }}>
                      <div className="assess-permissions-inner">
                        <div><Check size={15}/><p><strong>Repository contents: read</strong><span>Inspect the selected application&apos;s supported code and configuration.</span></p></div>
                        <div><Check size={15}/><p><strong>Metadata: read</strong><span>GitHub automatically provides basic repository metadata to GitHub Apps.</span></p></div>
                        <div><Check size={15}/><p><strong>No write access requested</strong><span>ShipSafe will not edit files, create commits or change your settings.</span></p></div>
                        <p className="assess-permissions-note">These are proposed GitHub App permissions. The actual installation page will provide the authoritative permission list when integration launches.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              <div className="assess-scan-preview">
                <span className="assess-scan-preview-icon"><ScanSearch size={19}/></span>
                <div><strong>Explore the inspection console</strong><p>See how scan stages and evidence will be displayed. No scan starts in preview mode.</p></div>
                <Link href="/assess/scanning" aria-label="Preview scanning workspace"><ArrowRight size={18}/></Link>
              </div>

              <motion.div className="assess-microtrust" {...entrance(.24)}>
                <div className="assess-microtrust-icon"><ShieldCheck size={19}/></div>
                <p><strong>You're always in control.</strong><br/>GitHub authorization, when enabled, will happen on GitHub—not on a password form built by ShipSafe.</p>
              </motion.div>
            </div>

            <motion.aside className="assess-right" aria-label="Assessment journey illustration" {...entrance(.22)}>
              <div className="assess-journey-card">
                <div className="assess-journey-head"><span>HOW YOUR ASSESSMENT FLOWS</span><span className="assess-preview-tag">DESIGN PREVIEW</span></div>
                <div className="assess-journey-stage">
                  <span className="assess-stage-icon"><Github size={19}/></span>
                  <div><strong>Your application</strong><p>Selected by you</p></div>
                  <span className="assess-stage-status">NOT CONNECTED</span>
                </div>
                <div className="assess-journey-path" aria-hidden="true"><span/><span/><span/></div>
                <div className="assess-journey-stage">
                  <span className="assess-stage-icon assess-stage-muted"><ScanSearch size={19}/></span>
                  <div><strong>Security assessment</strong><p>Evidence-backed checks</p></div>
                  <span className="assess-stage-number">02</span>
                </div>
                <div className="assess-journey-path" aria-hidden="true"><span/><span/><span/></div>
                <div className="assess-journey-stage">
                  <span className="assess-stage-icon assess-stage-muted"><FileSearch size={19}/></span>
                  <div><strong>Clear findings</strong><p>Full findings · Free access</p></div>
                  <span className="assess-stage-number">03</span>
                </div>
                <div className="assess-journey-note"><Info size={14}/><span>No assessment is running. This visual only explains the intended workflow.</span></div>
              </div>
              <div className="assess-clarity-panel">
                <span className="assess-clarity-icon"><GitBranch size={19}/></span>
                <div><strong>Security that makes sense.</strong><p>Potential findings, why they matter, and practical next steps—not another complicated dashboard.</p></div>
              </div>
            </motion.aside>
          </div>
        </div>

        <section className="assess-below" aria-labelledby="assess-checks-title">
          <div className="assess-container">
            <div className="assess-below-heading">
              <div><span className="assess-small-label">A CLEARER WAY FORWARD</span><h2 id="assess-checks-title">What comes after<br/>connection?</h2></div>
              <button type="button" className="assess-flow-toggle" onClick={() => setDemoOpen(value => !value)} aria-expanded={demoOpen} aria-controls="assess-flow-details">
                {demoOpen ? "Hide walkthrough" : "Explore the flow"} <ArrowUpRight size={16}/>
              </button>
            </div>
            <div className="assess-steps-grid">
              {stages.map((step, i) => (
                <motion.article key={step.number} className="assess-step-card"
                  initial={{ opacity: 1, y: reducedMotion ? 0 : 18 }}
                  whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: reducedMotion ? 0 : i * .09, duration: reducedMotion ? 0 : .6, ease: easer }}>
                  <div className="assess-step-top"><span className="assess-step-icon"><step.icon size={23}/></span><span>{step.number} / 03</span></div>
                  <h3>{step.title}</h3><p>{step.description}</p>
                  <div className="assess-step-line" aria-hidden="true"/>
                </motion.article>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {demoOpen && <motion.div className="assess-flow-details" id="assess-flow-details" key="flow"
                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: reducedMotion ? 0 : .36 }}
                style={{ overflow: "hidden" }}>
                <div className="assess-flow-inner"><span className="assess-flow-symbol"><Info size={18}/></span>
                  <div><strong>Preview of the planned assessment flow</strong><p>After authorization, the application selector will show only the repositories made available through the GitHub App. A real scan will then report what was checked, errors or unsupported checks, and severity counts based on actual findings. Full reports will be available without a payment gate. None of these backend steps is simulated as completed on this screen.</p></div>
                </div>
              </motion.div>}
            </AnimatePresence>
          </div>
        </section>

        <section className="assess-checks-section" aria-labelledby="assess-security-checks">
          <div className="assess-container">
            <div className="assess-checks-heading"><p className="assess-small-label">BUILT FOR MEANINGFUL SIGNALS</p><h2 id="assess-security-checks">What will ShipSafe look for?</h2><p>Initial coverage will be defined by the real analysis engines and their supported ecosystems. No claim of complete vulnerability coverage.</p></div>
            <div className="assess-checks-grid">
              {checks.map(item => <article key={item.title} className="assess-check"><span><item.icon size={20}/></span><h3>{item.title}</h3><p>{item.description}</p></article>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="assess-footer">
        <div className="assess-container assess-footer-inner">
          <div><Link href="/" className="brand">shipsafe<span>.</span></Link><p>Know the risks before you ship.</p></div>
          <nav aria-label="Assessment footer"><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></nav>
        </div>
        <div className="assess-container assess-footnote">© 2026 ShipSafe · Pre-launch assessment experience</div>
      </footer>

      <dialog ref={dialogRef} className="assess-modal" aria-labelledby="assess-modal-title" aria-describedby="assess-modal-description"
        onClose={() => setDialogOpen(false)}
        onClick={event => { if (event.target === dialogRef.current) setDialogOpen(false); }}>
        <div className="assess-modal-inner">
          <button type="button" className="assess-modal-close" onClick={() => setDialogOpen(false)} aria-label="Close dialog"><X size={18}/></button>
          <span className="assess-modal-symbol"><Github size={24}/></span>
          <p className="assess-small-label">CONNECTION STATUS</p>
          <h2 id="assess-modal-title">GitHub connection is coming soon.</h2>
          <p id="assess-modal-description">The assessment interface is ready to explore, but the ShipSafe GitHub App and scanning backend have not been connected yet. No GitHub authorization was initiated and no application data was accessed.</p>
          <div className="assess-modal-list">
            <span><CheckCircle2 size={16}/> Selected repositories, not blanket access</span>
            <span><CheckCircle2 size={16}/> Read-only application analysis</span>
            <span><CheckCircle2 size={16}/> Full evidence and fixes included for free</span>
          </div>
          <button type="button" className="assess-primary" onClick={() => setDialogOpen(false)}>Understood <ArrowRight size={18}/></button>
          <Link href="/security" className="assess-modal-link" onClick={() => setDialogOpen(false)}>Read our security approach <ChevronRight size={15}/></Link>
        </div>
      </dialog>
    </div>
  );
}
