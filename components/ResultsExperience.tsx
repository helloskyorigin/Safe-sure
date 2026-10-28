"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertCircle, ArrowLeft, ArrowRight, ArrowUpRight, BookOpenCheck, Check,
  CheckCircle2, ChevronDown, CircleDashed, ClipboardCheck, ClipboardCopy,
  Code2, Download, FileCode2, FileSearch, Filter, Fingerprint, Github,
  GitBranch, Info, LockKeyhole, Printer, RefreshCw, Search, ShieldAlert, ShieldCheck,
  ShieldQuestion, Sparkles, Terminal, X,
} from "lucide-react";
import {
  SAMPLE_REPORT, isAssessmentReport, severityCounts,
  type AssessmentReport, type ReportFinding, type Severity,
} from "@/lib/report-contract";

type State =
  | { kind: "sample" }
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "unavailable" }
  | { kind: "error" }
  | { kind: "live"; report: AssessmentReport };

type Filter = "all" | Severity;
const levels: Filter[] = ["all", "critical", "high", "medium", "low"];
const levelNames: Record<Filter, string> = { all: "All findings", critical: "Critical", high: "High", medium: "Medium", low: "Low" };

const labelIcon = { critical: ShieldAlert, high: AlertCircle, medium: ShieldQuestion, low: Info } as const;

function CopyFeedback({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { setCopied(false); }
  }
  return <button className="result-copy" type="button" onClick={() => void copy()} aria-label={label}>
    {copied ? <Check size={15}/> : <ClipboardCopy size={15}/>} {copied ? "Copied" : "Copy"}
  </button>;
}

