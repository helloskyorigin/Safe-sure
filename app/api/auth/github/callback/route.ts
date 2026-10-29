import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAUTH_COOKIE, SESSION_COOKIE, configuredGithubOAuth,
  constantEqual, githubUserApi, newSessionCookie, secureCookie } from "@/lib/github-auth";

export const runtime = "nodejs";

function redirectTo(request: Request, success: boolean) {
  const origin = process.env.SHIPSAFE_PUBLIC_ORIGIN || new URL(request.url).origin;
  return NextResponse.redirect(new URL(success ? "/assess?connected=1" : "/assess?auth_error=1", origin), 302);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const saved = (await cookies()).get(OAUTH_COOKIE)?.value || "";
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const resultFail = redirectTo(request, false);
  resultFail.cookies.set(OAUTH_COOKIE, "", { ...secureCookie(), maxAge: 0 });
  if (!configuredGithubOAuth() || !saved || !constantEqual(saved, state) ||
    !/^[a-zA-Z0-9_-]{8,350}$/.test(code)) return resultFail;

  const origin = process.env.SHIPSAFE_PUBLIC_ORIGIN || url.origin;
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json",
        "User-Agent": "Secuvora-RepositoryAssessment/1.0" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_APP_CLIENT_ID,
        client_secret: process.env.GITHUB_APP_CLIENT_SECRET,
        code, state, redirect_uri: origin.replace(/\/$/, "") + "/api/auth/github/callback",
      }), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return resultFail;
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") return resultFail;
    const tokenData = payload as { access_token?: unknown; expires_in?: unknown };
    if (typeof tokenData.access_token !== "string" ||
      tokenData.access_token.length < 8 || tokenData.access_token.length > 2000) return resultFail;
    const userResponse = await githubUserApi("/user", tokenData.access_token);
    if (!userResponse.ok) return resultFail;
    const user: unknown = await userResponse.json();
    if (!user || typeof user !== "object") return resultFail;
    const identity = user as { id?: unknown; login?: unknown };
    if (!Number.isSafeInteger(identity.id) || typeof identity.login !== "string" ||
      !/^[a-zA-Z0-9-]{1,39}$/.test(identity.login)) return resultFail;
    // OAuth sessions expire before the GitHub App's user token. A new login is
    // required if tokens are revoked or GitHub returns 401.
    const expiry = typeof tokenData.expires_in === "number" && tokenData.expires_in > 0
      ? Math.min(tokenData.expires_in - 120, 6 * 60 * 60) : 6 * 60 * 60;
    if (expiry < 60) return resultFail;
    const result = redirectTo(request, true);
    result.cookies.set(OAUTH_COOKIE, "", { ...secureCookie(), maxAge: 0 });
    result.cookies.set(newSessionCookie({ userId: identity.id as number, login: identity.login,
      token: tokenData.access_token, expires: Date.now() + expiry * 1000 }));
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch { return resultFail; }
}
