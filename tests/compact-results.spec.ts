import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";

test("compact report has four severity cards and readable impact/fix details", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.locator(".result-severity")).toHaveCount(4);
  await expect(page.locator(".result-finding-card")).toHaveCount(SAMPLE_REPORT.findings.length);
  await expect(page.locator(".result-detail-panel")).toHaveCount(0);
  await expect(page.locator(".delta-panel")).toHaveCount(0);
  await page.locator(".result-finding-card").first().locator("summary").first().click();
  const content = page.locator(".result-finding-card").first();
  await expect(content.getByRole("heading", {name:"Why flagged"})).toBeVisible();
  await expect(content.getByRole("heading", {name:"Potential impact"})).toBeVisible();
  await expect(content.getByRole("heading", {name:"How to fix"})).toBeVisible();
  await expect(content.getByRole("heading", {name:"How to verify"})).toBeVisible();
  await expect(page.locator(".result-export-menu")).toBeVisible();
});

test("a zero-finding report is honest and never renders redundant empty finding panes", async ({ page }) => {
  const id = "12345678-1234-4321-9999-123456789012";
  const report = { ...SAMPLE_REPORT, runId:id, appName:"founder/papercue", findings:[],
    coverage:[...SAMPLE_REPORT.coverage,{id:"limits",label:"Source limitations",
      status:"skipped",note:"Source limits."}],
    scanMetrics:{ filesInspected:19,eligibleFiles:19,linesInspected:896,dependencyVersions:0,rulesExecuted:15 },
  };
  await page.route("**/api/assessments/*/report", route => route.fulfill({
    status:200,contentType:"application/json",body:JSON.stringify(report),
  }));
  await page.goto("/assess/results?run="+id);
  await expect(page.locator(".result-severity")).toHaveCount(4);
  await expect(page.locator(".result-clean-zero")).toContainText("No findings from supported rules");
  await expect(page.locator(".result-clean-zero")).toContainText("does not prove");
  await expect(page.locator(".result-finding-card")).toHaveCount(0);
  await expect(page.locator(".result-no-detail")).toHaveCount(0);
  await expect(page.locator(".result-no-findings")).toHaveCount(0);
  await expect(page.locator(".delta-panel")).toHaveCount(0);
  await page.locator(".result-clean-coverage summary").click();
  await expect(page.locator(".result-clean-coverage-body")).toBeVisible();
});

test("light and dark coverage text remains readable on mobile", async ({ browser }) => {
  for(const theme of ["light","dark"] as const) {
    const ctx = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await ctx.addInitScript(x=>localStorage.setItem("secuvora:theme",x),theme);
    const page = await ctx.newPage();
    await page.goto("/assess/results");
    const details = page.locator(".result-clean-coverage");
    await details.locator("summary").click();
    const colors = await details.evaluate(node => {
      const body = node.querySelector(".result-clean-coverage-body p") as HTMLElement;
      const bg = getComputedStyle(node).backgroundColor;
      const text = getComputedStyle(body).color;
      return { bg,text };
    });
    expect(colors.bg).not.toBe(colors.text);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(2);
    await ctx.close();
  }
});
