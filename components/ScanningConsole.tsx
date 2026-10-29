"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, CircleAlert,
  FileCheck2, Github, LoaderCircle, RefreshCw, ScanSearch,
  ShieldCheck, Square,
} from "lucide-react";
import { isAssessmentReport } from "@/lib/report-contract";
import ThemeToggle from "@/components/ThemeToggle";
import Brand from "@/components/Brand";
import { savePublicReport } from "@/lib/browser-report-history";
import {
  CHECKS, isAssessmentSnapshot,
  type AssessmentSnapshot, type CheckKey, type CheckStatus,
} from "@/lib/assessment-contract";

type LoadState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "invalid" }
  | { type: "unavailable" }
  | { type: "error"; message: string; snapshot?: AssessmentSnapshot }
  | { type: "live"; snapshot: AssessmentSnapshot };

const displayNames: Record<CheckKey, string> = {
  access: "Source access",
  secrets: "Secrets & credentials",
  dependencies: "Dependencies",
  patterns: "Security patterns",
  evidence: "Finalizing report",
};

const terminal = new Set(["completed", "failed", "cancelled"]);
const repoPattern = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/;

function statusName(status: CheckStatus): string {
  switch (status) {
    case "complete": return "Done";
    case "running": return "Checking";
    case "skipped": return "Skipped";
    case "failed": return "Failed";
    default: return "Waiting";
  }
}

