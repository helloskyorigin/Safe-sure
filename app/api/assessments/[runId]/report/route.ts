import { NextResponse } from "next/server";
import { getGithubSession } from "@/lib/github-auth";
import { deleteUserReport, durableStoreConfigured, fetchUserReport } from "@/lib/durable-reports";
import { isAllowedMutationOrigin } from "@/lib/api-request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ runId: string }> };
const headers = { "Cache-Control": "no-store, private" };

async function authenticatedId(context: Params) {
  const session = await getGithubSession();
  const { runId } = await context.params;
  if (!session || !/^[0-9a-f-]{36}$/i.test(runId)) return null;
  return { session, runId };
}

export async function GET(_request: Request, context: Params) {
  const auth = await authenticatedId(context);
  if (!auth) return NextResponse.json({ error: "Report unavailable or login required." }, { status: 401, headers });
  if (!durableStoreConfigured()) return NextResponse.json({ error: "Report storage not configured." }, { status: 503, headers });
  try {
    const report = await fetchUserReport(auth.session.userId, auth.runId);
    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404, headers });
    return NextResponse.json(report, { headers });
  } catch { return NextResponse.json({ error: "Report storage unavailable." }, { status: 503, headers }); }
}

export async function DELETE(request: Request, context: Params) {
  if (!isAllowedMutationOrigin(request))
    return NextResponse.json({ error: "Cross-origin request denied." }, { status: 403, headers });
  const auth = await authenticatedId(context);
  if (!auth) return NextResponse.json({ error: "Not authorized." }, { status: 401, headers });
  if (!durableStoreConfigured()) return NextResponse.json({ error: "Report storage not configured." }, { status: 503, headers });
  try {
    await deleteUserReport(auth.session.userId, auth.runId);
    return NextResponse.json({ deleted: true }, { headers });
  } catch { return NextResponse.json({ error: "Report deletion unavailable." }, { status: 503, headers }); }
}
