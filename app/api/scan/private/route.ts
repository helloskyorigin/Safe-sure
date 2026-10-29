import { NextResponse } from "next/server";
import { getGithubSession } from "@/lib/github-auth";
import { authorizeRepository } from "@/lib/github-installations";
import { durableStoreStatus, enforceSharedQuota, fetchUserReport, saveUserReport, verifyDurableStore } from "@/lib/durable-reports";
import { reportSavingSnapshot, storedReportSnapshot } from "@/lib/scan-completion";
import { parsePublicRepo, scanPublicRepository, ScanError } from "@/lib/public-repo-scanner";
import { isAllowedMutationOrigin, readBoundedJson, RequestBodyError } from "@/lib/api-request-guards";
import type { AssessmentSnapshot } from "@/lib/assessment-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" };

export async function POST(req: Request) {
  // Preserve 401 for unauthenticated users; authenticated mutations are then
  // protected against cross-origin requests before any repository access.
  const session = await getGithubSession();
  if (!session) return NextResponse.json({ error: "GitHub sign-in required." }, { status: 401, headers });
  if (!isAllowedMutationOrigin(req))
    return NextResponse.json({ error: "Cross-origin requests are denied." }, { status: 403, headers });
  const storage = durableStoreStatus();
  if (!storage.hasUrl)
    return NextResponse.json({ error: "Secure report storage URL is missing. Add UPSTASH_REDIS_REST_URL and redeploy." }, { status: 503, headers });
  if (!storage.hasToken)
    return NextResponse.json({ error: "Secure report storage token is missing. Add UPSTASH_REDIS_REST_TOKEN and redeploy." }, { status: 503, headers });
  if (!storage.hasSessionSecret)
    return NextResponse.json({ error: "Secure session secret is missing or too short." }, { status: 503, headers });
  const storageCheck = await verifyDurableStore();
  if (!storageCheck.ok)
    return NextResponse.json({ error: "Secure report storage could not be reached. Check the Upstash REST URL/token and redeploy." }, { status: 503, headers });
  let repo = "";
  try {
    const value = await readBoundedJson(req, 1000);
    if (!value || typeof value !== "object" || !("repo" in value) || typeof value.repo !== "string")
      return NextResponse.json({ error: "Select one authorized repository." }, { status: 400, headers });
    const parsed = parsePublicRepo(value.repo);
    repo = parsed.owner + "/" + parsed.repo;
    if (!(await authorizeRepository(session, repo)))
      return NextResponse.json({ error: "This repository is not authorized for the connected GitHub account." }, { status: 403, headers });
    if (!(await enforceSharedQuota("user:" + session.userId, 6)) ||
        !(await enforceSharedQuota("global", 50)))
      return NextResponse.json({ error: "Shared scan quota reached; retry shortly." },
        { status: 429, headers: { ...headers, "Retry-After": "60" } });
  } catch (error) {
    if (error instanceof RequestBodyError)
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    if (error instanceof ScanError)
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    return NextResponse.json({ error: "Could not verify repository access or scan capacity. Check GitHub access and report storage." },
      { status: 503, headers });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);
  const close = () => controller.abort();
  req.signal.addEventListener("abort", close, { once: true });
  const encoder = new TextEncoder();
  let stopped = false;
  const responseStream = new ReadableStream<Uint8Array>({
    async start(out) {
      const emit = (data: unknown) => {
        if (stopped) return;
        try { out.enqueue(encoder.encode(JSON.stringify(data) + "\n")); }
        catch { stopped = true; controller.abort(); }
      };
      let last: AssessmentSnapshot | null = null;
      try {
        const report = await scanPublicRepository(repo, controller.signal,
          snapshot => {
            last = snapshot;
            emit({ type: "snapshot", snapshot: reportSavingSnapshot(snapshot) });
          }, session.token);
        // Never emit completion while persistence is pending. The final security
        // stage includes saving and reading back the report on the owner's key.
        const scanSnapshot = last as AssessmentSnapshot | null;
        await saveUserReport(session.userId, report);
        const persisted = await fetchUserReport(session.userId, report.runId);
        if (!persisted || persisted.runId !== report.runId ||
            persisted.appName.toLowerCase() !== repo.toLowerCase() ||
            persisted.revision !== report.revision)
          throw new Error("Saved report could not be verified.");
        const completed = storedReportSnapshot(scanSnapshot, report, repo);
        emit({ type: "snapshot", snapshot: completed });
        emit({ type: "stored", runId: report.runId });
      } catch (error) {
        emit({ type: "error", message: controller.signal.aborted ? "Scan interrupted or timed out." :
          error instanceof Error && /quota|large|limit|storage|repository|source/i.test(error.message)
            ? error.message.slice(0, 250) : "GitHub repository scan could not be completed." });
      } finally {
        stopped = true;
        clearTimeout(timeout);
        req.signal.removeEventListener("abort", close);
        try { out.close(); } catch { /* disconnected */ }
      }
    },
    cancel() { stopped = true; controller.abort(); },
  });
  return new Response(responseStream, { status: 200,
    headers: { ...headers, "Content-Type": "application/x-ndjson; charset=utf-8", "X-Accel-Buffering": "no" } });
}
