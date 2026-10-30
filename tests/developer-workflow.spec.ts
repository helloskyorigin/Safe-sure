import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";
import { compareAssessmentReports } from "../lib/report-delta";

const olderId = "11111111-1111-4111-8111-111111111111";
const currentId = "22222222-2222-4222-8222-222222222222";
const original = {
  ...SAMPLE_REPORT, runId: olderId, appName: "acme/real-repo",
  revision: "a".repeat(40), finishedAt: "2026-10-20T00:00:00.000Z",
  scanMetrics: { filesInspected: 8, eligibleFiles: 8, linesInspected: 150, dependencyVersions: 4, rulesExecuted: 12 },
};
const latest = {
  ...original, runId: currentId, revision: "b".repeat(40),
  finishedAt: "2026-10-28T00:00:00.000Z",
  findings: [original.findings[0], original.findings[1], {
    ...original.findings[5], id: "NEW-123", title: "Newly detected dangerous setting",
  }],
};

test("report delta uses stable identities and NEVER says absent findings are fixed", () => {
  const result = compareAssessmentReports(latest, original);
  expect(result).not.toBeNull();
  expect(result?.added.map(x => x.id)).toEqual(["NEW-123"]);
  expect(result?.persisted.map(x => x.id)).toEqual([original.findings[0].id, original.findings[1].id]);
  expect(result?.notDetected.length).toBe(4);
  expect(result?.scopeChanged).toBe(false);
  expect(result?.revisionChanged).toBe(true);
  expect(compareAssessmentReports(original, original)).toBeNull();
  expect(compareAssessmentReports(latest, { ...original, appName:"different/repo" })).toBeNull();
});

test("changing scanner coverage is disclosed before interpreting missing signals", () => {
  const changed = { ...latest,
    scanMetrics: { ...latest.scanMetrics, filesInspected: 2 },
    coverage: latest.coverage.map((c, i) => i === 0 ? { ...c, status: "skipped" as const } : c),
  };
  expect(compareAssessmentReports(changed, original)?.scopeChanged).toBe(true);
});

test("saved reports retain real findings but no longer show a redundant delta panel", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(({older,current}) => {
    for(const item of [older,current])
      localStorage.setItem("shipsafe:public-report:v1:"+item.runId,JSON.stringify(item));
    localStorage.setItem("shipsafe:public-history:v1",JSON.stringify([current,older].map(item=>({
      runId:item.runId,appName:item.appName,finishedAt:item.finishedAt,
      findings:item.findings.length,revision:item.revision,savedAt:Date.now(),
    }))));
  },{older:original,current:latest});
  await page.goto("/assess/results?local="+currentId);
  await expect(page.locator(".result-finding-card")).toHaveCount(3);
  await expect(page.locator(".delta-panel")).toHaveCount(0);
  await expect(page.locator(".result-severity")).toHaveCount(4);
  const first=page.locator(".result-finding-card").first();
  await first.locator("summary").first().click();
  await expect(first.getByRole("heading",{name:"How to fix"})).toBeVisible();
});

test("scan history continues to expose exact-repository rescan", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(report=>{
    localStorage.setItem("shipsafe:public-report:v1:"+report.runId,JSON.stringify(report));
    localStorage.setItem("shipsafe:public-history:v1",JSON.stringify([{
      runId:report.runId,appName:report.appName,finishedAt:report.finishedAt,
      findings:report.findings.length,savedAt:Date.now(),
    }]));
  },original);
  await page.goto("/assess/history");
  await expect(page.getByRole("link",{name:"Rescan"})).toHaveAttribute(
    "href","/assess/scanning?repo=acme%2Freal-repo");
});

test("compact reports and saved history remain tappable at 320 and 375px", async ({ browser }) => {
  for(const width of [320,375]) {
    const ctx=await browser.newContext({viewport:{width,height:750},isMobile:true,hasTouch:true});
    const page=await ctx.newPage();await page.goto("/");
    await page.evaluate(({older,current})=>{
      for(const item of [older,current])
        localStorage.setItem("shipsafe:public-report:v1:"+item.runId,JSON.stringify(item));
      localStorage.setItem("shipsafe:public-history:v1",JSON.stringify([current,older].map(item=>({
        runId:item.runId,appName:item.appName,finishedAt:item.finishedAt,
        findings:item.findings.length,savedAt:Date.now(),
      }))));
    },{older:original,current:latest});
    await page.goto("/assess/results?local="+currentId);
    await expect(page.locator(".result-finding-card")).toHaveCount(3);
    const resultOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(resultOverflow).toBeLessThanOrEqual(2);
    await page.goto("/assess/history");
    await expect(page.getByRole("link",{name:"Rescan"}).first()).toBeVisible();
    const historyOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(historyOverflow).toBeLessThanOrEqual(2);
    await ctx.close();
  }
});
