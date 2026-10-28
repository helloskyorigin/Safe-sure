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
import {
  CHECKS, isAssessmentSnapshot,
  type AssessmentSnapshot, type CheckKey, type CheckStatus,
} from "@/lib/assessment-contract";

type LoadState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "invalid" }
  | { type: "unavailable" }
  | { type: "error"; message: string }
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
    case "running": return "Scanning";
    case "skipped": return "Skipped";
    case "failed": return "Failed";
    default: return "Waiting";
  }
}

export default function ScanningConsole() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [load, setLoad] = useState<LoadState>({ type: "idle" });
  const [source, setSource] = useState<{ name: string; private: boolean } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const privateRepo = params.get("private");
    const publicRepo = params.get("repo");
    const repo = privateRepo || publicRepo;

    if (repo) {
      setSource({ name: repo, private: Boolean(privateRepo) });
      if (!repoPattern.test(repo)) { setLoad({ type: "invalid" }); return; }

      let stopped = false;
      const controller = new AbortController();
      abortRef.current = controller;
      setLoad({ type: "loading" });
      setSavedId(null);

      async function startScan() {
        try {
          const response = await fetch(privateRepo ? "/api/scan/private" : "/api/scan/public", {
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
              setLoad({ type: "live", snapshot: value });
            } else if (message.type === "error") {
              throw new Error(typeof message.message === "string" ? message.message : "Scan failed.");
            } else if (message.type === "stored" && privateRepo) {
              if (!latestId || message.runId !== latestId || !/^[0-9a-f-]{36}$/i.test(latestId))
                throw new Error("Private report storage was not verified.");
              sawReport = true;
              completedId = latestId;
              setSavedId(latestId);
            } else if (message.type === "report" && !privateRepo) {
              if (!latestId || !isAssessmentReport(message.report, latestId))
                throw new Error("The scanner returned an invalid report.");
              try {
                sessionStorage.setItem("shipsafe:report:" + latestId, JSON.stringify(message.report));
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
          if (!sawReport || !completedId) throw new Error("Scan ended without a complete verified report.");

          // Report is verified and saved before navigation; failed scans never redirect.
          if (!stopped && !controller.signal.aborted) {
            router.replace("/assess/results?" + (privateRepo ? "run=" : "local=") + encodeURIComponent(completedId));
          }
        } catch (error) {
          if (stopped || controller.signal.aborted) return;
          setLoad({ type: "error", message: error instanceof Error ? error.message : "Scan failed." });
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
            setLoad({ type: "error", message: "Scan progress could not be verified." }); repeat = false;
          } else {
            setSource({ name: snapshot.target.name, private: false });
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

  const snapshot = load.type === "live" ? load.snapshot : null;
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
     : snapshot?.status === "completed" ? (savedId ? "Opening your full report…" : "Preparing your full report…")
    : load.type === "loading" ? "Connecting to the scanner…"
    : snapshot?.status === "queued" ? "Waiting for the scanner…"
    : "Analyzing your repository…";
  const stateLabel = isFailure ? "Scan interrupted" :
    isFinishing ? (savedId ? "Opening results" : "Finalizing report") : ongoing ? "Live scanning" :
    snapshot?.status === "completed" ? "Finalizing report" : "Awaiting repository";
  const message = load.type === "error" ? load.message :
    load.type === "invalid" ? "Repository or run reference is invalid." :
    load.type === "unavailable" ? "This scan service is not configured." :
    snapshot?.status === "failed" ? snapshot.error || "The scanner could not finish." :
    snapshot?.status === "cancelled" ? "Scan cancelled." : null;

  async function cancelScan() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
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
      <a href="#scan-main" className="skip-link">Skip to scan</a>
      <header className="scan-nav">
        <div className="scan-container scan-nav-inner">
          <Link href="/" className="brand" aria-label="ShipSafe home">shipsafe<span>.</span></Link>
          <span className="scan-nav-center"><span/> LIVE INSPECTION</span>
          <Link href="/assess" className="scan-nav-return"><ArrowLeft size={16}/> Back</Link>
        </div>
      </header>

      <main className="scan-container scan-main" id="scan-main">
        <motion.section className="scan-card" aria-labelledby="scan-heading"
          initial={reducedMotion ? false : { opacity: 0, y: 13 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : .55 }}>
          <div className={"scan-state-tag" + (isFailure ? " is-error" : "")} role="status" aria-live="polite">
            <span className="scan-state-dot"/>{stateLabel}
          </div>

          <div className={"scan-orbit-scene" + (ongoing && !isFailure ? " is-active" : "")} aria-hidden="true">
            <div className="scan-orbit-ring scan-ring-outer"/>
            <div className="scan-orbit-ring scan-ring-inner"/>
            <div className="scan-orbit-core"><ScanSearch size={44} strokeWidth={1.4}/></div>
          </div>

          <div className="scan-visual-bottom">
            <h1 id="scan-heading">{isFailure ? "Scan interrupted" :
              isFinishing ? (savedId ? "Opening your results" : "Finalizing your report") :
              hasSource ? "Scanning your app" : "Ready to scan"}</h1>
            <p className="scan-repo-name">{source?.name || "No repository selected"}</p>
            {!isFailure && <p className="scan-current-action" aria-live="polite">
              {ongoing && <LoaderCircle size={15} className="scan-inline-spinner"/>}
              {hasSource ? liveDescription : "Select a repository to begin."}
            </p>}
            {message && <p className="scan-error-message" role="alert"><CircleAlert size={16}/>{message}</p>}
          </div>

          <div className="scan-progress">
            <div className="scan-progress-row">
              <span>Scan progress</span>
              <strong>{snapshot?.progress ? snapshot.progress.done + " of " + snapshot.progress.total + " checks" : "—"}</strong>
            </div>
            <div className="scan-progress-track"
              role={percent === null ? undefined : "progressbar"}
              aria-label={percent === null ? undefined : "Assessment progress"}
              aria-valuenow={percent === null ? undefined : percent}
              aria-valuemin={percent === null ? undefined : 0}
              aria-valuemax={percent === null ? undefined : 100}>
              <motion.div className="scan-progress-fill" animate={{ width: percent === null ? "0%" : percent + "%" }}
                transition={{ duration: reducedMotion ? 0 : .45 }}/>
            </div>
            <span className="scan-progress-caption">{count === null ? "Checking backend status…" : count + " / 5 stages resolved"}</span>
          </div>

          <div className="scan-check-list" aria-label="Security checks">
            {checks.map(check => {
              const state = check.status;
              return <div key={check.key} className={"scan-check status-" + state}>
                <span className="scan-check-icon">
                  {state === "complete" ? <CheckCircle2 size={20}/> :
                    state === "running" ? <LoaderCircle size={19} className="scan-inline-spinner"/> :
                    state === "failed" ? <CircleAlert size={20}/> :
                    state === "skipped" ? <Circle size={19}/> : <Circle size={19}/>}
                </span>
                <span className="scan-check-name">{displayNames[check.key]}</span>
                <span className="scan-check-status">{statusName(state)}</span>
              </div>;
            })}
          </div>

          <div className="scan-actions">
            {isFailure && source ? (
              <div className="scan-retry-actions">
                <button className="scan-primary-link" type="button" onClick={() => {
                  window.location.assign("/assess/scanning?" + (source.private ? "private=" : "repo=") + encodeURIComponent(source.name));
                }}><RefreshCw size={17}/> Retry this scan <ArrowRight size={17}/></button>
                <Link href="/assess" className="scan-change-target">Choose another repository</Link>
              </div>
            ) : ongoing && hasSource ? (
              <button className="scan-cancel" type="button" onClick={() => void cancelScan()} disabled={cancelBusy}>
                <Square size={13}/>{cancelBusy ? "Cancelling…" : "Cancel scan"}
              </button>
            ) : isFinishing ? (
              <p className="scan-finishing"><FileCheck2 size={16}/>{savedId ? "Your full report is opening…" : "Preparing your full report…"}</p>
            ) : (
              <Link href="/assess" className="scan-primary-link"><Github size={17}/> Scan a public repository <ArrowRight size={17}/></Link>
            )}
            {actionError && <p role="alert" className="scan-action-error">{actionError}</p>}
            <p className="scan-honesty"><ShieldCheck size={15}/> Read-only scan · Results open automatically</p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
