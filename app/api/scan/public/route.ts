import { NextResponse } from "next/server";
import { parsePublicRepo, scanPublicRepository, ScanError } from "@/lib/public-repo-scanner";
import type { AssessmentSnapshot } from "@/lib/assessment-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Best-effort per-instance protection. Production-scale rate limits need a
// shared durable limiter; this does not work across separate serverless workers.
let activeScans = 0;
const MAX_ACTIVE = 2;
const jsonHeaders = { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" };

export async function POST(req: Request) {
  // Same-origin requests only; no cookies or private authorization are used.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    return NextResponse.json({ error: "Cross-origin scan requests are not allowed." }, { status: 403, headers: jsonHeaders });
  if (Number(req.headers.get("content-length") || 0) > 1600)
    return NextResponse.json({ error: "Invalid request size." }, { status: 413, headers: jsonHeaders });
  let repo: string;
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || !("repo" in body) || typeof body.repo !== "string" ||
      body.repo.length > 200) throw new ScanError("Provide one public repository.", 400);
    const { owner, repo: name } = parsePublicRepo(body.repo);
    repo = owner + "/" + name;
  } catch (error) {
    return NextResponse.json({ error: error instanceof ScanError ? error.message : "Invalid scan request." },
      { status: 400, headers: jsonHeaders });
  }
  if (activeScans >= MAX_ACTIVE) return NextResponse.json(
    { error: "Scanner is busy. Try again after the active scans finish." }, { status: 429, headers: jsonHeaders });

  activeScans++;
  const encoder = new TextEncoder();
  const work = new AbortController();
  const timeout = setTimeout(() => work.abort(), 55_000);
  const onDisconnect = () => work.abort();
  req.signal.addEventListener("abort", onDisconnect, { once: true });
  let stopped = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        if (stopped) return;
        try { controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n")); } catch { stopped = true; work.abort(); }
      };
      let last: AssessmentSnapshot | null = null;
      try {
        const report = await scanPublicRepository(repo, work.signal, snapshot => {
          last = snapshot;
          send({ type: "snapshot", snapshot });
        });
        if (last) send({ type: "snapshot", snapshot: { ...last, status: "completed", updatedAt: new Date().toISOString() } });
        send({ type: "report", report });
      } catch (error) {
        const reason = work.signal.aborted ? "Scan interrupted or timed out." :
          error instanceof ScanError ? error.message : "Source analysis failed. No report was created.";
        send({ type: "error", message: reason });
      } finally {
        stopped = true;
        activeScans = Math.max(0, activeScans - 1);
        clearTimeout(timeout);
        req.signal.removeEventListener("abort", onDisconnect);
        try { controller.close(); } catch { /* client disconnected */ }
      }
    },
    cancel() { stopped = true; work.abort(); },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...jsonHeaders,
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
