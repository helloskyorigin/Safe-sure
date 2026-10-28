"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft, ArrowRight, AlertCircle, Check, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardCheck, ClipboardCopy, Code2, Download, ExternalLink, FileCode2,
  FileSearch, Github, GitCommitHorizontal, Info, LockKeyhole, Printer, Search,
  ShieldAlert, ShieldCheck, ShieldQuestion, X,
} from "lucide-react";
import {
  SAMPLE_REPORT, isAssessmentReport, severityCounts,
  type AssessmentReport, type ReportFinding, type Severity,
} from "@/lib/report-contract";
import { githubSourceUrl, priorityFindings, remediationMarkdown } from "@/lib/report-presentation";
import { loadPublicReport } from "@/lib/browser-report-history";
import ReportDeltaPanel from "@/components/ReportDeltaPanel";
import { reportToSarif } from "@/lib/report-sarif";

type ReportState =
  | { kind: "loading" }
  | { kind: "sample" }
  | { kind: "invalid" | "unavailable" | "error" }
  | { kind: "live"; report: AssessmentReport; source: "public" | "private" };
type Filter = "all" | Severity;
const levels: Filter[] = ["all", "critical", "high", "medium", "low"];
const labels: Record<Filter, string> = {
  all: "All findings", critical: "Critical", high: "High", medium: "Medium", low: "Low",
};
const severityIcons = { critical: ShieldAlert, high: AlertCircle, medium: ShieldQuestion, low: Info };

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  }
  return <button type="button" className="result-copy" onClick={() => void copy()}
    aria-label={label}>{copied ? <Check size={14}/> : <ClipboardCopy size={14}/>} {copied ? "Copied" : "Copy"}</button>;
}

