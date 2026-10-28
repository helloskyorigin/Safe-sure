import { NextResponse } from "next/server";
import { getGithubSession } from "@/lib/github-auth";
import { durableStoreConfigured, listUserReports } from "@/lib/durable-reports";
export const runtime = "nodejs";
export async function GET() {
  const headers = { "Cache-Control": "no-store, private" };
  const session = await getGithubSession();
  if (!session) return NextResponse.json({ error: "GitHub sign-in required." }, { status: 401, headers });
  if (!durableStoreConfigured()) return NextResponse.json({ error: "Saved report storage is not configured." }, { status: 503, headers });
  try { return NextResponse.json({ reports: await listUserReports(session.userId) }, { headers }); }
  catch { return NextResponse.json({ error: "Report storage temporarily unavailable." }, { status: 503, headers }); }
}
