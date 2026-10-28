import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { OAUTH_COOKIE, configuredGithubOAuth, secureCookie } from "@/lib/github-auth";

export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!configuredGithubOAuth()) return NextResponse.json(
    { error: "GitHub App login has not been configured on this deployment." }, { status: 503 });
  const origin = process.env.SHIPSAFE_PUBLIC_ORIGIN || new URL(request.url).origin;
  if (!/^https:\/\//.test(origin) && !/^http:\/\/localhost(?::\d+)?$/.test(origin))
    return NextResponse.json({ error: "A valid HTTPS origin is required." }, { status: 503 });
  const state = randomBytes(32).toString("base64url");
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_APP_CLIENT_ID!);
  authorize.searchParams.set("redirect_uri", origin.replace(/\/$/, "") + "/api/auth/github/callback");
  authorize.searchParams.set("state", state);
  const result = NextResponse.redirect(authorize, 302);
  result.cookies.set(OAUTH_COOKIE, state, { ...secureCookie(), maxAge: 600 });
  result.headers.set("Cache-Control", "no-store");
  return result;
}
