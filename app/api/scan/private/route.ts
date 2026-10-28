import { NextResponse } from "next/server";
import { getGithubSession } from "@/lib/github-auth";
import { authorizePrivateRepo } from "@/lib/github-installations";
import { durableStoreConfigured, enforceSharedQuota, saveUserReport } from "@/lib/durable-reports";
import { parsePublicRepo, scanPublicRepository, ScanError } from "@/lib/public-repo-scanner";
import { isAllowedMutationOrigin, readBoundedJson, RequestBodyError } from "@/lib/api-request-guards";
import type { AssessmentSnapshot } from "@/lib/assessment-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" };

export async function POST(req: Request) {
  if (!isAllowedMutationOrigin(req))
    return NextResponse.json({ error: "Cross-origin requests are denied." }, { status: 403, headers });
  const session = await getGithubSession();
  if (!session) return NextResponse.json({ error: "GitHub sign-in required." }, { status: 401, headers });
  if (!durableStoreConfigured())
    return NextResponse.json({ error: "Secure report storage must be configured before private scanning." }, { status: 503, headers });
  let repo = "";
  try {
    const value = await readBoundedJson(req, 1000);
    if (!value || typeof value !== "object" || !("repo" in value) || typeof value.repo !== "string")
      return NextResponse.json({ error: "Select one authorized repository." }, { status: 400, headers });
    const parsed = parsePublicRepo(value.repo);
    repo = parsed.owner + "/" + parsed.repo;
    if (!(await authorizePrivateRepo(session, repo)))
      return NextResponse.json({ error: "This private repository is not installed and authorized for your GitHub user." }, { status: 403, headers });
    if (!(await enforceSharedQuota("user:" + session.userId, 6)) ||
        !(await enforceSharedQuota("global", 50)))
      return NextResponse.json({ error: "Shared scan quota reached; retry shortly." },
        { status: 429, headers: { ...headers, "Retry-After": "60" } });
  } catch (error) {
    if (error instanceof RequestBodyError)
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    if (error instanceof ScanError)
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    return NextResponse.json({ error: "Could not verify repository access or scan capacity." },
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
          snapshot => { last = snapshot; emit({ type: "snapshot", snapshot }); }, session.token);
        // The durable write MUST succeed before a completion event is delivered.
        await saveUserReport(session.userId, report);
        const snapshot = last as AssessmentSnapshot | null;
        if (snapshot) emit({ type: "snapshot", snapshot: {
          ...snapshot, status: "completed", updatedAt: new Date().toISOString(),
        } });
        emit({ type: "stored", runId: report.runId });
      } catch (error) {
        emit({ type: "error", message: controller.signal.aborted ? "Scan interrupted or timed out." :
          error instanceof Error && /quota|large|limit|storage|repository|source/i.test(error.message)
            ? error.message.slice(0, 250) : "Private scan could not be completed." });
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
