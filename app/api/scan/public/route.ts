import { NextResponse } from "next/server";
import { parsePublicRepo, scanPublicRepository, ScanError } from "@/lib/public-repo-scanner";
import type { AssessmentSnapshot } from "@/lib/assessment-contract";
import { createHash } from "node:crypto";
import { durableStoreConfigured, enforceSharedQuota } from "@/lib/durable-reports";
import { isAllowedMutationOrigin } from "@/lib/api-request-guards";

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
  // No private credentials, but browser-origin checks still protect scan capacity.
  // Validate the Origin itself; do not trust spoofable Fetch Metadata in isolation.
  if (!isAllowedMutationOrigin(req))
    return NextResponse.json({ error: "Cross-origin scan requests are not allowed." },
      { status: 403, headers: jsonHeaders });
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

  // Shared Redis quotas protect multiple serverless instances when configured.
  // A hashed client identifier avoids storing raw addresses in the quota keys.
  if (durableStoreConfigured()) {
    const ip = (req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for") || "unknown")
      .split(",")[0].trim().slice(0, 80);
    const opaque = createHash("sha256").update(
      (process.env.SHIPSAFE_SESSION_SECRET || "") + ":" + ip).digest("hex").slice(0, 20);
    try {
      if (!(await enforceSharedQuota("public:" + opaque, 8)) ||
          !(await enforceSharedQuota("public-global", 100)))
        return NextResponse.json({ error: "Scan quota reached. Retry shortly." },
          { status: 429, headers: { ...jsonHeaders, "Retry-After": "60" } });
    } catch {
      return NextResponse.json({ error: "Shared scan protection is temporarily unavailable." },
        { status: 503, headers: jsonHeaders });
    }
  }
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
