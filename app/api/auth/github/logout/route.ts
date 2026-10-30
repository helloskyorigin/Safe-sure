import { NextResponse } from "next/server";
import { SESSION_COOKIE, secureCookie } from "@/lib/github-auth";
import { isAllowedMutationOrigin } from "@/lib/api-request-guards";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isAllowedMutationOrigin(request))
    return NextResponse.json({ error: "Cross-origin request rejected." },
      { status: 403, headers: { "Cache-Control": "no-store" } });
  const result = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  result.cookies.set(SESSION_COOKIE, "", { ...secureCookie(), maxAge: 0 });
  return result;
}
