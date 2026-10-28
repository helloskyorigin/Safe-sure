"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { isAssessmentReport } from "@/lib/report-contract";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCheck,
  CircleAlert, CircleCheck, CircleDashed, Clock3, Code2, FileSearch, Fingerprint,
  GitBranch, Github, KeyRound, Layers3, LockKeyhole, OctagonX,
  PauseCircle, Radar, RefreshCw, ScanLine, ShieldCheck, ShieldQuestion,
  Square, TerminalSquare,
} from "lucide-react";
import {
  CHECKS,
  isAssessmentSnapshot,
  type AssessmentSnapshot,
  type CheckKey,
  type CheckStatus,
} from "@/lib/assessment-contract";

type LoadState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "invalid" }
  | { type: "unavailable" }
  | { type: "error"; message: string }
  | { type: "live"; snapshot: AssessmentSnapshot };

const checkExplanations: Record<CheckKey, { headline: string; overview: string; capability: string; limitation: string }> = {
  access: {
    headline: "Define the surface, before the signal.",
    overview: "Confirm the exact authorized source and revision being assessed. Unsupported or inaccessible content must be explicitly excluded.",
    capability: "Selected scope, supported files and available manifests.",
    limitation: "No invasive tests or assumptions about code we cannot inspect.",
  },
  secrets: {
    headline: "Credentials belong outside your code.",
    overview: "Inspect supported source patterns for accidentally included tokens or keys. Candidate matches require verification and careful redaction.",
    capability: "Supported credential patterns, with evidence masked.",
    limitation: "Pattern matches do not prove a token is active or exploitable.",
  },
  dependencies: {
    headline: "Know the risk in what you depend on.",
    overview: "Associate detected supported package versions with published vulnerability advisories and relevant dependency metadata.",
    capability: "Supported manifests, pinned versions and known advisories.",
    limitation: "An advisory match alone does not prove an exploitable code path.",
  },
  patterns: {
    headline: "Look for dangerous assumptions.",
    overview: "Inspect supported code and configuration patterns for issues that warrant a closer technical review.",
    capability: "Defined source-level and configuration checks.",
    limitation: "Cannot replace manual testing or fully evaluate runtime behavior.",
  },
  evidence: {
    headline: "Turn raw signals into decisions.",
    overview: "Consolidate findings with affected locations, stated limitations and a clear record of checks that could not be completed.",
    capability: "Evidence, scope, check outcomes and actionable context.",
    limitation: "No tool can certify that an application is free of vulnerabilities.",
  },
};

const icons = {
  access: GitBranch,
  secrets: KeyRound,
  dependencies: Layers3,
  patterns: Code2,
  evidence: ShieldCheck,
} as const;

const terminal = new Set(["completed", "failed", "cancelled"]);

function checkText(status: CheckStatus) {
  if (status === "complete") return "Complete";
  if (status === "running") return "Inspecting";
  if (status === "failed") return "Failed";
  if (status === "skipped") return "Not covered";
  return "Waiting";
}

function timeText(value: string) {
  const stamp = new Date(value);
  return Number.isFinite(stamp.getTime())
    ? stamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Time unavailable";
}

