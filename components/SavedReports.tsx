"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, CheckCircle2, FileCode2, Github,
  HardDrive, LockKeyhole, RefreshCw, ShieldCheck, Trash2,
} from "lucide-react";
import {
  deletePublicReport, listPublicReports, type LocalReportSummary,
} from "@/lib/browser-report-history";

type PrivateReportSummary = {
  runId: string;
  appName: string;
  finishedAt: string;
  findings: number;
  revision?: string;
};

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "Date unavailable" :
    parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function SavedReports() {
  const [publicReports, setPublicReports] = useState<LocalReportSummary[]>([]);
  const [privateReports, setPrivateReports] = useState<PrivateReportSummary[]>([]);
  const [privateStatus, setPrivateStatus] = useState<"loading" | "signed-out" | "offline" | "ready">("loading");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Public history never depends on GitHub sign-in or a Redis connection.
    setPublicReports(listPublicReports());
    setError("");
    setPrivateStatus("loading");
    try {
      const response = await fetch("/api/reports", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) {
        setPrivateReports([]);
        setPrivateStatus("signed-out");
        return;
      }
      if (!response.ok) {
        setPrivateReports([]);
        setPrivateStatus("offline");
        return;
      }
      const data = await response.json() as { reports?: PrivateReportSummary[] };
      setPrivateReports(Array.isArray(data.reports) ? data.reports : []);
      setPrivateStatus("ready");
    } catch {
      setPrivateStatus("offline");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function removePublic(item: LocalReportSummary) {
    if (!window.confirm("Delete your saved public report for " + item.appName + "?")) return;
    deletePublicReport(item.runId);
    setPublicReports(listPublicReports());
  }

  async function removePrivate(item: PrivateReportSummary) {
    if (!window.confirm("Delete the private report for " + item.appName + "? This cannot be undone.")) return;
    setDeleting(item.runId);
    try {
      const response = await fetch("/api/assessments/" + encodeURIComponent(item.runId) + "/report", {
        method: "DELETE", credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Unable to delete your private report.");
      setPrivateReports(items => items.filter(x => x.runId !== item.runId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete private report.");
    } finally { setDeleting(null); }
  }

  function ReportRow({ item, kind }: {
    item: LocalReportSummary | PrivateReportSummary;
    kind: "public" | "private";
  }) {
    const url = "/assess/results?" + (kind === "public" ? "local=" : "run=") + encodeURIComponent(item.runId);
    return <div className="history-report-row" key={kind + item.runId}>
      <span className="history-report-icon">
        {kind === "public" ? <FileCode2 size={19}/> : <LockKeyhole size={19}/>}
      </span>
      <div className="history-report-info">
        <strong>{item.appName}</strong>
        <p>{formatDate(item.finishedAt)} <span aria-hidden="true">·</span> {item.findings} candidate {item.findings === 1 ? "finding" : "findings"}</p>
      </div>
      <div className="history-row-actions">
        <Link href={url} className="history-open">Open report <ArrowRight size={15}/></Link>
        <Link href={"/assess/scanning?" + (kind === "public" ? "repo=" : "private=") + encodeURIComponent(item.appName)}
          className="history-rescan"><RefreshCw size={14}/> Rescan</Link>
      </div>
      <button type="button" className="history-delete" aria-label={"Delete report for " + item.appName}
        disabled={deleting === item.runId}
        onClick={() => { if (kind === "public") void removePublic(item as LocalReportSummary);
          else void removePrivate(item); }}>
        <Trash2 size={16}/>
      </button>
    </div>;
  }

  return <div className="assess-page history-page">
    <header className="assess-header"><div className="assess-container assess-header-inner">
      <Link href="/" className="brand" aria-label="Secuvora home">secuvora<span>.</span></Link>
      <Link className="assess-back" href="/assess"><ArrowLeft size={15}/> New investigation</Link>
    </div></header>

    <main className="assess-container history-main">
      <div className="history-top">
        <div><p className="history-eyebrow"><ShieldCheck size={15}/> SAVED INVESTIGATIONS</p>
          <h1>Investigations<span>.</span></h1>
          <p>Revisit previous agent investigations. No paywall, no unnecessary dashboard.</p>
        </div>
        <button type="button" onClick={() => void load()} className="history-refresh">
          <RefreshCw size={15}/> Refresh
        </button>
      </div>

      <section className="history-group" aria-labelledby="public-history-heading">
        <div className="history-group-heading">
          <div className="history-group-label"><HardDrive size={19}/><h2 id="public-history-heading">Public investigations</h2></div>
          <span>{publicReports.length} saved</span>
        </div>
        <p className="history-hint">Saved only in this browser, for up to 30 days. Clearing site data deletes them.</p>
        {publicReports.length ? publicReports.map(item => <ReportRow key={item.runId} item={item} kind="public"/>) :
          <div className="history-empty"><CheckCircle2 size={21}/><span>No agent reports saved yet.</span>
            <Link href="/assess">Start an investigation <ArrowRight size={15}/></Link></div>}
      </section>

      <section className="history-group" aria-labelledby="private-history-heading">
        <div className="history-group-heading">
          <div className="history-group-label"><Github size={19}/><h2 id="private-history-heading">Private investigations</h2></div>
          <span>{privateStatus === "ready" ? privateReports.length + " saved" : "GitHub account"}</span>
        </div>
        <p className="history-hint">Only your authorized GitHub private reports are retrieved from encrypted server storage, when configured.</p>
        {privateStatus === "loading" && <p className="history-status" role="status">Checking your private reports…</p>}
        {privateStatus === "signed-out" && <p className="history-status">
          GitHub sign-in required to view private reports. <Link href="/assess">Connect GitHub <ArrowRight size={14}/></Link>
        </p>}
        {privateStatus === "offline" && <p className="history-status">Private report storage is not configured or temporarily unavailable.</p>}
        {privateStatus === "ready" && (privateReports.length
          ? privateReports.map(item => <ReportRow key={item.runId} item={item} kind="private"/>)
          : <p className="history-status">No private agent reports saved yet.</p>)}
      </section>
      {error && <p role="alert" className="history-error">{error}</p>}
      <p className="history-bottom"><ShieldCheck size={15}/> Your browser history is local; private GitHub report access remains account-protected.</p>
    </main>
  </div>;
}
