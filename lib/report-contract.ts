/**
 * A server-authorized report response, not a client-side entitlement.
 * Do not return any report to a caller who is not authorized to see its run.
 */
export type Severity = "critical" | "high" | "medium" | "low";
export type Confidence = "high" | "medium" | "low";
export type ResultStatus = "complete" | "skipped" | "failed";
export type ReportFinding = {
  id: string;
  /** Stable detector identity; remains the same for the same rule across runs. */
  ruleId?: string;
  ruleEngine?: string;
  severity: Severity;
  title: string;
  category: string;
  confidence: Confidence;
  location: { path: string; line?: number };
  overview: string;
  whyItMatters: string;
  evidence: string;
  redacted: boolean;
  steps: string[];
  verification: string;
  limitations?: string;
};
export type CoverageItem = {
  id: string;
  label: string;
  status: ResultStatus;
  note: string;
};
export type AssessmentReport = {
  runId: string;
  appName: string;
  revision?: string;
  finishedAt: string;
  findings: ReportFinding[];
  coverage: CoverageItem[];
  scopeNote: string;
  /** Scanner-verified scope metrics; omitted in older and illustrative reports. */
  scanMetrics?: { filesInspected: number; eligibleFiles: number; linesInspected: number;
    dependencyVersions: number; rulesExecuted: number };
};

const severities = new Set<Severity>(["critical", "high", "medium", "low"]);
const confidences = new Set<Confidence>(["high", "medium", "low"]);
const outcomes = new Set<ResultStatus>(["complete", "skipped", "failed"]);
const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max = 400): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;

export function isAssessmentReport(value: unknown, runId: string): value is AssessmentReport {
  if (!isObject(value) || value.runId !== runId || !str(value.appName, 140) ||
      !str(value.finishedAt, 60) || !str(value.scopeNote, 600) ||
      (value.revision !== undefined && !str(value.revision, 100))) return false;
  if (!Array.isArray(value.findings) || value.findings.length > 300 ||
      !Array.isArray(value.coverage) || value.coverage.length > 40) return false;
  if (value.scanMetrics !== undefined) {
    const m = value.scanMetrics;
    if (!isObject(m) || !["filesInspected","eligibleFiles","linesInspected","dependencyVersions","rulesExecuted"]
      .every(key => Number.isSafeInteger(m[key]) && Number(m[key]) >= 0 && Number(m[key]) < 10_000_000)) return false;
    if (Number(m.filesInspected) > Number(m.eligibleFiles)) return false;
  }
  const seen = new Set<string>();
  for (const f of value.findings) {
    if (!isObject(f) || !str(f.id, 100) || seen.has(f.id) ||
        !severities.has(f.severity as Severity) ||
        !confidences.has(f.confidence as Confidence) ||
        (f.ruleId !== undefined && !str(f.ruleId, 100)) ||
        (f.ruleEngine !== undefined && !str(f.ruleEngine, 140)) ||
        !str(f.title, 180) || !str(f.category, 100) ||
        !str(f.overview, 1200) || !str(f.whyItMatters, 1500) ||
        !str(f.evidence, 1500) || typeof f.redacted !== "boolean" ||
        !str(f.verification, 1000) ||
        (f.limitations !== undefined && !str(f.limitations, 1000)) ||
        !isObject(f.location) || !str(f.location.path, 300) ||
        (f.location.line !== undefined && (!Number.isInteger(f.location.line) || Number(f.location.line) < 1)) ||
        !Array.isArray(f.steps) || f.steps.length < 1 || f.steps.length > 12 ||
        !f.steps.every((step: unknown) => str(step, 600))) return false;
    seen.add(f.id);
  }
  const coverageKeys = new Set<string>();
  for (const c of value.coverage) {
    if (!isObject(c) || !str(c.id, 100) || coverageKeys.has(c.id) ||
        !str(c.label, 120) || !str(c.note, 700) || !outcomes.has(c.status as ResultStatus)) return false;
    coverageKeys.add(c.id);
  }
  return true;
}

/** Counts are derived from the findings, not supplied as free-floating figures. */
export function severityCounts(findings: ReportFinding[]) {
  return {
    critical: findings.filter(f => f.severity === "critical").length,
    high: findings.filter(f => f.severity === "high").length,
    medium: findings.filter(f => f.severity === "medium").length,
    low: findings.filter(f => f.severity === "low").length,
  };
}

