import { test, expect } from "@playwright/test";
import { analyzeSourceDetailed } from "../lib/source-security-engine";
import { scanPublicRepository } from "../lib/public-repo-scanner";
import type { AssessmentSnapshot } from "../lib/assessment-contract";

const rateRoute = [
  "const RECENT = new Map<string, { at:number; count:number }>();",
  "export async function POST(request: Request) {",
  "  const ip = request.headers.get('x-forwarded-for') || 'unknown';",
  "  const prev = RECENT.get(ip);",
  "  if (prev && prev.count >= 4) return Response.json({ error:'RATE_LIMIT' },{ status:429 });",
  "  RECENT.set(ip,{ at:Date.now(),count:1 });",
  "  return Response.json({ ok:true });",
  "}",
].join("\n");

test("Papercue-like serverless API gets an evidence-qualified review finding", () => {
  const file = { path:"app/api/analyze/route.ts", content:rateRoute };
  const result = analyzeSourceDetailed([file]);
  const item = result.findings.find(x => x.ruleId === "SS-RATE-001");
  expect(item?.severity).toBe("medium");
  expect(item?.confidence).toBe("low");
  expect(item?.whyItMatters).toMatch(/serverless|instances|processes/i);
  expect(item?.limitations).toMatch(/No bypass was tested/i);
  expect(item?.evidence).not.toContain("x-forwarded-for");
});

test("same Map used as an ordinary cache must not be misreported as API abuse", () => {
  const result = analyzeSourceDetailed([
    {path:"app/api/cache/route.ts",content:"const cache=new Map();\ncache.get('a');\ncache.set('a',1);\nreturn Response.json({}, { status:429 });"},
    {path:"src/cache.ts", content:rateRoute},
  ]);
  expect(result.findings.some(f => f.ruleId === "SS-RATE-001")).toBe(false);
});

test("real scan visibly advances file fetch progress before separate detector passes", async () => {
  const native = globalThis.fetch;
  const commit = "a".repeat(40), tree = "b".repeat(40);
  const files = [
    {path:"app/api/analyze/route.ts",body:rateRoute,sha:"c".repeat(40)},
    {path:"app/config.ts",body:"export const hello = true;",sha:"d".repeat(40)},
  ];
  globalThis.fetch = (async (url, _options) => {
    const path = String(url);
    const json = (data: unknown) => new Response(JSON.stringify(data), {
      status:200,headers:{"content-type":"application/json"},
    });
    if(path.endsWith("/founder/real")) return json({private:false,default_branch:"main",size:10});
    if(path.endsWith("/commits/main")) return json({sha:commit,commit:{tree:{sha:tree}}});
    if(path.includes("/git/trees/")) return json({
      truncated:false,tree:files.map(f=>({path:f.path,type:"blob",size:f.body.length,sha:f.sha})),
    });
    for(const f of files) if(path.endsWith("/git/blobs/"+f.sha)) return json({
      encoding:"base64",size:Buffer.byteLength(f.body),
      content:Buffer.from(f.body).toString("base64"),
    });
    throw Error("Unexpected network request: "+path);
  }) as typeof fetch;
  const updates: AssessmentSnapshot[] = [];
  try {
    const report = await scanPublicRepository("founder/real",new AbortController().signal,
      s=>updates.push(s),"authorized-test-token");
    expect(report.findings.some(f=>f.ruleId==="SS-RATE-001")).toBe(true);
    expect(report.scanMetrics?.filesInspected).toBe(2);
    expect(updates.some(s=>s.fileProgress?.loaded===1 && s.fileProgress.total===2)).toBe(true);
    expect(updates.some(s=>s.fileProgress?.loaded===2 && s.fileProgress.total===2)).toBe(true);
    const secretStart = updates.findIndex(s=>s.checks.find(c=>c.key==="secrets")?.status==="running");
    const patternStart = updates.findIndex(s=>s.checks.find(c=>c.key==="patterns")?.status==="running");
    expect(secretStart).toBeGreaterThan(0);
    expect(patternStart).toBeGreaterThan(secretStart);
    expect(updates.at(-1)?.progress).toEqual({done:5,total:5});
  } finally { globalThis.fetch=native; }
});