export default function ScanningConsole() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [load, setLoad] = useState<LoadState>({ type: "idle" });
  const [source, setSource] = useState<{ name: string; github: boolean } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [restartNote, setRestartNote] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubRepo = params.get("github") || params.get("private"); // "private" kept for old saved links.
    const publicRepo = params.get("repo"); // Legacy direct public-scan links remain readable.
    const repo = githubRepo || publicRepo;
    const usesGithubConnection = Boolean(githubRepo);

    if (repo) {
      setSource({ name: repo, github: usesGithubConnection });
      if (!repoPattern.test(repo)) { setLoad({ type: "invalid" }); return; }

      // The streaming request itself cannot survive a full browser refresh.
      // Preserve the selected repo and safely restart the REAL scan instead of
      // pretending the disconnected server job is still supplying progress.
      const marker = "shipsafe:active-scan:v1";
      try {
        const saved = JSON.parse(sessionStorage.getItem(marker) || "null") as
          { repo?: string; isPrivate?: boolean; timestamp?: number } | null;
        const resumed = !!saved && saved.repo === repo && saved.isPrivate === usesGithubConnection &&
          typeof saved.timestamp === "number" && Date.now() - saved.timestamp < 10 * 60_000;
        setRestartNote(resumed);
        sessionStorage.setItem(marker, JSON.stringify({
          repo, isPrivate: usesGithubConnection, timestamp: Date.now(),
        }));
      } catch { /* Scanning works even if browser storage is disabled. */ }
      let stopped = false;
      const controller = new AbortController();
      abortRef.current = controller;
      setLoad({ type: "loading" });
      setSavedId(null);

      async function startScan() {
        let lastReceivedSnapshot: AssessmentSnapshot | null = null;
        try {
          const response = await fetch(usesGithubConnection ? "/api/scan/private" : "/api/scan/public", {
            method: "POST", cache: "no-store", credentials: "same-origin",
            headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
            body: JSON.stringify({ repo }),
            signal: controller.signal,
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({})) as { error?: string };
            throw new Error(payload.error || "Scanner returned HTTP " + response.status + ".");
          }
          if (!response.body) throw new Error("No scan status stream was received.");

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let pending = "", latestId = "", completedId: string | null = null;
          let sawReport = false;
          let finalized = false;
          function receive(line: string) {
            if (!line.trim() || stopped || controller.signal.aborted) return;
            const raw: unknown = JSON.parse(line);
            if (!raw || typeof raw !== "object" || !("type" in raw)) return;
            const message = raw as { type: string; snapshot?: unknown; report?: unknown; runId?: unknown; message?: unknown };
            if (message.type === "snapshot") {
              const value = message.snapshot;
              if (!value || typeof value !== "object" || !("runId" in value) ||
                  typeof value.runId !== "string" || !isAssessmentSnapshot(value, value.runId))
                throw new Error("Scanner returned an invalid progress update.");
              if (latestId && value.runId !== latestId)
                throw new Error("Scanner switched run IDs unexpectedly.");
              latestId = value.runId;
              if (value.status === "completed") {
                if (value.checks.length !== CHECKS.length ||
                    !CHECKS.every(({ key }) => value.checks.some(check =>
                      check.key === key && ["complete", "skipped", "failed"].includes(check.status))) ||
                    value.progress?.done !== CHECKS.length || value.progress.total !== CHECKS.length) {
                  throw new Error("Scanner reported completion before every stage was resolved.");
                }
                finalized = true;
              }
              lastReceivedSnapshot = value;
              setRestartNote(false);
              setLoad({ type: "live", snapshot: value });
            } else if (message.type === "error") {
              throw new Error(typeof message.message === "string" ? message.message : "Scan failed.");
            } else if (message.type === "stored" && usesGithubConnection) {
              if (!finalized || !latestId || message.runId !== latestId || !/^[0-9a-f-]{36}$/i.test(latestId))
                throw new Error("Connected GitHub report storage was not verified.");
              sawReport = true;
              completedId = latestId;
            } else if (message.type === "report" && !usesGithubConnection) {
              if (!finalized || !latestId || !isAssessmentReport(message.report, latestId))
                throw new Error("The scanner returned an invalid report.");
              try {
                sessionStorage.setItem("shipsafe:report:" + latestId, JSON.stringify(message.report));
                savePublicReport(message.report); // best-effort persistent history; tab report is fallback
              } catch {
                throw new Error("Unable to save the report in this browser tab. Check site storage and retry.");
              }
              sawReport = true;
              completedId = latestId;
              setSavedId(latestId);
            }
          }

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            pending += decoder.decode(value, { stream: true });
            if (pending.length > 3_000_000) throw new Error("Scanner response exceeded its size limit.");
            const lines = pending.split("\n");
            pending = lines.pop() || "";
            for (const line of lines) receive(line);
          }
          pending += decoder.decode();
          if (pending.trim()) receive(pending);
          if (!finalized || !sawReport || !completedId)
            throw new Error("Scan ended before all stages and report persistence were verified.");

          if (usesGithubConnection) {
            // The same authenticated results endpoint must be able to read this
            // report before we navigate. This also catches deployment-key drift.
            const check = await fetch("/api/assessments/" + encodeURIComponent(completedId) + "/report", {
              credentials: "same-origin", cache: "no-store", signal: controller.signal,
            });
            if (!check.ok) throw new Error("Scan finished, but the saved report could not be opened. Retry from Agent history.");
            const persisted: unknown = await check.json();
            if (!isAssessmentReport(persisted, completedId) ||
                persisted.appName.toLowerCase() !== repo!.toLowerCase())
              throw new Error("Saved report did not match the selected repository.");
          }
          if (stopped || controller.signal.aborted) return;
          setSavedId(completedId);
          try { sessionStorage.removeItem(marker); } catch { /* read-only storage */ }

          // Navigate only after all stages resolved and the owner's saved
          // report has been fetched and validated. No time-based auto redirect.
          if (!stopped && !controller.signal.aborted) {
            router.replace("/assess/results?" + (usesGithubConnection ? "run=" : "local=") + encodeURIComponent(completedId));
          }
        } catch (error) {
          if (stopped || controller.signal.aborted) return;
          try { sessionStorage.removeItem(marker); } catch { /* read-only storage */ }
          setLoad({ type: "error", message: error instanceof Error ? error.message : "Scan failed.",
            snapshot: lastReceivedSnapshot || undefined });
        } finally {
          if (abortRef.current === controller) abortRef.current = null;
        }
      }

      void startScan();
      return () => {
        stopped = true;
        controller.abort();
        if (abortRef.current === controller) abortRef.current = null;
      };
    }

    // Legacy run-URL status is deliberately fail-closed unless an authenticated
    // job service implements this endpoint.
    const run = params.get("run");
    if (!run) { setLoad({ type: "idle" }); return; }
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(run)) { setLoad({ type: "invalid" }); return; }
    runRef.current = run;
    let stopped = false;
    let timer: number | undefined;
    let current: AbortController | null = null;
    setLoad({ type: "loading" });

    async function poll() {
      if (stopped) return;
      current = new AbortController();
      let repeat = true;
      try {
        const response = await fetch("/api/assessments/" + encodeURIComponent(run!), {
          method: "GET", credentials: "same-origin", cache: "no-store",
          headers: { Accept: "application/json" }, signal: current.signal,
        });
        if (stopped) return;
        if (response.status === 503 || response.status === 501) {
          setLoad({ type: "unavailable" }); repeat = false;
        } else if (!response.ok) {
          setLoad({ type: "error", message: "This assessment is not accessible." }); repeat = false;
        } else {
          const snapshot: unknown = await response.json();
          if (!isAssessmentSnapshot(snapshot, run!)) {
            setLoad({ type: "error", message: "Agent progress could not be verified." }); repeat = false;
          } else {
            setSource({ name: snapshot.target.name, github: true });
            setLoad({ type: "live", snapshot });
            repeat = !terminal.has(snapshot.status);
          }
        }
      } catch {
        if (!stopped) { setLoad({ type: "error", message: "Unable to reach the scan service." }); repeat = false; }
      } finally {
        if (!stopped && repeat) timer = window.setTimeout(poll, 3500);
      }
    }
    void poll();
    return () => {
      stopped = true;
      current?.abort();
      if (timer !== undefined) window.clearTimeout(timer);
      runRef.current = null;
    };
  }, [router]);

  const snapshot = load.type === "live" ? load.snapshot : load.type === "error" ? load.snapshot || null : null;
  const checks = useMemo(() => CHECKS.map(check => ({
    ...check, status: snapshot?.checks.find(item => item.key === check.key)?.status ?? "queued",
  })), [snapshot]);
  const count = snapshot ? checks.filter(check => ["complete", "skipped", "failed"].includes(check.status)).length : null;
  const percent = snapshot?.progress
    ? Math.round(snapshot.progress.done / snapshot.progress.total * 100)
    : null;
  const ongoing = load.type === "loading" || snapshot?.status === "running" || snapshot?.status === "queued";
  const hasSource = Boolean(source);
  const isFailure = load.type === "error" || load.type === "invalid" || load.type === "unavailable" ||
    snapshot?.status === "failed" || snapshot?.status === "cancelled";
  const isFinishing = snapshot?.status === "completed";
  const latestRunning = checks.find(check => check.status === "running");
  const liveDescription = latestRunning
    ? displayNames[latestRunning.key]
     : snapshot?.status === "completed" ? (savedId ? "Opening your full report…" : "Verifying saved report…")
    : load.type === "loading" ? (restartNote ? "Reconnecting after refresh · starting a new scan…" : "Connecting to the scanner…")
    : snapshot?.status === "queued" ? "Waiting for the scanner…"
    : "Waiting for source analysis…";
  const stateLabel = isFailure ? "Analysis interrupted" :
    isFinishing ? (savedId ? "Opening results" : "Verifying report") : ongoing ? "Analysis in progress" :
    snapshot?.status === "completed" ? "Preparing report" : "Awaiting source";
  const message = load.type === "error" ? load.message :
    load.type === "invalid" ? "Repository or run reference is invalid." :
    load.type === "unavailable" ? "This scan service is not configured." :
    snapshot?.status === "failed" ? snapshot.error || "The scanner could not finish." :
    snapshot?.status === "cancelled" ? "Scan cancelled." : null;

  async function cancelScan() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      try { sessionStorage.removeItem("shipsafe:active-scan:v1"); } catch { /* storage blocked */ }
      setLoad({ type: "error", message: "Scan cancelled in this tab." });
      return;
    }
    if (!runRef.current || !snapshot || cancelBusy) return;
    setCancelBusy(true);
    setActionError("");
    try {
      const response = await fetch("/api/assessments/" + encodeURIComponent(runRef.current), {
        method: "DELETE", credentials: "same-origin", cache: "no-store",
      });
      setActionError(response.ok
        ? "Cancellation requested; waiting for worker confirmation."
        : "Cancellation could not be confirmed.");
    } catch {
      setActionError("Unable to request cancellation.");
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <div className="scan-page">
      <a href="#scan-main" className="skip-link">Skip to analysis</a>
      <header className="scan-nav">
        <div className="scan-container scan-nav-inner">
          <Brand />
          <span className="scan-nav-center"><span/> SECUVORA / ANALYSIS</span>
          <div className="scan-nav-actions"><ThemeToggle/><Link href="/assess" className="scan-nav-return"><ArrowLeft size={16}/> Back</Link></div>
        </div>
      </header>

      <main className="scan-container scan-main" id="scan-main">
        <section className="scan-card" aria-labelledby="scan-heading">
          <div className="scan-step-label">02 / ANALYSIS</div>
          <div className={"scan-state-tag" + (isFailure ? " is-error" : "")} role="status" aria-live="polite">
            <span className="scan-state-dot"/>{stateLabel}
          </div>

          <div className="scan-analysis-icon" aria-hidden="true"><ScanSearch size={29} strokeWidth={1.6}/></div>

          <div className="scan-visual-bottom">
            <h1 id="scan-heading">{isFailure ? "Analysis interrupted" :
              isFinishing ? (savedId ? "Opening your report" : "Preparing your report") :
              hasSource ? "Reviewing security signals" : "Ready to investigate"}</h1>
            <p className="scan-repo-name"><Github size={14} aria-hidden="true"/> <span>{source?.name || "No source selected"}</span></p>
            {hasSource && <p className="scan-source-type">{source?.github ? "Authorized GitHub repository" : "Legacy public repository"} · Read-only</p>}
            {!isFailure && <p className="scan-current-action" aria-live="polite">
              {ongoing && <LoaderCircle size={15} className="scan-inline-spinner"/>}
              {hasSource ? liveDescription : "Select a repository to begin."}
            </p>}
            {message && <p className="scan-error-message" role="alert"><CircleAlert size={16}/>{message}</p>}
          </div>

          <div className="scan-progress">
            <div className="scan-progress-row">
              <span>Stages resolved</span>
              <strong>{snapshot?.progress ? snapshot.progress.done + " / " + snapshot.progress.total : "—"}</strong>
            </div>
            <div className="scan-progress-track"
              role={percent === null ? undefined : "progressbar"}
              aria-label={percent === null ? undefined : "Analysis progress"}
              aria-valuenow={percent === null ? undefined : percent}
              aria-valuemin={percent === null ? undefined : 0}
              aria-valuemax={percent === null ? undefined : 100}>
              <motion.div className="scan-progress-fill" animate={{ width: percent === null ? "0%" : percent + "%" }}
                transition={{ duration: reducedMotion ? 0 : .45 }}/>
            </div>
            <span className="scan-progress-caption">{count === null ? "Waiting for source updates…" : count + " of " + checks.length + " stages resolved"}</span>
          </div>

          <div className="scan-check-list" aria-label="Security checks">
            <div className="scan-check-list-header"><span>CHECKS</span><span>STATUS</span></div>
            {checks.map(check => {
              const state = check.status;
              return <div key={check.key} className={"scan-check status-" + state}>
                <span className="scan-check-icon">
                  {state === "complete" ? <CheckCircle2 size={20}/> :
                    state === "running" ? <LoaderCircle size={19} className="scan-inline-spinner"/> :
                    state === "failed" ? <CircleAlert size={20}/> :
                    state === "skipped" ? <Circle size={19}/> : <Circle size={19}/>}
                </span>
                <span className="scan-check-info"><span className="scan-check-name">{displayNames[check.key]}</span><small>{check.short}</small></span>
                <span className="scan-check-status">{statusName(state)}</span>
              </div>;
            })}
          </div>

          <div className="scan-actions">
            {isFailure && source ? (
              <div className="scan-retry-actions">
                <button className="scan-primary-link" type="button" onClick={() => {
                  window.location.assign("/assess/scanning?" + (source.github ? "github=" : "repo=") + encodeURIComponent(source.name));
                }}><RefreshCw size={17}/> Retry analysis <ArrowRight size={17}/></button>
                <Link href="/assess" className="scan-change-target">Change source</Link>
              </div>
            ) : ongoing && hasSource ? (
              <button className="scan-cancel" type="button" onClick={() => void cancelScan()} disabled={cancelBusy}>
                <Square size={13}/>{cancelBusy ? "Cancelling…" : "Cancel analysis"}
              </button>
            ) : isFinishing ? (
              <p className="scan-finishing"><FileCheck2 size={16}/>{savedId ? "Your full report is opening…" : "Preparing your full report…"}</p>
            ) : (
              <Link href="/assess" className="scan-primary-link"><Github size={17}/> Start a new investigation <ArrowRight size={17}/></Link>
            )}
            {actionError && <p role="alert" className="scan-action-error">{actionError}</p>}
            <p className="scan-honesty"><ShieldCheck size={15}/> Read-only checks · No code execution · Findings require review</p>
          </div>
        </section>
      </main>
    </div>
  );
}
