import type { AssessmentReport, ReportFinding, Severity } from "@/lib/report-contract";

const severityRank: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** Display high-priority findings first, preserving scanner order within a level. */
export function priorityFindings(findings: ReportFinding[]): ReportFinding[] {
  return [...findings].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

/** Human-review remediation plan generated only from actual report fields. No AI patches are implied. */
export function remediationMarkdown(report: AssessmentReport, sample: boolean): string {
  const heading = sample ? "ILLUSTRATIVE SAMPLE - NOT A REAL SCAN" : "SOURCE SECURITY ASSESSMENT";
  const lines = [
    "# Secuvora - Security Remediation Plan",
    "",
    "**" + heading + "**",
    "",
    "Repository: " + report.appName,
    "Revision: " + (report.revision || "not available"),
    "Completed: " + report.finishedAt,
    "Candidate findings: " + report.findings.length,
    "",
    "> This plan assembles scanner-provided guidance. It does not edit the repository,",
    "> generate verified patches, establish exploitability or certify security.",
    "",
    "## Assessment scope",
    report.scopeNote,
    "",
    "## What was checked",
    ...report.coverage.flatMap(item => [
      "- **" + item.label + "** (" + item.status.toUpperCase() + "): " + item.note,
    ]),
    "",
    "## Findings and fix plan",
  ];
  if (report.findings.length === 0) {
    lines.push("", "No findings were detected by the supported checks. This does not prove the repository is secure.");
  }
  for (const [index, finding] of priorityFindings(report.findings).entries()) {
    lines.push(
      "",
      "### " + (index + 1) + ". [" + finding.severity.toUpperCase() + "] " + finding.title,
      "",
      "ID: " + finding.id + " | Confidence: " + finding.confidence,
      "File: " + finding.location.path + (finding.location.line ? ":" + finding.location.line : ""),
      "",
      finding.overview,
      "",
      "**Evidence (as provided by scanner):**",
      "~~~text",
      finding.evidence.replace(/~~~/g, "---"),
      "~~~",
      "",
      "**Why it matters:** " + finding.whyItMatters,
      "",
      "**Recommended review and remediation:**",
      ...finding.steps.map(step => "- [ ] " + step),
      "",
      "**How to verify:** " + finding.verification,
      "**Limitations:** " + (finding.limitations || "See the assessment scope."),
    );
  }
  return lines.join("\n") + "\n";
}

/** Link only to a verified git revision on GitHub; never interpret arbitrary report strings as URLs. */
export function githubSourceUrl(report: AssessmentReport, path: string, line?: number): string | null {
  const match = /^([a-zA-Z0-9-]{1,39})\/([a-zA-Z0-9_.-]{1,100})$/.exec(report.appName);
  if (!match || !/^[a-f0-9]{40}$/i.test(report.revision || "")) return null;
  if (!path || path.startsWith("/") || path.includes("\\") || path.split("/").some(part => !part || part === "." || part === "..")) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return "https://github.com/" + match[1] + "/" + match[2] + "/blob/" + report.revision + "/" + encoded +
    (line && Number.isSafeInteger(line) && line > 0 ? "#L" + line : "");
}