export default function ScanningConsole() {
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const [load, setLoad] = useState<LoadState>({ type: "idle" });
  const [selected, setSelected] = useState<CheckKey>("access");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const runRef = useRef<string | null>(null);
  const localAbortRef = useRef<AbortController | null>(null);
  const [localReportId, setLocalReportId] = useState<string | null>(null);
  const [publicRepoName, setPublicRepoName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const publicRepo = params.get("repo");
    if (publicRepo) {
      setPublicRepoName(publicRepo);
      if (!/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(publicRepo)) {
        setLoad({ type: "invalid" }); return;
      }
      let stopped = false;
      const controller = new AbortController();
      localAbortRef.current = controller;
      setLoad({ type: "loading" });
      setLocalReportId(null);
      async function streamPublicScan() {
        try {
          const response = await fetch("/api/scan/public", {
            method: "POST", cache: "no-store", credentials: "same-origin",
            signal: controller.signal, headers: { "content-type": "application/json" },
            body: JSON.stringify({ repo: publicRepo }),
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({})) as { error?: string };
            throw new Error(payload.error || "Scan request failed (HTTP " + response.status + ").");
          }
          if (!response.body) throw new Error("The scanner returned no event stream.");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let pending = "", sawReport = false, lastId = "";
          let completedId: string | null = null;
          function handle(line: string) {
            if (!line.trim() || stopped) return;
            const packet: unknown = JSON.parse(line);
            if (!packet || typeof packet !== "object" || !("type" in packet)) return;
            const event = packet as { type: string; snapshot?: unknown; report?: unknown; message?: unknown };
            if (event.type === "snapshot" && event.snapshot && typeof event.snapshot === "object" &&
              "runId" in event.snapshot && typeof event.snapshot.runId === "string" &&
              isAssessmentSnapshot(event.snapshot, event.snapshot.runId)) {
              lastId = event.snapshot.runId;
              setLoad({ type: "live", snapshot: event.snapshot });
            }
            if (event.type === "error") throw new Error(typeof event.message === "string" ? event.message : "The scan failed.");
            if (event.type === "report") {
              if (!lastId || !isAssessmentReport(event.report, lastId)) throw new Error("The scanner returned an invalid report.");
              try {
                sessionStorage.setItem("shipsafe:report:" + lastId, JSON.stringify(event.report));
              } catch {
                throw new Error("Could not keep the report in this browser tab. Free tab storage or allow session storage and scan again.");
              }
              sawReport = true;
              completedId = lastId;
              setLocalReportId(lastId);
            }
          }
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            pending += decoder.decode(value, { stream: true });
            if (pending.length > 3_000_000) throw new Error("Scan stream exceeded the size limit.");
            const chunks = pending.split("\n");
            pending = chunks.pop() || "";
            for (const line of chunks) handle(line);
          }
          if (pending.trim()) handle(pending);
          if (!sawReport || !completedId) throw new Error("The scan ended without a verified complete report.");
          // Navigation is deliberately gated behind the complete, validated,
          // successfully stored report and clean end of the server stream.
          if (!stopped && !controller.signal.aborted) {
            router.replace("/assess/results?local=" + encodeURIComponent(completedId));
          }
        } catch (error) {
          if (stopped) return;
          const message = controller.signal.aborted ? "Scan cancelled. No report was created." :
            error instanceof Error ? error.message : "Scan failed.";
          setLoad({ type: "error", message });
        } finally {
          if (localAbortRef.current === controller) localAbortRef.current = null;
        }
      }
      void streamPublicScan();
      return () => { stopped = true; controller.abort(); if (localAbortRef.current === controller) localAbortRef.current = null; };
    }
    // Private run statuses require a separate authenticated job backend.
    const raw = new URLSearchParams(window.location.search).get("run");
    if (!raw) {
      setLoad({ type: "idle" });
      return;
    }
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(raw)) {
      setLoad({ type: "invalid" });
      return;
    }

    runRef.current = raw;
    let stopped = false;
    let timer: number | undefined;
    let controller: AbortController | undefined;
    setLoad({ type: "loading" });

    async function poll() {
      if (stopped) return;
      controller = new AbortController();
      let shouldContinue = true;
      try {
        const response = await fetch("/api/assessments/" + encodeURIComponent(raw!), {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
          headers: { "Accept": "application/json" },
        });
        if (stopped) return;
        if (response.status === 503 || response.status === 501) {
          setLoad({ type: "unavailable" });
          shouldContinue = false;
        } else if (response.status === 401 || response.status === 403 || response.status === 404) {
          setLoad({ type: "error", message: "This assessment is not accessible. Return to the connection screen to begin a new authorized run." });
          shouldContinue = false;
        } else if (!response.ok) {
          setLoad({ type: "error", message: "Could not refresh the scan status. Please try reloading this page." });
        } else {
          const payload: unknown = await response.json();
          if (!isAssessmentSnapshot(payload, raw!)) {
            setLoad({ type: "error", message: "The assessment service returned an invalid status. No progress has been assumed." });
            shouldContinue = false;
          } else {
            setLoad({ type: "live", snapshot: payload });
            shouldContinue = !terminal.has(payload.status);
          }
        }
      } catch (error) {
        if (stopped || (error instanceof DOMException && error.name === "AbortError")) return;
        setLoad({ type: "error", message: "Connection interrupted. Assessment status could not be verified." });
      } finally {
        if (!stopped && shouldContinue) timer = window.setTimeout(poll, 3500);
      }
    }

    void poll();
    return () => {
      stopped = true;
      controller?.abort();
      if (timer !== undefined) window.clearTimeout(timer);
      runRef.current = null;
    };
  }, []);

  const snapshot = load.type === "live" ? load.snapshot : null;
  const running = snapshot?.status === "running";
  const percent = snapshot?.progress
    ? Math.round((snapshot.progress.done / snapshot.progress.total) * 100)
    : null;
  const checks = useMemo(() => CHECKS.map(check => ({
    ...check,
    status: snapshot?.checks.find(entry => entry.key === check.key)?.status ?? "queued",
    detail: snapshot?.checks.find(entry => entry.key === check.key)?.detail,
  })), [snapshot]);
  const selectedCheck = checks.find(check => check.key === selected)!;
  const explanation = checkExplanations[selected];
  const SelectedIcon = icons[selected];

  async function cancelAssessment() {
    if (localAbortRef.current) {
      localAbortRef.current.abort();
      localAbortRef.current = null;
      setLoad({ type: "error", message: "Scan cancelled. No report was created." });
      return;
    }
    if (!snapshot || !["running", "queued"].includes(snapshot.status) || cancelBusy || !runRef.current) return;
    setCancelBusy(true);
    setActionError("");
    try {
      const response = await fetch("/api/assessments/" + encodeURIComponent(runRef.current), {
        method: "DELETE",
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setActionError("Cancellation could not be confirmed. The scan may still be running; check its status.");
      } else {
        // The worker must confirm cancellation in the next authenticated status update.
        setActionError("Cancellation requested. Waiting for confirmation from the assessment service.");
      }
    } catch {
      setActionError("Could not reach the assessment service to cancel this run.");
    } finally {
      setCancelBusy(false);
    }
  }

  const stateLabel =
    load.type === "live" ? (
      snapshot!.status === "running" ? "Live assessment" :
      snapshot!.status === "completed" ? "Assessment finished" :
      snapshot!.status === "failed" ? "Assessment interrupted" :
      snapshot!.status === "cancelled" ? "Assessment cancelled" : "Queued for assessment"
    ) : load.type === "loading" ? "Preparing source scan" :
      load.type === "invalid" ? "Invalid run reference" :
      load.type === "unavailable" ? "Integration required" :
      load.type === "error" ? "Unable to verify" : "Awaiting authorization";

  return (
    <div className="scan-page">
      <a href="#scan-main" className="skip-link">Skip to inspection</a>
      <header className="scan-nav">
        <div className="scan-container scan-nav-inner">
          <Link href="/" className="brand">shipsafe<span>.</span></Link>
          <div className="scan-nav-center"><span className="scan-nav-spark"/> SECURITY INSPECTION</div>
          <Link className="scan-nav-return" href="/assess"><ArrowLeft size={15}/> <span>Back to connection</span></Link>
        </div>
      </header>

      <main className="scan-container" id="scan-main">
        <nav aria-label="Assessment stages" className="scan-steps">
          <Link href="/assess" className="scan-step scan-step-past"><span>01</span><strong>Connect</strong></Link>
          <div className="scan-step-join" aria-hidden="true"/>
          <span className="scan-step scan-step-current" aria-current="step"><span>02</span><strong>Inspect</strong></span>
          <div className="scan-step-join" aria-hidden="true"/>
          <span className="scan-step scan-step-future"><span>03</span><strong>Report</strong></span>
        </nav>

        <div className="scan-intro">
          <motion.div initial={{ y: reducedMotion ? 0 : 17 }} animate={{ y: 0 }} transition={{ duration: reducedMotion ? 0 : .65 }}>
            <p className="scan-eyebrow"><span/> THE INSPECTION ROOM</p>
            <h1>Under the <em>surface.</em></h1>
            <p className="scan-subtitle">A security assessment should show its work. Every check, every limitation, every signal—without guesswork.</p>
          </motion.div>
          <div className={"scan-state-tag "+(running ? "scan-state-live" : "")} role="status" aria-live="polite">
            <span className="scan-state-dot"/>{stateLabel}
          </div>
        </div>

        <div className="scan-workspace">
          <section className="scan-visual" aria-labelledby="scan-visual-title">
            <div className="scan-panel-top">
              <span><Radar size={16}/> INSPECTION ENGINE</span>
              <span className="scan-panel-ref">{snapshot?.target.name || publicRepoName || "NO SOURCE CONNECTED"}</span>
            </div>

            <div className={"scan-orbit-scene "+(running ? "is-active" : "")} aria-hidden="true">
              <div className="scan-orbit-grid"/>
              <div className="scan-orbit halo-a"/>
              <div className="scan-orbit halo-b"/>
              <div className="scan-orbit halo-c"/>
              <div className="scan-orbit-ring ring-one"/>
              <div className="scan-orbit-ring ring-two"/>
              <div className="scan-orbit-beam"/>
              <div className="scan-orbit-core"><Fingerprint size={52} strokeWidth={1.1}/></div>
              <span className="scan-scene-marker marker-a">01<span/></span>
              <span className="scan-scene-marker marker-b">03<span/></span>
              <span className="scan-scene-marker marker-c">05<span/></span>
            </div>

            <div className="scan-visual-bottom">
              <p className="scan-stage-label">ASSESSMENT STATE</p>
              <h2 id="scan-visual-title">{running ? "Analyzing available signals." :
                snapshot?.status === "completed" ? "The inspection has finished." :
                snapshot?.status === "failed" ? "This inspection was interrupted." :
                snapshot?.status === "cancelled" ? "Inspection cancelled." :
                "Ready when your application is."}</h2>
              <p>{running
                ? "The steps at right reflect verified status received from the assessment service."
                : snapshot?.status === "completed"
                ? "The supported checks have finished. Opening your full report automatically…"
                : load.type === "unavailable"
                ? "The security engine is not configured. A run cannot be started or verified from this preview."
                : load.type === "error"
                ? load.message
                : load.type === "invalid"
                ? "The run reference in this URL is not valid. No application was accessed."
                : load.type === "loading"
                ? publicRepoName ? "Contacting GitHub and preparing a bounded, read-only source scan. No progress is guessed." : "Checking for an authorized assessment record. Nothing is marked complete until confirmed."
                : "Connect an authorized source first. This page shows the inspection interface—not a simulated scan."}</p>

              <div className="scan-progress-box">
                <div className="scan-progress-row">
                  <span><Activity size={15}/> Verified progress</span>
                  <strong>{percent === null ? "—" : percent + "%"}</strong>
                </div>
                <div className="scan-progress-track" role={percent === null ? undefined : "progressbar"}
                  aria-label={percent === null ? undefined : "Assessment progress"}
                  aria-valuenow={percent === null ? undefined : percent}
                  aria-valuemin={percent === null ? undefined : 0}
                  aria-valuemax={percent === null ? undefined : 100}>
                  <motion.div animate={{ width: percent === null ? "0%" : percent + "%" }}
                    transition={{ duration: reducedMotion ? 0 : .65 }} className="scan-progress-fill"/>
                </div>
                <p>{snapshot?.progress ? snapshot.progress.done + " of " + snapshot.progress.total + " worker-reported units complete" : "No progress data received — percentages are never guessed."}</p>
              </div>
              {load.type === "error" && publicRepoName ? (
                <div className="scan-retry-actions">
                  <button type="button" className="scan-primary-link" onClick={() => {
                    window.location.assign("/assess/scanning?repo=" + encodeURIComponent(publicRepoName));
                  }}><RefreshCw size={17}/> Retry this scan <ArrowRight size={17}/></button>
                  <Link className="scan-change-target" href="/assess">Choose another repository</Link>
                </div>
              ) : localReportId && snapshot?.status === "completed" ? (
                <Link className="scan-primary-link" href={"/assess/results?local=" + encodeURIComponent(localReportId)}>
                  <FileSearch size={17}/> View full real results <ArrowRight size={17}/>
                </Link>
              ) : snapshot && (snapshot.status === "running" || snapshot.status === "queued") ? (
                <button type="button" disabled={cancelBusy} className="scan-cancel" onClick={() => void cancelAssessment()}>
                  <Square size={13}/>{cancelBusy ? "Sending request…" : "Cancel assessment"}
                </button>
              ) : (
                <Link className="scan-primary-link" href="/assess">
                  <Github size={17}/> Scan a public repository <ArrowRight size={17}/>
                </Link>
              )}
              {actionError && <p className="scan-action-error" role="alert">{actionError}</p>}
              <p className="scan-honesty"><ShieldCheck size={14}/>{publicRepoName ? "Real read-only public-source checks. No runtime testing or claim of complete security coverage." : "Preview only until a real scan starts. No fabricated findings."}</p>
            </div>
          </section>

          <section className="scan-rail" aria-labelledby="scan-rail-title">
            <div className="scan-rail-top">
              <div><p className="scan-rail-kicker">CHECK-BY-CHECK</p><h2 id="scan-rail-title">Inspection pipeline</h2></div>
              <span className="scan-rail-count">{snapshot ? checks.filter(c => c.status === "complete" || c.status === "skipped").length : "—"} / 05</span>
            </div>
            <div className="scan-check-list">
              {checks.map((check, index) => {
                const Icon = icons[check.key];
                const selectedNow = selected === check.key;
                return (
                  <motion.button key={check.key} type="button" className={"scan-check "+(selectedNow ? "selected " : "")+"status-"+check.status}
                    onClick={() => setSelected(check.key)} aria-pressed={selectedNow}
                    whileHover={reducedMotion ? undefined : { x: 3 }} transition={{ duration: .22 }}>
                    <span className="scan-check-step">{String(index + 1).padStart(2, "0")}</span>
                    <span className="scan-check-icon"><Icon size={18}/></span>
                    <span className="scan-check-body"><strong>{check.name}</strong><small>{check.detail || check.short}</small></span>
                    <span className="scan-check-trailing" aria-label={checkText(check.status)}>
                      {check.status === "complete" ? <CircleCheck size={17}/> :
                        check.status === "failed" ? <OctagonX size={17}/> :
                        check.status === "running" ? <RefreshCw size={17}/> :
                        check.status === "skipped" ? <PauseCircle size={17}/> :
                        <CircleDashed size={17}/>}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <div className="scan-rail-bottom">
              <span className="scan-rail-bottom-icon"><LockKeyhole size={17}/></span>
              <p>Public source is read-only. Private repositories require explicit authorization. Partial coverage stays visible.</p>
            </div>
          </section>
        </div>

        <section className="scan-detail-section" aria-labelledby="scan-detail-heading">
          <div className="scan-detail-head"><div><p className="scan-eyebrow">INSPECT THE INSPECTION</p><h2 id="scan-detail-heading">Understand every layer.</h2></div><span>Choose a check above to explore its purpose</span></div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div className="scan-detail-card" key={selected} initial={reducedMotion ? false : { opacity: .65, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: .3, y: -7 }} transition={{ duration: reducedMotion ? 0 : .26 }}>
              <div className="scan-detail-icon"><SelectedIcon size={25}/></div>
              <div className="scan-detail-copy">
                <p className="scan-detail-overline">{CHECKS.findIndex(c => c.key === selected) + 1} / 5 · ANALYSIS LAYER · {checkText(selectedCheck.status)}</p>
                <h3>{explanation.headline}</h3><p>{explanation.overview}</p>
                <div className="scan-detail-meta">
                  <div><CheckCheck size={17}/><span><strong>Intended coverage</strong>{explanation.capability}</span></div>
                  <div><ShieldQuestion size={17}/><span><strong>Important limitation</strong>{explanation.limitation}</span></div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="scan-activity" aria-labelledby="scan-activity-title">
          <div className="scan-activity-title"><div><span><TerminalSquare size={18}/> ASSESSMENT ACTIVITY</span><h2 id="scan-activity-title">Evidence, not theater.</h2></div><span className="scan-activity-status"><span/>{snapshot ? "Worker updates" : "No events received"}</span></div>
          {snapshot && snapshot.events.length > 0 ? (
            <ol className="scan-events">{snapshot.events.map(event => <li key={event.id}><Clock3 size={16}/><span>{event.message}</span><time dateTime={event.at}>{timeText(event.at)}</time></li>)}</ol>
          ) : <div className="scan-empty-events"><ScanLine size={21}/><p><strong>No assessment activity yet.</strong><span>Verified worker events will appear here once an authorized scan is started.</span></p></div>}
          <div className="scan-activity-foot"><CircleAlert size={15}/><p>ShipSafe is not a security certification. Uncompleted checks, errors and false-positive limitations remain visible to the user.</p></div>
        </section>

        {!publicRepoName && <section className="scan-results-preview">
          <div className="scan-results-preview-icon"><FileSearch size={20}/></div>
          <div><strong>Explore the full results experience</strong><p>Open a complete sample report—with all findings, evidence, and remediation visible. This is not your application's scan.</p></div>
          <Link href="/assess/results">View full sample <ArrowRight size={16}/></Link>
        </section>}

        <section className="scan-footer-cta">
          <div><p className="scan-eyebrow">THE NEXT MILESTONE</p><h2>From inspection to action.</h2><p>Public-repository scans now generate real static findings and full reports. Private-repository authorization and deeper runtime testing remain separate future capabilities.</p></div>
          <Link href="/assess">Return to connection <ArrowUpRight size={17}/></Link>
        </section>
      </main>

      <footer className="scan-footer"><div className="scan-container scan-footer-inner"><Link className="brand" href="/">shipsafe<span>.</span></Link><span>Explicit scope. Explainable evidence.</span><nav aria-label="Footer"><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link><Link href="/terms">Terms</Link></nav></div></footer>
    </div>
  );
}
