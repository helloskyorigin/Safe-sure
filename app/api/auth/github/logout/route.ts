import { NextResponse } from "next/server";
import { SESSION_COOKIE, secureCookie } from "@/lib/github-auth";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none")
    return NextResponse.json({ error: "Cross-site request rejected." }, { status: 403 });
  const result = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  result.cookies.set(SESSION_COOKIE, "", { ...secureCookie(), maxAge: 0 });
  return result;
}
