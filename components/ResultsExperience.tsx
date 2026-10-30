"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import Brand from "@/components/Brand";
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
  const [reviewedReportId, setReviewedReportId] = useState("");

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
  const priority = ordered[0] || null;
  const partialCoverage = !!report && (
    !!(report.scanMetrics && report.scanMetrics.filesInspected < report.scanMetrics.eligibleFiles) ||
    report.coverage.some(item => item.id === "limits" || (item.id === "dependencies" && item.status === "failed"))
  );

  // Checkmarks track developer review, never verified remediation. Keep them per report.
  useEffect(() => {
    if (state.kind !== "live") return;
    const storage = state.source === "public" ? localStorage : sessionStorage;
    const key = "secuvora:reviewed:v1:" + state.report.runId;
    try {
      const saved: unknown = JSON.parse(storage.getItem(key) || "{}");
      const allowed = new Set(state.report.findings.flatMap(finding =>
        finding.steps.map((_, index) => finding.id + ":" + index)));
      const checked: Record<string, boolean> = {};
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        for (const [id, value] of Object.entries(saved)) {
          if (allowed.has(id) && value === true) checked[id] = true;
        }
      }
      setReviewed(checked);
    } catch { setReviewed({}); }
    setReviewedReportId(state.report.runId);
  }, [state]);

  useEffect(() => {
    if (state.kind !== "live" || reviewedReportId !== state.report.runId) return;
    try {
      const storage = state.source === "public" ? localStorage : sessionStorage;
      storage.setItem("secuvora:reviewed:v1:" + state.report.runId, JSON.stringify(reviewed));
    } catch { /* Browser storage may be unavailable; review still works in memory. */ }
  }, [reviewed, reviewedReportId, state]);
  const found = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ordered.filter(f => (filter === "all" || f.severity === filter) &&
      (!query || [f.title, f.id, f.category, f.location.path, f.overview]
        .some(text => text.toLowerCase().includes(query))));
  }, [ordered, filter, search]);
  const active = found.find(f => f.id === selectedId) || found[0] || null;
  const activeIndex = active ? found.findIndex(f => f.id === active.id) : -1;

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
    window.setTimeout(() => setExportFeedback(""), 6500);
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
        <Brand label="Secuvora homepage" />
        <span className="result-nav-label"><span/> SECUVORA AGENT REPORT</span>
        <div className="result-nav-actions">
          <ThemeToggle/>
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
            <h1>{isSample ? "Explore a sample report" : "Security report"}</h1>
            <p>{isSample ? "Explore a fictional example of the developer workflow. No repository was scanned." : "Findings, impact and steps to review — grounded in the scanned source."}</p>
          </div>
          <div className="result-toolbar">
            <details className="result-export-menu">
              <summary><Download size={16}/> Export <ChevronDown size={15}/></summary>
              <div className="result-export-options">
                <button type="button" onClick={() => saveExport("plan")}><ClipboardCheck size={15}/> Fix plan (.md)</button>
                <button type="button" onClick={() => window.print()}><Printer size={15}/> Save PDF</button>
                <button type="button" onClick={() => saveExport("json")}><Download size={15}/> {isSample ? "Export example JSON" : "Export JSON"}</button>
                {!isSample && <button type="button" onClick={() => saveExport("sarif")}><Code2 size={15}/> Export SARIF</button>}
              </div>
            </details>
          </div>
        </section>

        {isSample && <div className="result-demo-banner" role="note">
          <Info size={18}/>
          <p><strong>Sample report, not a security assessment.</strong> All findings and evidence below are fictional. No application was connected, scanned or found vulnerable.</p>
        </div>}


        <section className="result-repo-card" aria-label="Scanned repository">
          <div className="result-repo-info">
            <span>{isSample ? "ILLUSTRATIVE DATA" : state.kind === "live" && state.source === "private" ?
              "AUTHORIZED GITHUB REPOSITORY" : "SAVED REPOSITORY REPORT"}</span>
            <h2>{report.appName}</h2>
            <p><GitCommitHorizontal size={14}/> {isSample ? "Example revision" :
              report.revision ? report.revision.slice(0, 12) : "Revision unavailable"}
              <span aria-hidden="true">·</span> Read-only source review</p>
            {report.scanMetrics && <p className="result-scanned-metrics">
              <span>{report.scanMetrics.filesInspected} files inspected</span>
              <span>{report.scanMetrics.linesInspected.toLocaleString()} lines reviewed</span>
              <span>{report.scanMetrics.dependencyVersions} pinned packages</span>
            </p>}
          </div>
        </section>

        <section className="result-overview" aria-label="Findings by severity">
          <div className="result-severities">
            {(["critical","high","medium","low"] as Severity[]).map(level => {
              const Icon = severityIcons[level];
              return <button type="button" key={level}
                className={"result-severity " + level + (filter === level ? " selected" : "")}
                aria-pressed={filter === level}
                aria-label={"Show " + labels[level] + " findings"}
                disabled={counts![level] === 0}
                onClick={() => setFilter(current => current === level ? "all" : level)}>
                <span className="result-severity-name"><Icon size={18}/>{labels[level]}</span>
                <strong>{String(counts![level]).padStart(2,"0")}</strong>
              </button>;
            })}
          </div>
        </section>

        {report.findings.length === 0 ? (
          <section className="result-clean-zero" role="status">
            <ShieldCheck size={21}/>
            <div>
              <h2>No findings from supported rules</h2>
              <p>{report.scanMetrics ?
                report.scanMetrics.filesInspected + " eligible files inspected. " : ""}
                {report.coverage.some(item => item.id === "dependencies" && item.status !== "complete")
                  ? "Dependency advisories were not fully checked. " : ""}
                Zero findings does not prove the codebase is secure.</p>
            </div>
          </section>
        ) : (
          <section className="result-simple-findings" aria-label="Detected findings" id="findings">
            <div className="result-simple-heading">
              <h2>Findings <span>{found.length}/{report.findings.length}</span></h2>
              {filter !== "all" && <button type="button" onClick={() => setFilter("all")}>Show all findings</button>}
            </div>
            {found.map(finding => {
              const Icon = severityIcons[finding.severity];
              const fileLink = !isSample
                ? githubSourceUrl(report, finding.location.path, finding.location.line) : null;
              return <details className="result-finding-card" key={finding.id}>
                <summary>
                  <span className={"result-finding-icon " + finding.severity}><Icon size={20}/></span>
                  <span className="result-finding-copy">
                    <small>{finding.category} · {finding.confidence} confidence</small>
                    <strong>{finding.title}</strong>
                    <span><FileCode2 size={13}/>{finding.location.path}
                      {finding.location.line ? ":" + finding.location.line : ""}</span>
                  </span>
                  <span className={"result-item-level " + finding.severity}>{labels[finding.severity]}</span>
                  <ChevronDown className="result-card-chevron" size={17}/>
                </summary>
                <div className="result-finding-content">
                  <div className="result-finding-fact">
                    <h3>Why flagged</h3><p>{finding.overview}</p>
                  </div>
                  <div className="result-finding-fact">
                    <h3>Potential impact</h3><p>{finding.whyItMatters}</p>
                  </div>
                  <div className="result-finding-fact">
                    <h3>How to fix</h3>
                    <ol>{finding.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
                  </div>
                  <div className="result-finding-fact">
                    <h3>How to verify</h3><p>{finding.verification}</p>
                  </div>
                  <details className="result-evidence-accordion">
                    <summary>Source evidence &amp; detector limits <ChevronDown size={15}/></summary>
                    <div>
                      <p><strong>Rule:</strong> {finding.ruleId || "Source rule"}
                        {finding.ruleEngine ? " · " + finding.ruleEngine : ""}</p>
                      <pre>{finding.evidence}</pre>
                      {finding.limitations && <p>{finding.limitations}</p>}
                    </div>
                  </details>
                  {fileLink && <a className="result-open-source" href={fileLink} target="_blank" rel="noopener noreferrer">
                    Open source <ExternalLink size={14}/>
                  </a>}
                </div>
              </details>;
            })}
          </section>
        )}

        <details className={"result-clean-coverage" + (partialCoverage ? " partial" : "")} id="coverage">
          <summary>Coverage &amp; limitations <ChevronDown size={16}/></summary>
          <div className="result-clean-coverage-body">
            <p>{report.scanMetrics ?
              report.scanMetrics.filesInspected + " of " + report.scanMetrics.eligibleFiles +
              " eligible files inspected. " : ""}{report.scopeNote}</p>
            <p>Runtime behavior and exploitability were not tested.</p>
            <ul>{report.coverage.map(item => <li key={item.id}>
              <span className={"result-coverage-tag " + item.status}>{item.status}</span>
              <strong>{item.label}</strong>
              <p>{item.note}</p>
            </li>)}</ul>
          </div>
        </details>

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
      <Brand />
      <span>Read-only automated analysis · Rules + OSV · No security guarantee</span>
      <nav aria-label="Footer links"><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link></nav>
    </div></footer>
    {exportFeedback && <div className="result-toast" role="status">{exportFeedback}</div>}
  </div>;
}
