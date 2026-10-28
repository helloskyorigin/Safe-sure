"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Code2, FileWarning, LockKeyhole, SearchCheck } from "lucide-react";

type FindingKey = "credential" | "dependency" | "headers";
type View = "free" | "full";

const examples: Record<FindingKey, {
  label: string;
  severity: string;
  location: string;
  risk: string;
  impact: string;
  fix: string[];
  snippet: string;
}> = {
  credential: {
    label: "Potential exposed credential",
    severity: "Critical",
    location: "src/lib/service.ts · line 18",
    risk: "An API credential appears directly in application source. Validity and actual exposure require confirmation.",
    impact: "If this credential is usable and accessible to others, they may be able to make unauthorized requests or consume your service quota.",
    fix: ["Check whether this is a real credential.", "Revoke or rotate it if exposed.", "Move the replacement to server-side secret storage and review history."],
    snippet: "const apiKey = process.env.SERVICE_API_KEY;",
  },
  dependency: {
    label: "Dependency with known advisory",
    severity: "High",
    location: "package-lock.json · dependency tree",
    risk: "A dependency version may match a published security advisory. Reachability and deployment context matter.",
    impact: "Affected code paths could expose your application to the behavior described by the advisory.",
    fix: ["Confirm the affected version and advisory.", "Upgrade to a patched compatible release.", "Run application tests and reassess the lockfile."],
    snippet: "npm audit --omit=dev",
  },
  headers: {
    label: "Missing browser security header",
    severity: "Medium",
    location: "HTTP response · configuration",
    risk: "An expected browser security control was not observed in the sampled response.",
    impact: "Depending on your application, the missing control may reduce defense against certain browser-based attacks.",
    fix: ["Review the relevant response and deployment settings.", "Apply a tested policy appropriate to your app.", "Confirm the header on the live response."],
    snippet: "Content-Security-Policy: default-src 'self'",
  },
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function ReportExperience({ onOpenAssessment }: { onOpenAssessment: () => void }) {
  const [view, setView] = useState<View>("free");
  const [selected, setSelected] = useState<FindingKey>("credential");
  const reduceMotion = useReducedMotion();
  const finding = examples[selected];

  return (
    <section className="experience-section section" id="product" aria-labelledby="experience-title">
      <div className="container">
        <div className="experience-intro">
          <motion.div initial={{ y: 22 }} whileInView={{ y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: reduceMotion ? 0 : .72, ease }}>
            <p className="eyebrow">THE REPORT EXPERIENCE</p>
            <h2 id="experience-title">Less guesswork.<br/><span>More clarity.</span></h2>
          </motion.div>
          <p>No mystery score. A clear assessment first, then technical context and practical next steps in one focused report.</p>
        </div>
        <motion.div className="experience-shell" initial={{ y: 26 }} whileInView={{ y: 0 }} viewport={{ once: true, amount: 0.13 }} transition={{ duration: reduceMotion ? 0 : .8, ease }}>
          <div className="experience-toolbar">
            <div className="experience-app"><span className="app-symbol"><SearchCheck size={17}/></span><div><strong>ShipSafe report</strong><small>example-application / illustrative demo</small></div></div>
            <span className="experience-example">INTERACTIVE EXAMPLE · NOT A REAL SCAN</span>
          </div>
          <div className="experience-tabs" role="tablist" aria-label="Explore report views">
            <button type="button" role="tab" aria-selected={view === "free"} aria-controls="demo-panel" className={view === "free" ? "is-active" : ""} onClick={() => setView("free")}>Overview</button>
            <button type="button" role="tab" aria-selected={view === "full"} aria-controls="demo-panel" className={view === "full" ? "is-active" : ""} onClick={() => setView("full")}>Full report <span>FREE</span></button>
          </div>
          <div id="demo-panel" role="tabpanel" className="experience-content">
            <AnimatePresence mode="wait" initial={false}>
              {view === "free" ? (
                <motion.div key="free" initial={reduceMotion ? false : { opacity: .5, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: .4, y: -8 }} transition={{ duration: reduceMotion ? 0 : .28 }}>
                  <div className="demo-head"><div><p className="demo-kicker">ASSESSMENT OVERVIEW</p><h3>Understand your risk surface.</h3><p>Findings grouped by severity. The figures below are examples.</p></div><span className="demo-status"><Check size={13}/> Sample complete</span></div>
                  <div className="demo-severity">
                    {[["02", "Critical", "red"], ["04", "High", "orange"], ["06", "Medium", "amber"], ["01", "Low", "gray"]].map(([count, label, tone]) => (
                      <div className="demo-severity-item" key={label}><span className={"demo-dot "+tone}></span><strong>{count}</strong><span>{label}</span></div>
                    ))}
                  </div>
                  <div className="free-preview"><div className="free-preview-icon"><LockKeyhole size={20}/></div><div><strong>All details are included.</strong><p>Locations, supporting evidence, potential impact and suggested fixes are included in the full free report.</p></div><button type="button" onClick={() => setView("full")} className="demo-inline-action">Preview details <ArrowRight size={15}/></button></div>
                </motion.div>
              ) : (
                <motion.div key="full" initial={reduceMotion ? false : { opacity: .5, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: .4, y: -8 }} transition={{ duration: reduceMotion ? 0 : .28 }}>
                  <div className="demo-head"><div><p className="demo-kicker">EXAMPLE DETAILED REPORT</p><h3>Know what to fix—and why.</h3><p>Select an example finding to see how an actionable report is structured.</p></div><span className="demo-status"><Code2 size={13}/> Developer context</span></div>
                  <div className="detail-grid">
                    <div className="detail-list" aria-label="Illustrative findings">
                      {(Object.keys(examples) as FindingKey[]).map(key => (
                        <button type="button" key={key} aria-pressed={selected === key} onClick={() => setSelected(key)} className={"detail-item "+(selected === key ? "selected" : "")}>
                          <span className={"detail-alert "+(key === "credential" ? "red" : key === "dependency" ? "orange" : "amber")}><FileWarning size={15}/></span>
                          <span>{examples[key].label}<small>{examples[key].severity}</small></span><ArrowRight size={15}/>
                        </button>
                      ))}
                    </div>
                    <div className="detail-body" aria-live="polite">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={selected} initial={reduceMotion ? false : { opacity: .6, x: 7 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: .4, x: -6 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
                          <div className="detail-meta">{finding.severity} · {finding.location}</div>
                          <h4>{finding.label}</h4>
                          <p>{finding.risk}</p>
                          <h5>If ignored</h5><p>{finding.impact}</p>
                          <h5>Suggested next steps</h5>
                          <ol>{finding.fix.map(step => <li key={step}>{step}</li>)}</ol>
                          <div className="code-example"><span>ILLUSTRATIVE CONFIGURATION</span><code>{finding.snippet}</code></div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="experience-bottom"><span>Explore complete example findings and fixes. No locked sections.</span><button type="button" className="experience-action" onClick={onOpenAssessment}>Assess your application <ArrowRight size={16}/></button></div>
        </motion.div>
      </div>
    </section>
  );
}
