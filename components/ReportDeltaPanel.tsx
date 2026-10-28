"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GitCompareArrows, History, Info, RotateCcw, ShieldCheck } from "lucide-react";
import { listPublicReports, loadPublicReport } from "@/lib/browser-report-history";
import { compareAssessmentReports, type ReportDelta } from "@/lib/report-delta";
import { isAssessmentReport, type AssessmentReport } from "@/lib/report-contract";

type Source = "public" | "private";
type Comparison = { previous: AssessmentReport; delta: ReportDelta };
type PrivateSummary = { runId: string; appName: string; finishedAt: string };

export default function ReportDeltaPanel({ report, source }: { report: AssessmentReport; source: Source }) {
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function compare() {
      setLoading(true);
      setComparison(null);
      try {
        let previous: AssessmentReport | null = null;
        if (source === "public") {
          const earlier = listPublicReports().filter(item =>
            item.appName.toLowerCase() === report.appName.toLowerCase() &&
            item.runId !== report.runId &&
            new Date(item.finishedAt).getTime() <= new Date(report.finishedAt).getTime(),
          ).sort((a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt));
          for (const item of earlier) {
            const found = loadPublicReport(item.runId);
            if (found) { previous = found; break; }
          }
        } else {
          const list = await fetch("/api/reports", {
            credentials: "same-origin", cache: "no-store", signal: controller.signal,
          });
          if (list.ok) {
            const data = await list.json() as { reports?: PrivateSummary[] };
            const earlier = (Array.isArray(data.reports) ? data.reports : [])
              .filter(item => item && typeof item.appName === "string" &&
                item.appName.toLowerCase() === report.appName.toLowerCase() &&
                item.runId !== report.runId &&
                Date.parse(item.finishedAt) <= Date.parse(report.finishedAt))
              .sort((a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt))[0];
            if (earlier && /^[0-9a-f-]{36}$/i.test(earlier.runId)) {
              const response = await fetch("/api/assessments/" + encodeURIComponent(earlier.runId) + "/report", {
                credentials: "same-origin", cache: "no-store", signal: controller.signal,
              });
              if (response.ok) {
                const data: unknown = await response.json();
                if (isAssessmentReport(data, earlier.runId)) previous = data;
              }
            }
          }
        }
        if (active && previous) {
          const delta = compareAssessmentReports(report, previous);
          if (delta) setComparison({ previous, delta });
        }
      } catch {
        // Comparison is optional. A failed history lookup must never hide a real report.
      } finally {
        if (active) setLoading(false);
      }
    }
    void compare();
    return () => { active = false; controller.abort(); };
  }, [report, source]);

  const rescanUrl = "/assess/scanning?" + (source === "public" ? "repo=" : "private=") +
    encodeURIComponent(report.appName);
  const previousUrl = comparison ?
    "/assess/results?" + (source === "public" ? "local=" : "run=") +
      encodeURIComponent(comparison.previous.runId) : null;

  return <section className="delta-panel" aria-labelledby="delta-title">
    <div className="delta-heading">
      <div className="delta-heading-main">
        <span className="delta-emblem"><GitCompareArrows size={21}/></span>
        <div>
          <span className="delta-eyebrow">DEVELOPER WORKFLOW / SCAN DELTA</span>
          <h2 id="delta-title">What changed since last scan?</h2>
        </div>
      </div>
      <Link href={rescanUrl} className="delta-rescan"><RotateCcw size={15}/> Rescan repository</Link>
    </div>
    {loading ? <p className="delta-muted" role="status">Checking earlier verified reports…</p> :
      comparison ? <>
        <div className="delta-compare-bar">
          <span><History size={14}/> Comparing with {new Date(comparison.previous.finishedAt).toLocaleDateString()}</span>
          <span className="delta-commit">Previous revision: {comparison.previous.revision?.slice(0, 12) || "unavailable"}</span>
          {previousUrl && <Link href={previousUrl}>Open earlier report <ArrowRight size={14}/></Link>}
        </div>
        <div className="delta-metrics" aria-label="Changes in detected findings">
          <div className="delta-metric new"><strong>{comparison.delta.added.length}</strong><span>New signals</span><small>In this scan, absent previously</small></div>
          <div className="delta-metric continuing"><strong>{comparison.delta.persisted.length}</strong><span>Still detected</span><small>Matching detector fingerprints</small></div>
          <div className="delta-metric absent"><strong>{comparison.delta.notDetected.length}</strong><span>No longer detected</span><small>Not proof of remediation</small></div>
        </div>
        {comparison.delta.added.length > 0 && <div className="delta-new-findings">
          <strong>New signals to review</strong>
          <ul>{comparison.delta.added.slice(0, 3).map(item =>
            <li key={item.id}><span className={"delta-severity " + item.severity}>{item.severity}</span>
              <span>{item.title} <small>{item.location.path}</small></span></li>)}</ul>
        </div>}
        {(comparison.delta.scopeChanged || !comparison.delta.revisionChanged) &&
          <p className="delta-caution"><Info size={16}/>
            {comparison.delta.scopeChanged
              ? "Scan coverage or inspected-file counts differ. Missing signals may reflect changed scope, not a fix."
              : "Both reports reference the same revision; changes in findings can reflect scanner or advisory updates."}
          </p>}
        <p className="delta-disclaimer"><ShieldCheck size={15}/>
          Based only on stored scans of this repository. Fingerprints are compared, not confirmed exploits or verified fixes.</p>
      </> :
        <div className="delta-baseline">
          <History size={23}/>
          <div><strong>Your first verified baseline</strong>
            <p>Run the agent again after changing your code. Secuvora will compare real findings across saved reports for this repository.</p>
            <p className="delta-data-note">{source === "public"
              ? "Public report history stays in this browser for up to 30 days."
              : "Private comparisons require authorized, retained reports in your GitHub session."}</p>
          </div>
        </div>}
  </section>;
}