function downloadText(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function HistoryIcon() { return <GitCommitHorizontal size={15}/>; }

function readableDate(value: string) {
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? "Date unavailable" :
    time.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ResultsExperience() {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<ReportState>({ kind: "loading" });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState("");
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const localId = params.get("local");
    if (localId) {
      if (!/^[0-9a-f-]{36}$/i.test(localId)) { setState({ kind: "invalid" }); return; }
      try {
        const value: unknown = loadPublicReport(localId);
        if (!isAssessmentReport(value, localId)) { setState({ kind: "error" }); return; }
        setSelectedId(priorityFindings(value.findings)[0]?.id || "");
        setState({ kind: "live", report: value, source: "public" });
      } catch { setState({ kind: "error" }); }
      return;
    }

    const runId = params.get("run");
    if (!runId) { setSelectedId(SAMPLE_REPORT.findings[0].id); setState({ kind: "sample" }); return; }
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(runId)) { setState({ kind: "invalid" }); return; }

    const controller = new AbortController();
    let stopped = false;
    setState({ kind: "loading" });
    async function loadStoredReport() {
      try {
        const response = await fetch("/api/assessments/" + encodeURIComponent(runId!) + "/report", {
          cache: "no-store", credentials: "same-origin", signal: controller.signal,
        });
        if (stopped) return;
        if (response.status === 503 || response.status === 501) {
          setState({ kind: "unavailable" }); return;
        }
        if (!response.ok) { setState({ kind: "error" }); return; }
        const data: unknown = await response.json();
        if (!isAssessmentReport(data, runId!)) { setState({ kind: "error" }); return; }
        setSelectedId(priorityFindings(data.findings)[0]?.id || "");
        setState({ kind: "live", report: data, source: "private" });
      } catch { if (!stopped) setState({ kind: "error" }); }
    }
    void loadStoredReport();
    return () => { stopped = true; controller.abort(); };
  }, []);

  const isSample = state.kind === "sample";
  const report = isSample ? SAMPLE_REPORT : state.kind === "live" ? state.report : null;
  const ordered = useMemo(() => report ? priorityFindings(report.findings) : [], [report]);
  const counts = useMemo(() => report ? severityCounts(report.findings) : null, [report]);
  const found = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ordered.filter(f => (filter === "all" || f.severity === filter) &&
      (!query || [f.title, f.id, f.category, f.location.path, f.overview]
        .some(text => text.toLowerCase().includes(query))));
  }, [ordered, filter, search]);
  const active = found.find(f => f.id === selectedId) || found[0] || null;

  // Familiar developer shortcuts. Never intercept typing or modified keystrokes.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      const editing = !!target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable);
      if (event.key === "/" && !editing) {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "Escape" && target === searchRef.current) {
        setSearch("");
        searchRef.current?.blur();
      } else if (!editing && (event.key === "j" || event.key === "k") && found.length > 0) {
        event.preventDefault();
        const index = found.findIndex(f => f.id === active?.id);
        const next = event.key === "j"
          ? Math.min(index + 1, found.length - 1)
          : Math.max(index - 1, 0);
        setSelectedId(found[next].id);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [found, active?.id]);
  const doneCoverage = report?.coverage.filter(c => c.status === "complete").length || 0;
  const otherCoverage = report?.coverage.filter(c => c.status !== "complete").length || 0;
  const reviewedCount = active?.steps.filter((_, i) => reviewed[active.id + ":" + i]).length || 0;
  const sourceUrl = active && report && !isSample ? githubSourceUrl(report, active.location.path, active.location.line) : null;

  function saveExport(kind: "json" | "plan" | "sarif") {
    if (!report) return;
    if (kind === "sarif") {
      if (isSample) return; // Never expose fictional sample findings as a code-scanning artifact.
      downloadText("secuvora-security-results.sarif", JSON.stringify(reportToSarif(report), null, 2),
        "application/sarif+json;charset=utf-8");
    } else if (kind === "json") {
      const result = isSample
        ? { ...report, sample: true, notice: "Fictional demonstration, not a security scan." }
        : { ...report, notice: "Limited source-level scan. Findings require context and verification." };
      downloadText(isSample ? "secuvora-sample-full-report.json" : "secuvora-security-report.json",
        JSON.stringify(result, null, 2), "application/json;charset=utf-8");
    } else {
      downloadText(isSample ? "secuvora-sample-fix-plan.md" : "secuvora-fix-plan.md",
        remediationMarkdown(report, isSample), "text/markdown;charset=utf-8");
    }
    setExportFeedback(kind === "sarif" ? "SARIF file downloaded" :
      kind === "json" ? "JSON report downloaded" : "Fix plan downloaded");
    window.setTimeout(() => setExportFeedback(""), 2300);
  }

  function selectFinding(finding: ReportFinding) {
    setSelectedId(finding.id);
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.requestAnimationFrame(() => {
        document.getElementById("finding-detail")?.scrollIntoView({
          behavior: reduceMotion ? "instant" : "smooth", block: "start",
        });
      });
    }
  }

  return <div className="result-page">
    <a className="skip-link" href="#report-main">Skip to report</a>
    <header className="result-nav">
      <div className="result-container result-nav-inner">
        <Link className="brand" href="/" aria-label="Secuvora homepage">secuvora<span>.</span></Link>
        <span className="result-nav-label"><span/> SECUVORA AGENT REPORT</span>
        <div className="result-nav-actions">
          <Link href="/assess/history" className="result-nav-back"><HistoryIcon/> <span>History</span></Link>
          <Link href="/assess" aria-label="New investigation" className="result-nav-back"><ArrowLeft size={16}/> <span>New investigation</span></Link>
        </div>
      </div>
    </header>

    <main className="result-container result-main" id="report-main">
      {!report ? <section className="result-unavailable" aria-live="polite">
        <div className="result-unavailable-icon">
          {state.kind === "loading" ? <FileSearch size={29}/> : <LockKeyhole size={29}/>}
        </div>
        <h1>{state.kind === "loading" ? "Loading your report…" : "A verified report isn't available."}</h1>
        <p>{state.kind === "loading" ? "Checking the completed scan and your report access." :
          state.kind === "invalid" ? "This report reference is invalid." :
          state.kind === "unavailable" ? "Saved private reports require the configured report storage service." :
          "This report wasn't found, or your current browser or GitHub session can't access it."}</p>
        <div className="result-unavailable-actions">
          <Link href="/assess" className="result-button-primary">Scan a repository <ArrowRight size={16}/></Link>
          <Link href="/assess/results" className="result-button-outline">View clearly labeled sample report</Link>
        </div>
      </section> : <>
        <section className="result-top">
          <div className="result-heading">
            <div className="result-heading-kicker">
              <span className={"result-status " + (isSample ? "sample" : "verified")}>
                {isSample ? <Info size={14}/> : <CheckCircle2 size={15}/>}
                {isSample ? "INTERACTIVE SAMPLE" : "AGENT REVIEW COMPLETE"}
              </span>
              <span className="result-date">{isSample ? "Fictional data" : readableDate(report.finishedAt)}</span>
            </div>
            <h1>Your agent report<span>.</span></h1>
            <p>Your security agent investigated the available source. Review evidence, scope and recommended fixes.</p>
          </div>
          <div className="result-toolbar">
            <button type="button" onClick={() => saveExport("plan")} className="result-action-secondary">
              <Download size={16}/> Fix plan
            </button>
            <button type="button" onClick={() => window.print()} className="result-action-secondary">
              <Printer size={16}/> Save PDF
            </button>
            {!isSample && <button type="button" onClick={() => saveExport("sarif")} className="result-action-secondary">
              <Code2 size={16}/> Export SARIF
            </button>}
            <button type="button" onClick={() => saveExport("json")} className="result-action-primary">
              <Download size={16}/> {isSample ? "Export example" : "Export JSON"}
            </button>
          </div>
        </section>

        {isSample && <div className="result-demo-banner" role="note">
          <Info size={18}/>
          <p><strong>Sample report, not a security assessment.</strong> All findings and evidence below are fictional. No application was connected, scanned or found vulnerable.</p>
        </div>}

        <section className="result-repo-card" aria-label="Scanned repository">
          <div className="result-app-icon"><Github size={20}/></div>
          <div className="result-repo-info">
            <span>{isSample ? "DEMONSTRATION REPOSITORY" : state.kind === "live" && state.source === "private" ? "AUTHORIZED PRIVATE REPOSITORY" : "PUBLIC REPOSITORY"}</span>
            <h2>{report.appName}</h2>
            <p><GitCommitHorizontal size={14}/> <span title={report.revision || "Unknown commit"}>{isSample ? "Example revision" : report.revision ? report.revision.slice(0, 12) : "Revision unavailable"}</span> <span aria-hidden="true">·</span> Read-only source assessment</p>
            {report.scanMetrics && <p className="result-scanned-metrics">
              <span>{report.scanMetrics.filesInspected} files inspected</span>
              <span>{report.scanMetrics.linesInspected.toLocaleString()} lines reviewed</span>
              <span>{report.scanMetrics.dependencyVersions} pinned packages</span>
              <span>{report.scanMetrics.rulesExecuted} source rules</span>
            </p>}
          </div>
          <span className="result-included"><CheckCircle2 size={15}/> Complete agent report</span>
        </section>

        <section className="result-overview" aria-labelledby="result-overview-title">
          <div className="result-section-head">
            <h2 id="result-overview-title">Findings overview</h2>
            <span>{report.findings.length} candidate {report.findings.length === 1 ? "finding" : "findings"}</span>
          </div>
          <div className="result-severities" aria-label="Severity summary">
            {(["critical", "high", "medium", "low"] as Severity[]).map(level => {
              const Icon = severityIcons[level];
              return <div key={level} className={"result-severity " + level}>
                <span className="result-severity-name"><Icon size={17}/>{labels[level]}</span>
                <strong>{String(counts![level]).padStart(2, "0")}</strong>
              </div>;
            })}
          </div>
          <div className={"result-risk-note" + (report.findings.length === 0 ? " zero" : "")}>
            {report.findings.length === 0 ? <ShieldCheck size={19}/> : <ShieldAlert size={19}/>}
            <p><strong>{report.findings.length === 0 ? "No candidates detected in supported checks." :
              counts!.critical + counts!.high > 0 ? "Start with critical and high-priority findings." : "Review detected findings before drawing conclusions."}</strong>
              {" "}{report.findings.length === 0
                ? "Zero findings does not prove the repository is secure."
                : "Static findings and advisory matches need manual context; they are not confirmed exploits."}</p>
            <a href="#coverage">Coverage <ArrowRight size={14}/></a>
          </div>
        </section>

        {state.kind === "live" && <ReportDeltaPanel report={state.report} source={state.source}/>}
        <section className="result-workspace" aria-label="Detailed report">
          <div className="result-finding-panel" id="findings">
            <div className="result-panel-head">
              <div><h2>Findings <span>{found.length}/{report.findings.length}</span></h2><small>Highest priority first</small></div>
              <button type="button" className="result-clear" onClick={() => { setFilter("all"); setSearch(""); }}
                disabled={filter === "all" && !search}>Reset filters</button>
            </div>
            <label className="result-search">
              <Search size={16}/>
              <span className="result-visually-hidden">Search findings</span>
              <input ref={searchRef} type="search" placeholder="Search finding or file…" value={search}
                onChange={event => setSearch(event.target.value)}/>
              {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={15}/></button>}
            </label>
            <p className="result-keyboard-hint">Shortcuts <kbd>/</kbd> search · <kbd>J</kbd>/<kbd>K</kbd> navigate findings</p>
            <div className="result-filter-pills" aria-label="Severity filters">
              {levels.map(level => <button type="button" key={level} aria-pressed={filter === level}
                onClick={() => setFilter(level)} className={filter === level ? "active" : ""}>{labels[level]}</button>)}
            </div>
            <div className="result-finding-list">
              {found.length === 0 ? <div className="result-no-findings">
                <FileSearch size={24}/>
                <strong>{report.findings.length === 0 ? "No findings flagged by these rules" : "No matching findings"}</strong>
                <p>{report.findings.length === 0
                  ? "Review check coverage and limitations before drawing conclusions."
                  : "Try a different search or reset the severity filter."}</p>
                <a href="#coverage">Review coverage</a>
              </div> : found.map(finding => {
                const Icon = severityIcons[finding.severity];
                return <button type="button" className={"result-finding-item" + (active?.id === finding.id ? " active" : "")}
                  aria-pressed={active?.id === finding.id} onClick={() => selectFinding(finding)} key={finding.id}>
                  <span className={"result-finding-icon " + finding.severity}><Icon size={18}/></span>
                  <span className="result-finding-copy">
                    <small>{finding.category} · {finding.id}</small>
                    <strong>{finding.title}</strong>
                    <span><FileCode2 size={12}/>{finding.location.path}{finding.location.line ? ":" + finding.location.line : ""}</span>
                  </span>
                  <span className={"result-item-level " + finding.severity}>{labels[finding.severity]}</span>
                </button>;
              })}
            </div>
          </div>

          <div className="result-detail-panel" id="finding-detail" aria-live="polite">
            {active ? <article className="result-detail-inner" key={active.id}>
              <div className="result-detail-heading">
                <a className="result-mobile-back" href="#findings"><ArrowLeft size={14}/> All findings</a>
                <div className="result-detail-top"><span>FINDING / {active.id}</span>
                  <span className={"result-detail-level " + active.severity}>{labels[active.severity]}</span></div>
                <h2>{active.title}</h2>
                <p>{active.overview}</p>
                <div className="result-detail-ticket">
                  <small>Ready for your issue tracker</small>
                  <CopyButton label="Copy issue-ready finding" value={[
                    "## [" + active.severity.toUpperCase() + "] " + active.title,
                    "",
                    "**Repository:** " + report.appName,
                    "**Location:** " + active.location.path + (active.location.line ? ":" + active.location.line : ""),
                    "**Confidence:** " + active.confidence,
                    "**Rule:** " + (active.ruleId || "Unspecified"),
                    "",
                    active.overview,
                    "",
                    "### Evidence (scanner output)",
                    "```text",
                    active.evidence,
                    "```",
                    "",
                    "### Recommended review",
                    ...active.steps.map(s => "- [ ] " + s),
                    "",
                    "### Verification",
                    active.verification,
                    "",
                    "**Note:** Static detection is not a confirmed exploit. Review scan coverage before closing.",
                  ].join("\n")}/>
                </div>
                <div className="result-detail-meta"><span><Code2 size={14}/>{active.category}</span>
                  <span><ShieldCheck size={14}/>{active.confidence} confidence</span>
                  {active.ruleId && <span><FileSearch size={14}/> Rule {active.ruleId}</span>}</div>
              </div>

              <div className="result-file-location">
                <div><small>AFFECTED FILE</small><code>{active.location.path}{active.location.line ? ":" + active.location.line : ""}</code></div>
                <div className="result-file-actions">
                  <CopyButton value={active.location.path + (active.location.line ? ":" + active.location.line : "")}
                    label="Copy file location"/>
                  {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="result-open-source">Open source <ExternalLink size={14}/></a>}
                </div>
              </div>

              <section className="result-detail-section">
                <h3>Evidence</h3>
                <div className="result-code">
                  <div className="result-code-head"><span>SCANNER EVIDENCE</span><span>{active.redacted ? "SENSITIVE VALUES MASKED" : "SOURCE / ADVISORY EVIDENCE"}</span></div>
                  <pre><code>{active.evidence}</code></pre>
                </div>
                {active.redacted && <p className="result-evidence-note"><LockKeyhole size={14}/> Sensitive values are masked in this report.</p>}
              </section>

              <section className="result-detail-section">
                <h3>Why it matters</h3><p>{active.whyItMatters}</p>
              </section>

              <section className="result-detail-section result-fixes">
                <div className="result-section-title"><h3>Recommended fix</h3><CopyButton
                  value={active.steps.map((step, index) => (index + 1) + ". " + step).join("\n")}
                  label="Copy remediation checklist"/></div>
                <p className="result-checklist-intro">These steps are guidance, not applied code changes.</p>
                <div className="result-checklist">
                  {active.steps.map((step, index) => {
                    const key = active.id + ":" + index;
                    return <label key={key} className={"result-check-step" + (reviewed[key] ? " done" : "")}>
                      <input type="checkbox" checked={Boolean(reviewed[key])}
                        onChange={event => setReviewed(old => ({ ...old, [key]: event.target.checked }))}/>
                      <span className="result-checkmark"><Check size={13}/></span><span>{step}</span>
                    </label>;
                  })}
                </div>
                <p className="result-reviewed-count">{reviewedCount}/{active.steps.length} marked for review · not automatically verified</p>
              </section>

              <section className="result-detail-section result-verification">
                <h3><ClipboardCheck size={18}/> How to verify</h3>
                <p>{active.verification}</p>
              </section>

              {active.limitations && <div className="result-limitations">
                <ShieldQuestion size={17}/><p><strong>Important limitation.</strong> {active.limitations}</p>
              </div>}
            </article> : <div className="result-no-detail">
              <FileSearch size={28}/>
              <h2>{report.findings.length === 0 ? "No finding details to display." : "No finding selected."}</h2>
              <p>{report.findings.length === 0
                ? "No supported findings were reported. This does not prove the application is secure."
                : "Select a finding or reset the search filters."}</p>
              <a href="#coverage">Review coverage and limitations</a>
            </div>}
          </div>
        </section>

        <section className="result-coverage" id="coverage">
          <div className="result-coverage-header">
            <div><h2>Scan coverage</h2><p>{report.scopeNote}</p></div>
            <button type="button" onClick={() => setCoverageOpen(open => !open)}
              aria-expanded={coverageOpen} aria-controls="result-coverage-table">
              {coverageOpen ? "Hide coverage" : "Show coverage"}
              {coverageOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
          </div>
          <div className="result-coverage-metrics">
            <span><CheckCircle2 size={16}/> {doneCoverage} checks complete</span>
            <span><AlertCircle size={16}/> {otherCoverage} skipped / failed</span>
          </div>
          {coverageOpen && <div className="result-coverage-list" id="result-coverage-table">
            {report.coverage.map(item => <div key={item.id}>
              <span className={"result-coverage-status " + item.status}>
                {item.status === "complete" ? <CheckCircle2 size={17}/> : <AlertCircle size={17}/>}
              </span>
              <div><strong>{item.label}</strong><p>{item.note}</p></div>
              <span className="result-coverage-tag">{item.status}</span>
            </div>)}
          </div>}
        </section>

        <div className="result-bottom">
          <p><ShieldCheck size={15}/> Full findings, evidence and fixes included. No paywall.</p>
          <Link href="/assess">Scan another repository <ArrowRight size={16}/></Link>
        </div>

        <div className="result-print-all" aria-hidden="true">
          <h2>All findings and recommended fixes</h2>
          {priorityFindings(report.findings).map(f => <article key={f.id}>
            <h3>{f.id} — {f.title} ({f.severity.toUpperCase()})</h3>
            <p><strong>File:</strong> {f.location.path}{f.location.line ? ":" + f.location.line : ""}</p>
            <p><strong>Confidence:</strong> {f.confidence} · <strong>Category:</strong> {f.category}{f.ruleId ? " · Rule: " + f.ruleId : ""}</p>
            <p>{f.overview}</p>
            <p><strong>Why it matters:</strong> {f.whyItMatters}</p>
            <pre>{f.evidence}</pre>
            <ol>{f.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
            <p><strong>Verification:</strong> {f.verification}</p>
            <p><strong>Limitations:</strong> {f.limitations || "See assessment scope"}</p>
          </article>)}
          {report.findings.length === 0 && <p>No findings detected in supported checks. This is not a security certification.</p>}
          <h2>Coverage and scope</h2>
          <p>{report.scopeNote}</p>
          {report.coverage.map(item => <p key={item.id}><strong>{item.label} ({item.status}):</strong> {item.note}</p>)}
        </div>
      </>}
    </main>

    <footer className="result-footer"><div className="result-container result-footer-inner">
      <Link href="/" className="brand">secuvora<span>.</span></Link>
      <span>Read-only automated analysis · Rules + OSV · No security guarantee</span>
      <nav aria-label="Footer links"><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link></nav>
    </div></footer>
    {exportFeedback && <div className="result-toast" role="status">{exportFeedback}</div>}
  </div>;
}
