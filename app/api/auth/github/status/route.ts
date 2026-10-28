import { NextResponse } from "next/server";
import { getGithubSession, configuredGithubOAuth } from "@/lib/github-auth";

export const runtime = "nodejs";
export async function GET() {
  const session = await getGithubSession();
  return NextResponse.json({
    configured: configuredGithubOAuth(),
    connected: Boolean(session), login: session?.login || null,
  }, { headers: { "Cache-Control": "no-store, private" } });
}
