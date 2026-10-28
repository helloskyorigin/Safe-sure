import { seal, unseal } from "@/lib/github-auth";
import { isAssessmentReport, type AssessmentReport } from "@/lib/report-contract";

const REPORT_TTL = 7 * 24 * 60 * 60;
const RATE_LIMIT_TTL = 60;

export function durableStoreConfigured() {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  return /^https:\/\/[A-Za-z0-9.-]+\/?$/.test(url) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN) &&
    (process.env.SHIPSAFE_SESSION_SECRET?.length || 0) >= 32;
}

export async function redis(...command: (string | number)[]): Promise<unknown> {
  if (!durableStoreConfigured()) throw new Error("Durable report storage is not configured.");
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: "POST", headers: { Authorization: "Bearer " + process.env.UPSTASH_REDIS_REST_TOKEN!,
      "Content-Type": "application/json" },
    body: JSON.stringify(command), cache: "no-store", redirect: "error",
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error("Report storage request failed.");
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("result" in body) || "error" in body)
    throw new Error("Report storage returned an error.");
  return (body as { result: unknown }).result;
}

function reportKey(userId: number, id: string) { return "shipsafe:report:v1:" + userId + ":" + id; }
function listKey(userId: number) { return "shipsafe:reports:v1:" + userId; }

export async function saveUserReport(userId: number, report: AssessmentReport) {
  if (!isAssessmentReport(report, report.runId)) throw new Error("Invalid report: cannot persist.");
  const sealed = seal(JSON.stringify(report)); // authenticated encryption, server-side only
  if (sealed.length > 350000) throw new Error("Report exceeds durable storage limit.");
  await redis("SET", reportKey(userId, report.runId), sealed, "EX", REPORT_TTL);
  await redis("LREM", listKey(userId), 0, report.runId);
  await redis("LPUSH", listKey(userId), report.runId);
  await redis("LTRIM", listKey(userId), 0, 19);
  await redis("EXPIRE", listKey(userId), REPORT_TTL);
}

export async function fetchUserReport(userId: number, id: string): Promise<AssessmentReport | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const value = await redis("GET", reportKey(userId, id));
  if (typeof value !== "string") return null;
  const raw = unseal(value);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAssessmentReport(parsed, id) ? parsed : null;
  } catch { return null; }
}

export async function listUserReports(userId: number) {
  const ids = await redis("LRANGE", listKey(userId), 0, 19);
  if (!Array.isArray(ids)) return [];
  const reports = await Promise.all(ids.filter((id): id is string => typeof id === "string")
    .map(id => fetchUserReport(userId, id).catch(() => null)));
  return reports.filter((r): r is AssessmentReport => r !== null)
    .map(r => ({ runId: r.runId, appName: r.appName, finishedAt: r.finishedAt,
      findings: r.findings.length, revision: r.revision }));
}

export async function deleteUserReport(userId: number, id: string) {
  await redis("DEL", reportKey(userId, id));
  await redis("LREM", listKey(userId), 0, id);
}

/** Atomic fixed-window quota for all API instances sharing the same Upstash Redis. */
export async function enforceSharedQuota(scope: string, max: number) {
  const safe = scope.replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 120);
  const windowId = Math.floor(Date.now() / (RATE_LIMIT_TTL * 1000));
  // INCR + EXPIRE as separate REST calls can leave a never-expiring key if the
  // worker dies between them. One Lua command is atomic across all workers.
  const script = "local n=redis.call('INCR',KEYS[1]); " +
    "if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]); end; return n";
  const count = await redis("EVAL", script, 1,
    "shipsafe:quota:v1:" + safe + ":" + windowId, RATE_LIMIT_TTL * 2);
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 1)
    throw new Error("Invalid quota counter result.");
  return count <= max;
}
