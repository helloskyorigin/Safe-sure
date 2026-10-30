import { NextResponse } from "next/server";

/**
 * Integration boundary — no scan worker or authenticated job store is connected.
 *
 * Real implementation must:
 * 1) authenticate the browser session and authorize access to this exact run,
 * 2) read only the authorized user's job from a durable store,
 * 3) return a server-validated AssessmentSnapshot,
 * 4) require verified authorization before cancellation,
 * 5) never accept an arbitrary installation ID or repository from query strings.
 *
 * Until that is implemented, return an explicit unavailable status and NEVER
 * disclose the existence of an arbitrary run ID.
 */
const unavailable = () =>
  NextResponse.json(
    { code: "SCAN_ENGINE_NOT_CONFIGURED", message: "Authenticated scanning is not connected yet." },
    { status: 503, headers: { "Cache-Control": "no-store, private" } },
  );

export async function GET() {
  return unavailable();
}

export async function DELETE() {
  return unavailable();
}
