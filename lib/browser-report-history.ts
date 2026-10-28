import { isAssessmentReport, type AssessmentReport } from "@/lib/report-contract";

const INDEX = "shipsafe:public-history:v1";
const REPORT_PREFIX = "shipsafe:public-report:v1:";
const SESSION_PREFIX = "shipsafe:report:";
const LIMIT = 12;
const TTL_MS = 30 * 24 * 60 * 60;
const UUID = /^[0-9a-f-]{36}$/i;

export type LocalReportSummary = {
  runId: string;
  appName: string;
  finishedAt: string;
  findings: number;
  revision?: string;
  savedAt: number;
};

function readIndex(): LocalReportSummary[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(INDEX) || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is LocalReportSummary => !!x && typeof x === "object" &&
      typeof x.runId === "string" && UUID.test(x.runId) &&
      typeof x.appName === "string" && typeof x.finishedAt === "string" &&
      typeof x.findings === "number" && typeof x.savedAt === "number");
  } catch { return []; }
}

function persistIndex(summaries: LocalReportSummary[]) {
  localStorage.setItem(INDEX, JSON.stringify(summaries));
}

/**
 * Public repository reports belong to the current browser profile, not a
 * cloud account. Any other script on this origin could read localStorage.
 * No private reports or GitHub tokens are written here.
 */
export function savePublicReport(report: AssessmentReport): boolean {
  if (!UUID.test(report.runId) || !isAssessmentReport(report, report.runId)) return false;
  const data = JSON.stringify(report);
  if (data.length > 450_000) return false;
  try {
    localStorage.setItem(REPORT_PREFIX + report.runId, data);
    const old = readIndex().filter(x => x.runId !== report.runId);
    const next: LocalReportSummary[] = [{
      runId: report.runId, appName: report.appName, finishedAt: report.finishedAt,
      findings: report.findings.length, revision: report.revision, savedAt: Date.now(),
    }, ...old].slice(0, LIMIT);
    const kept = new Set(next.map(x => x.runId));
    for (const removed of old) if (!kept.has(removed.runId))
      localStorage.removeItem(REPORT_PREFIX + removed.runId);
    persistIndex(next);
    return true;
  } catch { return false; }
}

export function loadPublicReport(runId: string): AssessmentReport | null {
  if (!UUID.test(runId)) return null;
  for (const source of [localStorage, sessionStorage]) {
    try {
      const raw = source.getItem(source === localStorage ? REPORT_PREFIX + runId : SESSION_PREFIX + runId);
      if (!raw) continue;
      const data: unknown = JSON.parse(raw);
      if (isAssessmentReport(data, runId)) {
        // Transparently migrate legacy tab-only public reports.
        if (source === sessionStorage) savePublicReport(data);
        return data;
      }
    } catch { /* Missing/blocked storage is treated as unavailable. */ }
  }
  return null;
}

export function listPublicReports(): LocalReportSummary[] {
  const current = readIndex();
  const live: LocalReportSummary[] = [];
  let changed = false;
  for (const item of current) {
    if (item.savedAt < Date.now() - TTL_MS ||
        !loadPublicReport(item.runId)) {
      try { localStorage.removeItem(REPORT_PREFIX + item.runId); } catch { /* storage denied */ }
      changed = true;
    } else live.push(item);
  }
  if (changed) try { persistIndex(live); } catch { /* read-only browser */ }
  return live;
}

export function deletePublicReport(runId: string): void {
  if (!UUID.test(runId)) return;
  try {
    localStorage.removeItem(REPORT_PREFIX + runId);
    sessionStorage.removeItem(SESSION_PREFIX + runId);
    persistIndex(readIndex().filter(x => x.runId !== runId));
  } catch { /* blocked storage */ }
}
