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
const MAX_STARTS_PER_MINUTE = 12;
const recentStarts: number[] = [];
// These process-local budgets limit accidental abuse but do NOT replace an
// edge/WAF or shared rate limiter for distributed production deployments.
const jsonHeaders = { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" };

export async function POST(req: Request) {
  // Same-origin requests only; no cookies or private authorization are used.
  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  // Browsers mark same-origin requests even when a hosting reverse proxy
  // rewrites the internal Request URL (e.g. 127.0.0.1 -> localhost).
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")
    return NextResponse.json({ error: "Cross-origin scan requests are not allowed." }, { status: 403, headers: jsonHeaders });
  if (origin && fetchSite !== "same-origin") {
    let allowed = false;
    try {
      const source = new URL(origin);
      const hosts = [new URL(req.url).host, req.headers.get("host"), req.headers.get("x-forwarded-host")];
      allowed = (source.protocol === "https:" || source.hostname === "localhost" || source.hostname === "127.0.0.1") &&
        hosts.includes(source.host);
    } catch { /* Invalid Origin header */ }
    if (!allowed) return NextResponse.json({ error: "Cross-origin scan requests are not allowed." }, { status: 403, headers: jsonHeaders });
  }
  if (Number(req.headers.get("content-length") || 0) > 1600)
    return NextResponse.json({ error: "Invalid request size." }, { status: 413, headers: jsonHeaders });
  let repo: string;
  try {
    if (!req.body) throw new ScanError("Missing scan request.", 400);
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = []; let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > 1600) { await reader.cancel(); throw new ScanError("Scan request is too large.", 413); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== "object" || !("repo" in body) || typeof body.repo !== "string" ||
      body.repo.length > 200) throw new ScanError("Provide one public repository.", 400);
    const { owner, repo: name } = parsePublicRepo(body.repo);
    repo = owner + "/" + name;
  } catch (error) {
    return NextResponse.json({ error: error instanceof ScanError ? error.message : "Invalid scan request." },
      { status: error instanceof ScanError ? error.status : 400, headers: jsonHeaders });
  }
  // Simple per-process capacity budget. A distributed scanner needs a shared
  // edge quota keyed to a verified identity before being opened broadly.
  const now = Date.now();
  while (recentStarts.length && recentStarts[0] < now - 60_000) recentStarts.shift();
  if (activeScans >= MAX_ACTIVE || recentStarts.length >= MAX_STARTS_PER_MINUTE)
    return NextResponse.json(
      { error: "Public scanner is at capacity. Please retry shortly." },
      { status: 429, headers: { ...jsonHeaders, "Retry-After": "60" } },
    );

  recentStarts.push(now);
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
        const completedSnapshot = last as AssessmentSnapshot | null;
        if (completedSnapshot) send({ type: "snapshot", snapshot: { ...completedSnapshot, status: "completed", updatedAt: new Date().toISOString() } });
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
