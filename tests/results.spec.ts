import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";

test("sample report is visibly fictional and presents real remediation structure", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.getByRole("heading", {level:1,name:/Explore a sample report/i})).toBeVisible();
  await expect(page.getByText("INTERACTIVE SAMPLE")).toBeVisible();
  await expect(page.getByText(/No application was connected, scanned or found vulnerable/i)).toBeVisible();
  await expect(page.locator(".result-severity")).toHaveCount(4);
  await expect(page.locator(".result-finding-card")).toHaveCount(6);
  const first = page.locator(".result-finding-card").first();
  await first.locator("summary").first().click();
  await expect(first.getByRole("heading",{name:"Potential impact"})).toBeVisible();
  await expect(first.getByRole("heading",{name:"How to fix"})).toBeVisible();
  await expect(first.getByRole("heading",{name:"How to verify"})).toBeVisible();
  await expect(page.locator(".delta-panel")).toHaveCount(0);
  await expect(page.locator(".result-detail-panel")).toHaveCount(0);
});

test("four severity cards filter actual finding cards without fake counts", async ({ page }) => {
  await page.goto("/assess/results");
  const high = page.getByRole("button",{name:"Show High findings"});
  await high.click();
  await expect(high).toHaveAttribute("aria-pressed","true");
  await expect(page.locator(".result-finding-card")).toHaveCount(2);
  await page.getByRole("button",{name:"Show all findings"}).click();
  await expect(page.locator(".result-finding-card")).toHaveCount(6);
  await expect(page.locator(".result-severity")).toHaveCount(4);
});

test("Export menu downloads the existing complete JSON and Markdown artifacts", async ({ page }) => {
  await page.goto("/assess/results");
  await page.locator(".result-export-menu summary").click();
  const json = page.waitForEvent("download");
  await page.getByRole("button",{name:/Export example JSON/}).click();
  expect((await json).suggestedFilename()).toBe("secuvora-sample-full-report.json");
  await page.locator(".result-export-menu summary").click();
  const plan = page.waitForEvent("download");
  await page.getByRole("button",{name:/Fix plan/}).click();
  const file = await plan;
  expect(file.suggestedFilename()).toBe("secuvora-sample-fix-plan.md");
  const contents = await (await import("node:fs/promises")).readFile(await file.path(),"utf8");
  expect(contents).toContain("ILLUSTRATIVE SAMPLE - NOT A REAL SCAN");
  expect(contents).toContain("How to verify");
  expect(contents).toContain("## What was checked");
});

test("one collapsed scope section discloses skipped checks", async ({ page }) => {
  await page.goto("/assess/results");
  const coverage = page.locator(".result-clean-coverage");
  await expect(coverage).toHaveCount(1);
  await expect(coverage).not.toHaveAttribute("open","");
  await coverage.locator("summary").click();
  await expect(coverage).toHaveAttribute("open","");
  await expect(coverage).toContainText("Authenticated runtime testing");
  await expect(coverage).toContainText("skipped");
  await expect(coverage).toContainText("Illustrative source and configuration review");
});

test("arbitrary reports never leak sample findings", async ({ page,request }) => {
  const response = await request.get("/api/assessments/nonexistentRunId123/report");
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  await page.goto("/assess/results?run=nonexistentRunId123");
  await expect(page.getByRole("heading",{name:/A verified report isn't available/i})).toBeVisible();
  await expect(page.locator(".result-finding-card")).toHaveCount(0);
  await expect(page.getByRole("link",{name:/View clearly labeled sample report/i})).toBeVisible();
});

test("minimal scanning page remains focused", async ({ page }) => {
  await page.goto("/assess/scanning");
  await expect(page.getByRole("heading",{name:"Ready to investigate"})).toBeVisible();
  await expect(page.getByRole("link",{name:/Start a new investigation/i})).toBeVisible();
});

test("compact report has no horizontal overflow at supported widths", async ({ browser }) => {
  for(const width of [320,375,430,768,1024,1440]) {
    const ctx = await browser.newContext({viewport:{width,height:812},isMobile:width<=430,hasTouch:width<=430});
    const page = await ctx.newPage();await page.goto("/assess/results");
    const overflow = await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow,"report overflow at "+width+"px").toBeLessThanOrEqual(2);
    await ctx.close();
  }
});

test("print exports contain all findings and truthful coverage", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.locator(".result-print-all")).toBeHidden();
  await page.emulateMedia({media:"print"});
  await expect(page.locator(".result-print-all")).toBeVisible();
  await expect(page.locator(".result-print-all article")).toHaveCount(6);
  await expect(page.locator(".result-toolbar")).toBeHidden();
});

test("real partial source report is labeled as limited; evidence not fictional", async ({ page }) => {
  const runId = "12345678-1234-4321-9999-123456789013";
  const report = {
    ...SAMPLE_REPORT,runId,appName:"acme/public-app",revision:"b".repeat(40),
    findings:SAMPLE_REPORT.findings.slice(0,2),
    scanMetrics:{filesInspected:12,eligibleFiles:85,linesInspected:2600,dependencyVersions:4,rulesExecuted:15},
    coverage:[...SAMPLE_REPORT.coverage,{id:"limits",label:"Exhaustive repository coverage",
      status:"skipped",note:"Safety caps prevented exhaustive inspection."}],
  };
  await page.route("**/api/assessments/*/report",route=>route.fulfill({
    status:200,contentType:"application/json",body:JSON.stringify(report),
  }));
  await page.goto("/assess/results?run="+runId);
  await expect(page.getByRole("heading",{level:1,name:"Security report"})).toBeVisible();
  const coverage=page.locator(".result-clean-coverage");
  await expect(coverage).toHaveClass(/partial/);
  await coverage.locator("summary").click();
  await expect(coverage).toContainText("12 of 85 eligible files inspected");
  await expect(coverage).toContainText("Runtime behavior and exploitability were not tested");
  await expect(page.locator(".result-finding-card")).toHaveCount(2);
});

test("candidate evidence is clearly qualified and no paywall or fake score appears", async ({ page }) => {
  await page.goto("/assess/results");
  const first=page.locator(".result-finding-card").first();
  await first.locator("summary").first().click();
  await first.locator(".result-evidence-accordion summary").click();
  await expect(first.locator(".result-evidence-accordion")).toContainText(/limitation|not|review/i);
  await expect(page.getByText(/97% secure|100% secure|Security score|Checkout|Upgrade to Pro/i)).toHaveCount(0);
  await page.locator(".result-export-menu summary").click();
  await expect(page.getByRole("button",{name:/Save PDF/i})).toBeVisible();
  await expect(page.getByRole("link",{name:"Open source"})).toHaveCount(0);
});