export const SAMPLE_REPORT: AssessmentReport = {
  runId: "SAMPLE-NOT-A-REAL-SCAN",
  appName: "example-application",
  revision: "illustrative-revision",
  finishedAt: "2026-10-28T00:00:00.000Z",
  scopeNote: "Illustrative source and configuration review. This sample is fictional and is not a scan of any repository or live application.",
  findings: [
    {
      id: "EX-001", severity: "critical", title: "Potential credential embedded in client code",
      category: "Secret exposure", confidence: "medium",
      location: { path: "src/lib/client.ts", line: 18 },
      overview: "A pattern resembling an API credential appears in code intended for the browser.",
      whyItMatters: "If a real, active secret is shipped to client-side code, anyone receiving the application bundle could retrieve and misuse it.",
      evidence: "18  const clientToken = \"[REDACTED_SAMPLE_VALUE]\";",
      redacted: true,
      steps: ["Confirm whether the match represents a valid credential.", "If exposed, revoke or rotate the affected credential.", "Move new secrets to server-side protected configuration.", "Inspect repository history and deployed bundles for previous exposure."],
      verification: "Rebuild the client bundle, search for secret patterns and verify the rotated credential is not sent to the browser.",
      limitations: "A pattern match cannot prove that a token was active, exposed or exploitable.",
    },
    {
      id: "EX-002", severity: "high", title: "Dependency version may match an advisory",
      category: "Dependency risk", confidence: "medium",
      location: { path: "package-lock.json", line: 126 },
      overview: "An illustrative dependency is assumed to match a published advisory affecting an older version.",
      whyItMatters: "Known vulnerable library versions may expose affected functionality when vulnerable code paths are reachable.",
      evidence: "126  \"example-package\": \"[ILLUSTRATIVE_OLDER_VERSION]\"",
      redacted: false,
      steps: ["Confirm the real dependency and exact installed version.", "Verify the advisory applies to your environment.", "Upgrade to a supported patched release.", "Run regression tests and rescan the resolved dependency tree."],
      verification: "Confirm the lockfile resolves to a patched release and the affected path is no longer present.",
      limitations: "This sample does not cite a real CVE. Advisory matching and exploitability must be verified against real packages.",
    },
    {
      id: "EX-003", severity: "high", title: "Unvalidated redirect destination",
      category: "Application logic", confidence: "medium",
      location: { path: "src/server/redirect.ts", line: 42 },
      overview: "A redirect destination is derived from a request parameter without a visible allowlist.",
      whyItMatters: "Open redirects can be used in phishing flows and to send users to untrusted destinations through a legitimate-looking link.",
      evidence: "42  return redirect(nextUrl); // SAMPLE ONLY",
      redacted: false,
      steps: ["Parse the destination using a safe URL parser.", "Restrict redirects to allowed local paths or trusted hosts.", "Reject unsupported schemes and external domains.", "Add tests for encoded and protocol-relative destinations."],
      verification: "Try external, encoded and protocol-relative URLs and confirm every disallowed destination is rejected.",
      limitations: "Actual impact depends on route exposure, validation elsewhere and how the redirect is used.",
    },
    {
      id: "EX-004", severity: "medium", title: "Session cookie lacks an explicit SameSite policy",
      category: "Session configuration", confidence: "medium",
      location: { path: "src/server/session.ts", line: 27 },
      overview: "An illustrative session-cookie setup omits an explicit SameSite attribute.",
      whyItMatters: "Cookie attributes help limit cross-site requests and can reduce certain cross-site request forgery risks.",
      evidence: "27  cookies.set(\"session\", value, { httpOnly: true });",
      redacted: false,
      steps: ["Set an appropriate SameSite attribute for your authentication flow.", "Use Secure for HTTPS session cookies and review HttpOnly settings.", "Assess whether CSRF tokens are required for state-changing requests."],
      verification: "Inspect Set-Cookie headers in the deployed app and test cross-site authentication flows.",
      limitations: "Browser defaults and framework-level controls may already reduce risk; evaluate the final response.",
    },
    {
      id: "EX-005", severity: "medium", title: "Potentially sensitive data in application logs",
      category: "Data handling", confidence: "low",
      location: { path: "src/server/users.ts", line: 64 },
      overview: "A logging statement may capture more user information than needed for debugging.",
      whyItMatters: "Overly verbose logs can increase the exposure of personal information when diagnostic logs are accessed, exported or retained.",
      evidence: "64  logger.debug(\"profile\", { user: profile });",
      redacted: true,
      steps: ["Identify which user fields are actually emitted.", "Replace object logging with safe, minimal diagnostics.", "Redact personal or secret fields at the logging boundary.", "Review access and retention of existing logs."],
      verification: "Exercise the flow in a test environment and confirm logs do not include personal or secret values.",
      limitations: "The actual sensitivity depends on fields present in the runtime object and logger configuration.",
    },
    {
      id: "EX-006", severity: "low", title: "Debug-mode configuration left enabled",
      category: "Deployment hygiene", confidence: "low",
      location: { path: "config/application.ts", line: 11 },
      overview: "A sample configuration appears to enable verbose debugging by default.",
      whyItMatters: "Verbose diagnostics may reveal internal implementation details or generate unnecessary logs when accidentally used in production.",
      evidence: "11  debug: true, // SAMPLE CONFIGURATION",
      redacted: false,
      steps: ["Use explicit environment-specific defaults.", "Disable verbose debugging in production builds.", "Review logs and error responses for exposed internals."],
      verification: "Inspect production configuration and confirm debug output is disabled in deployed runtime responses.",
      limitations: "This setting alone does not establish a vulnerability; it requires deployment-context validation.",
    },
  ],
  coverage: [
    { id: "access", label: "Source and configuration", status: "complete", note: "Sample application paths and a fictional revision are shown for illustration only." },
    { id: "secrets", label: "Potential secrets", status: "complete", note: "Illustrative pattern matching; example values are redacted or synthetic." },
    { id: "dependencies", label: "Dependency advisories", status: "complete", note: "Illustrative package analysis, without asserting a real published CVE." },
    { id: "patterns", label: "Source security patterns", status: "complete", note: "Sample code/configuration checks; real reachability was not evaluated." },
    { id: "runtime", label: "Authenticated runtime testing", status: "skipped", note: "Not part of this illustrated source-level example." },
  ],
};
