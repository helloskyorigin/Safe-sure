import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";

test("verified report shows actual scan scope, stable detector ID and no invented health score", async ({ page }) => {
  const runId = "12345678-1234-4321-9999-123456789012";
  const verified = {
    ...SAMPLE_REPORT, runId, appName:"acme/production-app",
    revision:"a".repeat(40),
    scanMetrics:{ filesInspected:12,eligibleFiles:27,linesInspected:4321,dependencyVersions:48,rulesExecuted:12 },
    findings:SAMPLE_REPORT.findings.map((f,index)=>index===0? {
      ...f,ruleId:"SS-SECRET-002",ruleEngine:"ShipSafe static rules v2",
    }:f),
  };
  await page.route("**/api/assessments/*/report", route => route.fulfill({
    status:200, contentType:"application/json", body:JSON.stringify(verified),
  }));
  await page.goto("/assess/results?run=" + runId);
  await expect(page.getByText("SCAN COMPLETE")).toBeVisible();
  const metrics = page.locator(".result-scanned-metrics");
  await expect(metrics).toContainText("12 files inspected");
  await expect(metrics).toContainText("4,321 lines reviewed");
  await expect(metrics).toContainText("48 pinned packages");
  await expect(metrics).toContainText("12 source rules");
  await expect(page.locator(".result-detail-meta")).toContainText("SS-SECRET-002");
  await expect(page.getByText(/97% secure|100% secure|Security score/i)).toHaveCount(0);
});
