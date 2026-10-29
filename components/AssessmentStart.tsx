"use client";

import Link from "next/link";
import { ArrowLeft, Github, ShieldCheck } from "lucide-react";
import PrivateRepoConnector from "@/components/PrivateRepoConnector";
import ThemeToggle from "@/components/ThemeToggle";
import Brand from "@/components/Brand";

export default function AssessmentStart() {
  return (
    <div className="assess-page connect-page">
      <a href="#connect-main" className="skip-link">Skip to repository selection</a>
      <header className="assess-header connect-header">
        <div className="assess-container assess-header-inner">
          <Brand />
          <span className="connect-header-mark"><span/> SECUVORA · SECURITY AGENT</span>
          <div className="connect-header-actions">
            <ThemeToggle />
            <Link href="/assess/history" className="assess-back"><Github size={16}/> <span>Agent history</span></Link>
            <Link href="/" aria-label="Back to homepage" className="assess-back"><ArrowLeft size={16}/> <span>Back</span></Link>
          </div>
        </div>
      </header>

      <main id="connect-main" className="connect-main">
        <div className="connect-content">
          <div className="connect-step"><span className="connect-step-line"/> 01 / REPOSITORY</div>
          <h1>Choose the codebase to <em>investigate.</em></h1>
          <p className="connect-subtitle">
            Connect GitHub once, then select any repository you have explicitly authorized for Secuvora.
          </p>

          <div className="connect-panel connect-panel-single" id="connect-panel">
            <PrivateRepoConnector/>
          </div>

          <p className="connect-reassurance"><ShieldCheck size={16}/> Read-only access <span/> No source changes</p>
        </div>
      </main>

      <footer className="connect-footer">
        <span>© 2026 Secuvora</span>
        <nav aria-label="Legal links"><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link></nav>
      </footer>
    </div>
  );
}
