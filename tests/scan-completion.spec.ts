import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";
import { reportSavingSnapshot, storedReportSnapshot } from "../lib/scan-completion";
import type { AssessmentSnapshot } from "../lib/assessment-contract";

const keys = ["access","secrets","dependencies","patterns","evidence"] as const;
const repo = "owner/authorized-repo";
const report = { ...SAMPLE_REPORT, appName: repo };
const snapshot: AssessmentSnapshot = {
  runId: report.runId, target: { name: repo }, status: "running",
  updatedAt: new Date().toISOString(),
  checks: keys.map(key => ({ key, status: "complete" as const })),
  events: [], progress: { done: 5, total: 5 },
};

test("evidence stage stays running at 4/5 while durable report write is pending", () => {
  const state = reportSavingSnapshot(snapshot);
  expect(state.status).toBe("running");
  expect(state.progress).toEqual({ done: 4, total: 5 });
  expect(state.checks.find(check => check.key === "evidence")?.status).toBe("running");
  expect(snapshot.progress?.done).toBe(5);
  expect(snapshot.checks.at(-1)?.status).toBe("complete");
});

test("100% only follows a fully resolved real snapshot and validated matching report", () => {
  const result = storedReportSnapshot(snapshot, report, repo);
  expect(result.status).toBe("completed");
  expect(result.progress).toEqual({ done: 5, total: 5 });
  expect(result.events.at(-1)?.message).toContain("saved and verified");
});

test("stale, missing or incomplete stages cannot produce a completed report event", () => {
  expect(() => storedReportSnapshot(null, report, repo)).toThrow();
  expect(() => storedReportSnapshot({ ...snapshot, runId: "different" }, report, repo)).toThrow();
  expect(() => storedReportSnapshot(snapshot, report, "other/repo")).toThrow();
  expect(() => storedReportSnapshot({
    ...snapshot, checks: snapshot.checks.filter(check => check.key !== "dependencies"),
  }, report, repo)).toThrow();
  expect(() => storedReportSnapshot({
    ...snapshot, checks: snapshot.checks.map(check => check.key === "evidence"
      ? { ...check, status: "running" as const } : check),
  }, report, repo)).toThrow();
});

test("skipped or failed optional advisory stage stays explicit while final persistence is required", () => {
  const partial = { ...snapshot, checks: snapshot.checks.map(check =>
    check.key === "dependencies" ? { ...check, status: "failed" as const } : check) };
  expect(reportSavingSnapshot(partial).progress?.done).toBe(4);
  expect(storedReportSnapshot(partial, report, repo).checks.find(c => c.key === "dependencies")?.status).toBe("failed");
});