export default function ResultsExperience() {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<State>({ kind: "sample" });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("EX-001");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [showExportMessage, setShowExportMessage] = useState(false);

  useEffect(() => {
    const runId = new URLSearchParams(window.location.search).get("run");
    if (!runId) { setState({ kind: "sample" }); return; }
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(runId)) {
      setState({ kind: "invalid" }); return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setState({ kind: "loading" });

    async function fetchReport() {
      try {
        const response = await fetch("/api/assessments/" + encodeURIComponent(runId!) + "/report", {
          method: "GET", credentials: "same-origin", cache: "no-store",
          headers: { Accept: "application/json" }, signal: controller.signal,
        });
        if (cancelled) return;
        if (response.status === 503 || response.status === 501) {
          setState({ kind: "unavailable" }); return;
        }
        if (!response.ok) { setState({ kind: "error" }); return; }
        const data: unknown = await response.json();
        if (!isAssessmentReport(data, runId!)) {
          setState({ kind: "error" }); return;
        }
        setSelectedId(data.findings[0]?.id || "");
        setState({ kind: "live", report: data });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    }
    void fetchReport();
    return () => { cancelled = true; controller.abort(); };
  }, []);

  const isSample = state.kind === "sample";
  const report = isSample ? SAMPLE_REPORT : state.kind === "live" ? state.report : null;
  const counts = useMemo(() => report ? severityCounts(report.findings) : null, [report]);
  const findings = useMemo(() => {
    if (!report) return [];
    const query = search.trim().toLowerCase();
    return report.findings.filter(finding =>
      (filter === "all" || finding.severity === filter) &&
      (!query || [finding.title, finding.id, finding.category, finding.location.path, finding.overview]
        .some(value => value.toLowerCase().includes(query)))
    );
  }, [filter, search, report]);
  const active = findings.find(f => f.id === selectedId) || findings[0] || null;
  const verifiedCoverage = report?.coverage.filter(c => c.status === "complete").length ?? 0;
  const incompleteCoverage = report?.coverage.filter(c => c.status !== "complete").length ?? 0;
  const markedCount = active?.steps.filter((_, i) => checked[active.id + "-" + i]).length ?? 0;

  function exportSample() {
    if (!isSample) return;
    const payload = { ...SAMPLE_REPORT, sample: true, notice: "ILLUSTRATIVE EXAMPLE — not the result of a security assessment." };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "shipsafe-sample-full-report.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setShowExportMessage(true);
    window.setTimeout(() => setShowExportMessage(false), 2200);
  }

  const reveal = reduceMotion ? undefined : { initial: { y: 13, opacity: .85 }, animate: { y: 0, opacity: 1 }, transition: { duration: .62 } };

  return (
    <div className="result-page">
      <a className="skip-link" href="#report-main">Skip to report</a>
      <header className="result-nav">
        <div className="result-container result-nav-inner">
          <Link href="/" className="brand" aria-label="ShipSafe homepage">shipsafe<span>.</span></Link>
          <span className="result-nav-label"><span/> SECURITY INTELLIGENCE</span>
          <Link href="/assess/scanning" className="result-nav-back"><ArrowLeft size={16}/> <span>Inspection workspace</span></Link>
        </div>
      </header>

      <main className="result-container" id="report-main">
        <nav className="result-progress" aria-label="Assessment stages">
          <Link href="/assess" className="result-progress-past"><span>01</span> Connect</Link>
          <i aria-hidden="true"/>
          <Link href="/assess/scanning" className="result-progress-past"><span>02</span> Inspect</Link>
          <i aria-hidden="true"/>
          <span className="result-progress-current" aria-current="step"><span>03</span> Results</span>
        </nav>

        {!report ? (
          <section className="result-unavailable" aria-live="polite">
            <div className="result-unavailable-icon">{state.kind === "loading" ? <RefreshCw size={30}/> : <LockKeyhole size={30}/>}</div>
            <p className="result-eyebrow">SECURE REPORT ACCESS</p>
            <h1>{state.kind === "loading" ? "Checking access to your report." : "A verified report isn't available."}</h1>
            <p>{state.kind === "loading"
              ? "ShipSafe is checking for an authorized completed assessment. No results are assumed while this loads."
              : state.kind === "invalid" ? "This report reference is invalid. No scan data was accessed."
              : state.kind === "unavailable" ? "The live results backend is not connected yet. A run URL cannot unlock or fabricate security findings."
              : "This assessment could not be verified. We cannot display results without authorized report data."}</p>
            <div className="result-unavailable-actions">
              <Link href="/assess/results" className="result-button-primary">View clearly labeled sample report <ArrowRight size={17}/></Link>
              <Link href="/assess" className="result-button-outline">Back to connection</Link>
            </div>
          </section>
        ) : (
          <>
            <motion.div className="result-intro" {...reveal}>
              <div>
                <p className="result-eyebrow"><span/> THE COMPLETE SECURITY REPORT</p>
                <h1>See the risk.<br/><em>Know the fix.</em></h1>
                <p className="result-intro-desc">From severity to source context, every finding has room for the details that actually matter.</p>
              </div>
              <div className="result-intro-actions">
                <span className={"result-status "+(isSample ? "sample" : "verified")}><span/>{isSample ? "INTERACTIVE SAMPLE" : "ASSESSMENT REPORT"}</span>
                <div className="result-action-buttons">
                  <button type="button" onClick={() => window.print()} className="result-action-secondary"><Printer size={16}/> Print</button>
                  {isSample && <button type="button" onClick={exportSample} className="result-action-primary"><Download size={16}/> Export example</button>}
                </div>
              </div>
            </motion.div>

            {isSample && <div className="result-demo-banner" role="note">
              <span className="result-demo-symbol"><Info size={20}/></span>
              <div><strong>Explore a full sample report.</strong><p>All findings, files and evidence below are fictional demonstrations. No application was connected, scanned or found vulnerable. Every report section is visible—no payment or locked details.</p></div>
              <Link href="/assess" aria-label="Return to connection"><ArrowUpRight size={18}/></Link>
            </div>}

            <div className="result-report-head">
              <div className="result-report-heading">
                <div className="result-app-icon"><FileCode2 size={20}/></div>
                <div><span>APPLICATION REPORT / {isSample ? "SAMPLE" : "AUTHORIZED"}</span><h2>{report.appName}</h2><p><GitBranch size={13}/> {isSample ? "Fictional example revision" : (report.revision || "Revision unavailable")} <span aria-hidden="true">·</span> {isSample ? "Not a live scan" : "Worker-reported completion"}</p></div>
              </div>
              <div className="result-report-badge"><CheckCircle2 size={16}/> Full details included</div>
            </div>

            <div className="result-severities" aria-label="Finding severity filters">
              {(["critical", "high", "medium", "low"] as Severity[]).map((severity, index) => {
                const Icon = labelIcon[severity];
                return <motion.button type="button" key={severity} className={"result-severity "+severity+(filter === severity ? " selected" : "")}
                  onClick={() => { setFilter(current => current === severity ? "all" : severity); setSearch(""); }}
                  aria-pressed={filter === severity} initial={reveal?.initial}
                  animate={reveal?.animate} transition={reduceMotion ? { duration: 0 } : { duration: .65, delay: index * .065 }}>
                  <span className="result-severity-top"><span className="result-severity-icon"><Icon size={16}/></span><span>{filter === severity ? "SELECTED" : "FINDINGS"}</span></span>
                  <strong>{String(counts![severity]).padStart(2, "0")}</strong>
                  <span className="result-severity-footer">{levelNames[severity]} <ArrowRight size={16}/></span>
                </motion.button>;
              })}
            </div>

            <section className="result-workspace" aria-label="Detailed report">
              <div className="result-finding-panel">
                <div className="result-panel-head">
                  <div><span className="result-mini-eyebrow">EVIDENCE INDEX</span><h2>Findings <span>{findings.length}/{report.findings.length}</span></h2></div>
                  <button type="button" className="result-clear" onClick={() => {setFilter("all");setSearch("");}} disabled={filter === "all" && !search}><Filter size={15}/> Reset</button>
                </div>
                <label className="result-search"><Search size={17}/><span className="result-visually-hidden">Search findings</span>
                  <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issue, file, or category…"/>
                  {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={15}/></button>}
                </label>
                <div className="result-filter-pills" aria-label="Severity filters">
                  {levels.map(level => <button key={level} type="button" aria-pressed={filter === level}
                    className={filter === level ? "active" : ""} onClick={() => setFilter(level)}>{levelNames[level]}</button>)}
                </div>
                <div className="result-finding-list">
                  {findings.length === 0 ? <div className="result-no-findings"><FileSearch size={24}/><strong>No matching findings</strong><p>Try another search or reset the severity filter.</p></div> :
                    findings.map(finding => {
                      const Icon = labelIcon[finding.severity];
                      return <button type="button" key={finding.id}
                        className={"result-finding-item "+(active?.id === finding.id ? "active" : "")}
                        onClick={() => setSelectedId(finding.id)} aria-pressed={active?.id === finding.id}>
                        <span className={"result-finding-icon "+finding.severity}><Icon size={17}/></span>
                        <span className="result-finding-text"><span className="result-finding-id">{finding.id} / {finding.category}</span><strong>{finding.title}</strong><small><FileCode2 size={12}/>{finding.location.path}{finding.location.line ? ":"+finding.location.line : ""}</small></span>
                        <span className={"result-item-level "+finding.severity}>{levelNames[finding.severity]}</span>
                      </button>;
                    })}
                </div>
                <div className="result-list-foot"><ShieldCheck size={15}/><span>All report details are accessible. No locked findings.</span></div>
              </div>

              <div className="result-detail-panel" aria-live="polite">
                {active ? <AnimatePresence mode="wait" initial={false}>
                  <motion.article key={active.id} className="result-detail-inner"
                    initial={reduceMotion ? false : { opacity: .55, y: 9 }}
                    animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: .3, y: -7 }}
                    transition={{ duration: reduceMotion ? 0 : .24 }}>
                    <div className="result-detail-top"><span>FINDING / {active.id}</span><span className={"result-detail-level "+active.severity}><span/>{levelNames[active.severity]}</span></div>
                    <h2>{active.title}</h2>
                    <p className="result-detail-summary">{active.overview}</p>
                    <div className="result-detail-meta">
                      <span><Code2 size={15}/> {active.category}</span>
                      <span><Fingerprint size={15}/> {active.confidence} confidence</span>
                    </div>

                    <div className="result-file-location"><div><span className="result-mini-eyebrow">AFFECTED LOCATION</span><code>{active.location.path}{active.location.line ? ":"+active.location.line : ""}</code></div>
                      <CopyFeedback text={active.location.path+(active.location.line ? ":"+active.location.line : "")} label="Copy sample file location"/>
                    </div>

                    <section className="result-detail-section" aria-labelledby="result-evidence"><div className="result-section-title"><Terminal size={18}/><h3 id="result-evidence">Supporting evidence</h3></div>
                      <div className="result-code"><div className="result-code-head"><span><i/><i/><i/> EVIDENCE EXCERPT</span><span>{active.redacted ? "SENSITIVE VALUES MASKED" : "EXAMPLE"}</span></div><pre><code>{active.evidence}</code></pre></div>
                      {active.redacted && <p className="result-evidence-note"><LockKeyhole size={14}/> Credential or personal values are never displayed in full.</p>}
                    </section>

                    <section className="result-detail-section"><div className="result-section-title"><ShieldAlert size={18}/><h3>Why this matters</h3></div><p>{active.whyItMatters}</p></section>

                    <section className="result-detail-section"><div className="result-section-title"><BookOpenCheck size={18}/><h3>Remediation checklist</h3></div>
                      <p className="result-checklist-intro">Review each step. Checkmarks are local UI notes only; they do not change code or verify a fix.</p>
                      <div className="result-fix-progress"><span>{markedCount} / {active.steps.length} reviewed</span><div><span style={{width:(markedCount/active.steps.length*100)+"%"}}/></div></div>
                      <div className="result-checklist">
                        {active.steps.map((step, i) => {
                          const itemId = active.id+"-"+i;
                          return <label key={itemId} className={"result-check-step "+(checked[itemId]?"done":"")}>
                            <input type="checkbox" checked={!!checked[itemId]} onChange={e=>setChecked(current=>({...current,[itemId]:e.target.checked}))}/>
                            <span className="result-checkmark"><Check size={13}/></span><span>{step}</span>
                          </label>;
                        })}
                      </div>
                      <CopyFeedback text={active.steps.map((step,i)=>(i+1)+". "+step).join("\n")} label="Copy remediation checklist"/>
                    </section>

                    <section className="result-detail-section result-verify-box"><div className="result-section-title"><ClipboardCheck size={18}/><h3>How to verify</h3></div><p>{active.verification}</p></section>
                    {active.limitations && <section className="result-limitations"><ShieldQuestion size={17}/><div><strong>What this finding does not prove</strong><p>{active.limitations}</p></div></section>}
                  </motion.article>
                </AnimatePresence> : <div className="result-no-detail"><FileSearch size={25}/><p>Select a finding to view its full details.</p></div>}
              </div>
            </section>

            <section className="result-coverage" id="coverage">
              <div className="result-coverage-header"><div><p className="result-eyebrow">THE COMPLETE PICTURE</p><h2>Coverage, not just counts.</h2><p>{report.scopeNote}</p></div>
                <button type="button" onClick={()=>setCoverageOpen(!coverageOpen)} aria-expanded={coverageOpen} aria-controls="result-coverage-table">
                  {coverageOpen ? "Hide coverage" : "Show coverage"} <ChevronDown size={16} className={coverageOpen?"rotated":""}/>
                </button></div>
              <div className="result-coverage-metrics"><div><strong>{verifiedCoverage}</strong><span>Checks reported complete</span></div><div><strong>{incompleteCoverage}</strong><span>Skipped or failed checks</span></div><div><strong>{report.findings.length}</strong><span>Findings available in full</span></div></div>
              <AnimatePresence initial={false}>{coverageOpen && <motion.div id="result-coverage-table" className="result-coverage-list" initial={reduceMotion?false:{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={reduceMotion?undefined:{height:0,opacity:0}} transition={{duration:reduceMotion?0:.28}} style={{overflow:"hidden"}}>
                {report.coverage.map(item=><div key={item.id}><span className={"result-coverage-status "+item.status}>{item.status==="complete"?<CheckCircle2 size={18}/>:item.status==="failed"?<AlertCircle size={18}/>:<CircleDashed size={18}/>}</span><div><strong>{item.label}</strong><p>{item.note}</p></div><span className="result-coverage-tag">{item.status}</span></div>)}
              </motion.div>}</AnimatePresence>
            </section>

            <section className="result-end"><div><p className="result-eyebrow">FROM FINDING TO FIX</p><h2>A report you can<br/>actually use.</h2><p>Every sample finding is fully visible. When scanning goes live, actual results will require verified authorization and reflect only completed checks.</p></div><div className="result-end-actions"><Link href="/assess" className="result-end-primary">Connect an application <ArrowUpRight size={17}/></Link><Link href="/security" className="result-end-secondary">Read our security approach <ArrowRight size={16}/></Link></div></section>

            <div className="result-print-all">{report.findings.map(f=><article key={f.id}><h2>{f.id} · {f.title} ({f.severity})</h2><p>{f.location.path}:{f.location.line||"—"}</p><p>{f.overview}</p><p>{f.whyItMatters}</p><pre>{f.evidence}</pre><ol>{f.steps.map(step=><li key={step}>{step}</li>)}</ol><p><strong>Verify:</strong> {f.verification}</p><p><strong>Limitations:</strong> {f.limitations||"See report scope"}</p></article>)}</div>
          </>
        )}
      </main>

      <footer className="result-footer"><div className="result-container result-footer-inner"><Link href="/" className="brand">shipsafe<span>.</span></Link><span>Full context. No hidden findings.</span><nav aria-label="Report footer"><Link href="/security">Security</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div></footer>
    </div>
  );
}
