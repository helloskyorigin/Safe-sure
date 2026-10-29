import { CHECKS, type AssessmentCheck, type AssessmentSnapshot } from "@/lib/assessment-contract";
import type { AssessmentReport } from "@/lib/report-contract";

const resolved = new Set<AssessmentCheck["status"]>(["complete", "skipped", "failed"]);

/**
 * The last security stage includes durable report persistence. It must not
 * appear finished while encrypted storage is still pending.
 */
export function reportSavingSnapshot(snapshot: AssessmentSnapshot): AssessmentSnapshot {
  const checks = snapshot.checks.map(check =>
    check.key === "evidence" && check.status === "complete"
      ? { ...check, status: "running" as const } : check);
  const done = checks.filter(check => resolved.has(check.status)).length;
  return {
    ...snapshot, status: "running",
    checks,
    progress: { done, total: CHECKS.length },
  };
}

/**
 * Emit completion only when the real scan ended, every bounded check resolved,
 * and a valid report was durably saved and fetched back by the same owner.
 */
export function storedReportSnapshot(
  snapshot: AssessmentSnapshot | null, report: AssessmentReport, repo: string,
): AssessmentSnapshot {
  if (!snapshot || snapshot.runId !== report.runId ||
      snapshot.target.name.toLowerCase() !== repo.toLowerCase() ||
      report.appName.toLowerCase() !== repo.toLowerCase() ||
      snapshot.checks.length !== CHECKS.length ||
      !CHECKS.every(({ key }) => snapshot.checks.some(check => check.key === key && resolved.has(check.status))) ||
      snapshot.checks.some(check => check.key === "evidence" && check.status !== "complete")) {
    throw new Error("Scan stages were not fully resolved; report completion was not verified.");
  }
  const lastEvent = snapshot.events.at(-1);
  const events = [
    ...snapshot.events.slice(-24),
    {
      id: String(Number(lastEvent?.id || "0") + 1),
      at: new Date().toISOString(),
      message: "Encrypted report saved and verified for this GitHub account",
    },
  ];
  return {
    ...snapshot, status: "completed", updatedAt: new Date().toISOString(),
    progress: { done: CHECKS.length, total: CHECKS.length },
    events,
  };
}
