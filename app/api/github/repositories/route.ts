import { NextResponse } from "next/server";
import { configuredGithubOAuth, getGithubSession } from "@/lib/github-auth";
import { userInstalledRepositories } from "@/lib/github-installations";
export const runtime = "nodejs";
export async function GET() {
  const headers = { "Cache-Control": "no-store, private" };
  if (!configuredGithubOAuth()) return NextResponse.json({ error: "GitHub App is not configured." }, { status: 503, headers });
  const session = await getGithubSession();
  if (!session) return NextResponse.json({ error: "Sign in with GitHub to see authorized repositories." }, { status: 401, headers });
  try {
    const repositories = await userInstalledRepositories(session);
    return NextResponse.json({ repositories, login: session.login }, { headers });
  } catch { return NextResponse.json({ error: "Could not verify GitHub installation. Sign in again." }, { status: 502, headers }); }
}
