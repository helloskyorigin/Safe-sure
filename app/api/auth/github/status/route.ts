import { NextResponse } from "next/server";
import { getGithubSession, configuredGithubOAuth } from "@/lib/github-auth";
import { durableStoreStatus } from "@/lib/durable-reports";

export const runtime = "nodejs";
export async function GET() {
  const session = await getGithubSession();
  const storage = durableStoreStatus();
  return NextResponse.json({
    configured: configuredGithubOAuth(),
    connected: Boolean(session),
    login: session?.login || null,
    storageConfigured: storage.configured,
    storage: {
      hasUrl: storage.hasUrl,
      hasToken: storage.hasToken,
      hasSessionSecret: storage.hasSessionSecret,
    },
  }, { headers: { "Cache-Control": "no-store, private" } });
}
