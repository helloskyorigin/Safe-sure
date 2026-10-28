import { NextResponse } from "next/server";

/**
 * Full reports must never be loaded using a run ID alone.
 * Future implementation: authenticate session, authorize exact run, require
 * a completed worker snapshot, redact secrets, and return validated data.
 * No payment or paid-report gate exists in the current product.
 */
const unavailable = () => NextResponse.json(
  { code: "REPORT_ENGINE_NOT_CONFIGURED", message: "Authenticated reports are not connected yet." },
  { status: 503, headers: { "Cache-Control": "no-store, private" } },
);

export async function GET() {
  return unavailable();
}
