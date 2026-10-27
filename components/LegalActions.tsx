"use client";

import { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";

export default function LegalActions() {
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="legal-actions">
      <button type="button" onClick={() => window.print()}><Printer size={15} aria-hidden="true"/> Print page</button>
      <button type="button" onClick={copyLink}><span aria-live="polite">{copied ? <Check size={15} aria-hidden="true"/> : <Copy size={15} aria-hidden="true"/>}</span>{copied ? "Link copied" : "Copy link"}</button>
    </div>
  );
}
