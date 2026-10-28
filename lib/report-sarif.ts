import type { AssessmentReport, ReportFinding } from "@/lib/report-contract";

/**
 * Exports genuine scanner candidates to SARIF 2.1.0 for developer tooling.
 * No fabricated CVSS, execution traces or verified-fix claims. Report evidence
 * is intentionally omitted: SARIF uploads may be shared with CI or GitHub.
 */
function safeRelativeUri(path: string): string | null {
  if (!path || path.startsWith("/") || path.includes("\\") || /[?#\u0000-\u001f\u007f]/.test(path)) return null;
  const parts = path.split("/");
  if (parts.some(part => !part || part === "." || part === "..")) return null;
  return parts.map(encodeURIComponent).join("/");
}

function stableRuleId(finding: ReportFinding): string {
  if (finding.ruleId && /^[A-Za-z0-9_.-]{1,100}$/.test(finding.ruleId)) return finding.ruleId;
  // Legacy reports may lack rule identity. Use unique finding IDs rather than
  // guessing a detector name or conflating separate categories.
  return "SECUVORA-" + finding.id.replace(/[^A-Za-z0-9_.-]/g, "-").slice(0, 85);
}

const sarifLevel = (severity: ReportFinding["severity"]): "error" | "warning" | "note" =>
  severity === "critical" || severity === "high" ? "error" :
    severity === "medium" ? "warning" : "note";

export function reportToSarif(report: AssessmentReport) {
  const findings = report.findings.map(finding => ({
    finding, uri: safeRelativeUri(finding.location.path), ruleId: stableRuleId(finding),
  })).filter((x): x is { finding: ReportFinding; uri: string; ruleId: string } => x.uri !== null);
  const rules = new Map<string, { id: string; shortDescription: { text: string };
    properties: { tags: string[] } }>();
  for (const { finding, ruleId } of findings) if (!rules.has(ruleId)) {
    rules.set(ruleId, {
      id: ruleId,
      shortDescription: { text: finding.title },
      properties: { tags: ["security", "secuvora-candidate"] },
    });
  }

  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: { driver: {
        name: "Secuvora",
        version: "0.1.0",
        informationUri: "https://github.com/helloskyorigin/Safe-sure",
        rules: [...rules.values()],
      } },
      automationDetails: { id: "secuvora/source-review" },
      properties: {
        repository: report.appName,
        revision: report.revision || "unknown",
        sourceScanOnly: true,
        scopeNote: report.scopeNote,
        warning: "Candidate signals from bounded static checks, not confirmed exploits or verified fixes.",
        excludedUnsafeLocations: report.findings.length - findings.length,
      },
      results: findings.map(({ finding, uri, ruleId }) => ({
        ruleId,
        level: sarifLevel(finding.severity),
        message: { text: finding.title + ". " + finding.overview },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri },
            ...(finding.location.line ? { region: { startLine: finding.location.line } } : {}),
          },
        }],
        properties: {
          findingId: finding.id,
          severity: finding.severity,
          confidence: finding.confidence,
          category: finding.category,
          remediation: finding.steps,
          verification: finding.verification,
          limitations: finding.limitations || report.scopeNote,
          candidateNotConfirmed: true,
        },
      })),
    }],
  };
}
