/**
 * The contract between the authenticated scan worker and the scanning UI.
 * This file intentionally does not create scan jobs or inspect repositories.
 * Never serve these fields from an unauthenticated run-id lookup.
 */
export const CHECKS = [
  { key: "access", name: "Source & scope", short: "Establish what can be inspected" },
  { key: "secrets", name: "Credential exposure", short: "Inspect supported secret patterns" },
  { key: "dependencies", name: "Dependency advisories", short: "Match supported packages to advisories" },
  { key: "patterns", name: "Source security patterns", short: "Inspect code and configuration signals" },
  { key: "evidence", name: "Evidence & coverage", short: "Consolidate findings and limitations" },
] as const;

export type CheckKey = (typeof CHECKS)[number]["key"];
export type CheckStatus = "queued" | "running" | "complete" | "skipped" | "failed";
export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AssessmentCheck = {
  key: CheckKey;
  status: CheckStatus;
  detail?: string;
};

export type AssessmentEvent = {
  id: string;
  at: string;
  message: string;
};

export type AssessmentSnapshot = {
  runId: string;
  target: { name: string; revision?: string };
  status: RunStatus;
  updatedAt: string;
  checks: AssessmentCheck[];
  events: AssessmentEvent[];
  /** Optional worker-confirmed progress, not a time-based guess. */
  progress?: { done: number; total: number };
  /** Actual source fetch progress from GitHub, independent of the five check stages. */
  fileProgress?: { loaded: number; total: number };
  error?: string;
};

const allowedKeys = new Set<string>(CHECKS.map(check => check.key));
const allowedCheckStates = new Set<string>(["queued", "running", "complete", "skipped", "failed"]);
const allowedRunStates = new Set<string>(["queued", "running", "completed", "failed", "cancelled"]);
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const shortText = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;

export function isAssessmentSnapshot(value: unknown, expectedId: string): value is AssessmentSnapshot {
  if (!record(value) || value.runId !== expectedId || !record(value.target)) return false;
  if (!shortText(value.target.name, 140) || !allowedRunStates.has(String(value.status))) return false;
  if (!shortText(value.updatedAt, 80)) return false;
  if (value.target.revision !== undefined && !shortText(value.target.revision, 80)) return false;
  if (value.error !== undefined && !shortText(value.error, 350)) return false;
  if (!Array.isArray(value.checks) || value.checks.length > CHECKS.length) return false;
  if (!value.checks.every((check: unknown) => record(check) &&
    allowedKeys.has(String(check.key)) &&
    allowedCheckStates.has(String(check.status)) &&
    (check.detail === undefined || shortText(check.detail, 220)))) return false;
  if (new Set(value.checks.map((check: AssessmentCheck) => check.key)).size !== value.checks.length) return false;
  if (!Array.isArray(value.events) || value.events.length > 30 ||
    !value.events.every((event: unknown) => record(event) &&
      shortText(event.id, 90) && shortText(event.at, 80) &&
      shortText(event.message, 300))) return false;
  if (value.fileProgress !== undefined) {
    const f = value.fileProgress;
    if (!record(f) || !Number.isInteger(f.loaded) || !Number.isInteger(f.total) ||
      (f.total as number) < 1 || (f.total as number) > 100000 ||
      (f.loaded as number) < 0 || (f.loaded as number) > (f.total as number)) return false;
  }
  if (value.progress !== undefined) {
    const p = value.progress;
    if (!record(p) || typeof p.done !== "number" || typeof p.total !== "number" ||
      !Number.isInteger(p.done) || !Number.isInteger(p.total) ||
      (p.done as number) < 0 || (p.total as number) < 1 ||
      (p.done as number) > (p.total as number) || (p.total as number) > 1000) return false;
  }
  return true;
}
