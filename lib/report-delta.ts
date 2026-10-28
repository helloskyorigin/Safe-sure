import type { AssessmentReport, ReportFinding } from "@/lib/report-contract";

/**
 * Comparisons are between verified report snapshots of the SAME repository.
 * "No longer detected" is deliberately not a claim that a vulnerability was fixed:
 * scanner coverage, file eligibility and the source revision can change.
 */
export type ReportDelta = {
  added: ReportFinding[];
  persisted: ReportFinding[];
  notDetected: ReportFinding[];
  scopeChanged: boolean;
  revisionChanged: boolean;
};

export function compareAssessmentReports(
  current: AssessmentReport,
  previous: AssessmentReport,
): ReportDelta | null {
  if (current.runId === previous.runId ||
    current.appName.toLowerCase() !== previous.appName.toLowerCase()) return null;

  const before = new Set(previous.findings.map(item => item.id));
  const after = new Set(current.findings.map(item => item.id));
  const coverage = (report: AssessmentReport) => new Map(
    report.coverage.map(item => [item.id, item.status] as const),
  );
  const a = coverage(current);
  const b = coverage(previous);
  const changedChecks = a.size !== b.size ||
    [...a].some(([id, status]) => b.get(id) !== status);
  const currentMetrics = current.scanMetrics;
  const previousMetrics = previous.scanMetrics;
  const changedScope = changedChecks ||
    !currentMetrics || !previousMetrics ||
    currentMetrics.filesInspected !== previousMetrics.filesInspected ||
    currentMetrics.eligibleFiles !== previousMetrics.eligibleFiles ||
    currentMetrics.dependencyVersions !== previousMetrics.dependencyVersions;

  return {
    added: current.findings.filter(item => !before.has(item.id)),
    persisted: current.findings.filter(item => before.has(item.id)),
    notDetected: previous.findings.filter(item => !after.has(item.id)),
    scopeChanged: changedScope,
    revisionChanged: current.revision !== previous.revision,
  };
}
