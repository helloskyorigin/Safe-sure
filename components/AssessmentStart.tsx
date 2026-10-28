"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Github, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";
import PrivateRepoConnector from "@/components/PrivateRepoConnector";

type AccessMode = "public" | "private";

export default function AssessmentStart() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState<AccessMode | null>("public");
  const [publicRepo, setPublicRepo] = useState("");
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Return from GitHub OAuth should open the private selector, not the choice screen.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.has("connected") || query.has("auth_error")) setMode("private");
  }, []);

  function choose(next: AccessMode) {
    setMode(current => current === next ? current : next);
    setError("");
  }

  function submitPublic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = publicRepo.trim().replace(/\/+$/, "").replace(/\.git$/i, "");
    const match = /^(?:(?:https:\/\/)?(?:www\.)?github\.com\/)?([A-Za-z0-9-]{1,39})\/([A-Za-z0-9_.-]{1,100})$/i.exec(value);
    if (!match || match[1].startsWith("-") || !/^[a-zA-Z0-9]/.test(match[2])) {
      setError("Enter a valid GitHub URL, for example github.com/owner/repo.");
      return;
    }
    setError("");
    router.push("/assess/scanning?repo=" + encodeURIComponent(match[1] + "/" + match[2]));
  }

  return (
    <div className="assess-page connect-page">
      <a href="#connect-main" className="skip-link">Skip to repository connection</a>
      <header className="assess-header connect-header">
        <div className="assess-container assess-header-inner">
          <Link href="/" className="brand" aria-label="Secuvora home">secuvora<span>.</span></Link>
          <span className="connect-header-mark"><span/> SECUVORA · SECURITY AGENT</span>
          <div className="connect-header-actions">
            <Link href="/assess/history" className="assess-back"><Github size={16}/> <span>Agent history</span></Link>
            <Link href="/" aria-label="Back to homepage" className="assess-back"><ArrowLeft size={16}/> <span>Back</span></Link>
          </div>
        </div>
      </header>

      <main id="connect-main" className="connect-main">
        <div className="connect-content">
          <div className="connect-step"><span className="connect-step-line"/> 01 / CONNECT</div>
          <h1>Find the risks in <em>your repository.</em></h1>
          <p className="connect-subtitle">Paste a public GitHub repository to start a read-only investigation. Get source locations, supported security findings, dependency advisories, and fix guidance in one report.</p>

          <div className="connect-choices" role="group" aria-label="Repository visibility">
            <button type="button" className={"connect-choice" + (mode === "public" ? " selected" : "")}
              aria-pressed={mode === "public"} onClick={() => choose("public")}>
              <span className="connect-choice-icon"><Globe2 size={24} strokeWidth={1.8}/></span>
              <span className="connect-choice-copy"><strong>Public repository</strong><small>No sign-in. Start with a GitHub link.</small></span>
              <span className="connect-choice-end">{mode === "public" ? <Check size={19}/> : <ArrowRight size={18}/>}</span>
            </button>
            <button type="button" className={"connect-choice" + (mode === "private" ? " selected" : "")}
              aria-pressed={mode === "private"} onClick={() => choose("private")}>
              <span className="connect-choice-icon"><LockKeyhole size={23} strokeWidth={1.8}/></span>
              <span className="connect-choice-copy"><strong>Private repository</strong><small>Authorized GitHub access when configured</small></span>
              <span className="connect-choice-end">{mode === "private" ? <Check size={19}/> : <ArrowRight size={18}/>}</span>
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {mode && <motion.div key={mode} ref={panelRef} className="connect-panel" id="connect-panel"
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -7 }}
              transition={{ duration: reducedMotion ? 0 : .25 }}>
              {mode === "public" ? (
                <form onSubmit={submitPublic} className="connect-public-form">
                  <label htmlFor="connect-repo-url">GitHub repository URL</label>
                  <p className="connect-field-hint" id="connect-repo-hint">Paste a public repository URL or owner/repo. No account required.</p>
                  <div className="connect-url-field">
                    <Github size={20}/>
                    <input id="connect-repo-url" name="repository" value={publicRepo}
                      onChange={event => { setPublicRepo(event.target.value); setError(""); }}
                      placeholder="github.com/owner/repo" autoCapitalize="off" autoComplete="off"
                      spellCheck={false} aria-invalid={!!error} aria-describedby={error ? "connect-repo-hint connect-url-error" : "connect-repo-hint"}
                      required autoFocus/>
                  </div>
                  {error && <p className="connect-error" role="alert" id="connect-url-error">{error}</p>}
                  <button type="submit" className="connect-submit">
                    Scan this repository <ArrowRight size={18}/>
                  </button>
                <div className="connect-workflow-note" aria-label="What happens next">
                    <span>01 · Read pinned source</span><span>02 · Check supported risks</span><span>03 · Review the full report</span>
                  </div>
                </form>
              ) : <PrivateRepoConnector/>}
            </motion.div>}
          </AnimatePresence>

          <p className="connect-reassurance"><ShieldCheck size={16}/> Read-only source review <span/> Complete report, free</p>
          <Link className="connect-example-link" href="/assess/results">Explore an illustrative report <ArrowRight size={14} aria-hidden="true"/></Link>
        </div>
      </main>

      <footer className="connect-footer">
        <span>© 2026 Secuvora</span>
        <nav aria-label="Legal links"><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link></nav>
      </footer>
    </div>
  );
}
