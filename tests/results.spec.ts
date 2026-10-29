import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";

test("full report preview shows all findings without a paywall", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.getByRole("heading", { level: 1, name: /Explore a sample report/i })).toBeVisible();
  await expect(page.getByText("INTERACTIVE SAMPLE")).toBeVisible();
  await expect(page.getByText("6/6")).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
  await expect(page.getByRole("region", { name: "Detailed report" }).getByRole("heading", { name: "Potential credential embedded in client code" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recommended next steps" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How to verify" })).toBeVisible();
  await expect(page.getByText(/No application was connected, scanned or found vulnerable/i)).toBeVisible();
  await expect(page.getByText(/\$19/)).toHaveCount(0);
});

test("severity chips and search filter accurate detail data", async ({ page }) => {
  await page.goto("/assess/results");
  await page.locator(".result-filter-pills").getByRole("button", { name: "High" }).click();
  await expect(page.locator(".result-finding-item")).toHaveCount(2);
  await expect(page.getByText("2/6")).toBeVisible();
  await page.locator(".result-filter-pills").getByRole("button", { name: "All findings" }).click();
  await page.getByRole("searchbox", { name: "Search findings" }).fill("session.ts");
  await expect(page.locator(".result-finding-item")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Session cookie lacks an explicit SameSite policy" })).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
});

test("full remediation is interactive and export works without payment", async ({ page }) => {
  await page.goto("/assess/results");
  await page.locator(".result-checklist").getByRole("checkbox").first().check();
  await expect(page.getByText(/1\/4 marked reviewed/)).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.locator(".result-export-menu summary").click();
  await page.getByRole("button", { name: /Export example JSON/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("secuvora-sample-full-report.json");
  await expect(page.getByText(/All available findings and fix guidance included/)).toBeVisible();
});

test("coverage openly distinguishes complete and skipped checks", async ({ page }) => {
  await page.goto("/assess/results");
  await page.getByRole("button", { name: /Show coverage/i }).click();
  await expect(page.locator(".result-coverage-list").getByText("Authenticated runtime testing", { exact: true })).toBeVisible();
  await expect(page.locator(".result-coverage-tag").filter({ hasText: "skipped" })).toBeVisible();
  await expect(page.locator(".result-coverage-header").getByText("Illustrative source and configuration review.", { exact: false })).toBeVisible();
});

test("arbitrary run URLs never reveal sample report or pretend a scan completed", async ({ page, request }) => {
  const response = await request.get("/api/assessments/nonexistentRunId123/report");
  // User-scoped stored reports now fail closed for unauthenticated callers.
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const data = await response.json();
  expect(data.error).toMatch(/login|required|unavailable/i);
  await page.goto("/assess/results?run=nonexistentRunId123");
  await expect(page.getByRole("heading", { name: /A verified report isn't available/i })).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /View clearly labeled sample report/i })).toBeVisible();
});

test("minimal scanning page has no sample-report distraction", async ({ page }) => {
  await page.goto("/assess/scanning");
  await expect(page.getByRole("heading", { name: "Ready to investigate" })).toBeVisible();
  await expect(page.getByRole("link", { name: /View full sample/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Start a new investigation/i })).toBeVisible();
});

test("all results widths avoid horizontal overflow", async ({ browser }) => {
  for (const width of [320, 375, 430, 768, 1024, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 812 }, isMobile: width <= 430, hasTouch: width <= 430,
    });
    const page = await context.newPage();
    await page.goto("/assess/results");
    await expect(page.getByRole("heading", { level: 1, name: /Explore a sample report/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "results overflow at " + width + "px").toBeLessThanOrEqual(1);
    await context.close();
  }
});


test("free fix-plan export includes actual finding remediation and coverage", async ({ page }) => {
  await page.goto("/assess/results");
  const downloadPromise = page.waitForEvent("download");
  await page.locator(".result-export-menu summary").click();
  await page.getByRole("button", { name: /Fix plan/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("secuvora-sample-fix-plan.md");
  const content = await (await import("node:fs/promises")).readFile(await download.path(), "utf8");
  expect(content).toContain("ILLUSTRATIVE SAMPLE - NOT A REAL SCAN");
  expect(content).toContain("Recommended review and remediation");
  expect(content).toContain("How to verify");
  expect(content).toContain("## What was checked");
  expect(content).toContain("Potential credential embedded in client code");
});

test("result UI has no pricing, locked patches or false source links in sample", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.getByText(/\$19|\$9|checkout|upgrade to pro/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open source" })).toHaveCount(0);
  await page.locator(".result-export-menu summary").click();
  await expect(page.getByRole("button", { name: /Save PDF/i })).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
});


test("printable free report includes all findings and coverage, not only selected issue", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.locator(".result-print-all")).toBeHidden();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".result-print-all")).toBeVisible();
  await expect(page.locator(".result-print-all article")).toHaveCount(6);
  await expect(page.locator(".result-print-all").getByText("Coverage and scope")).toBeVisible();
  await expect(page.locator(".result-toolbar")).toBeHidden();
});

test("results v2 highlights real priority and exposes clickable severity filters", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.getByRole("heading", { level: 1, name: /Explore a sample report/i })).toBeVisible();
  await expect(page.getByRole("region", { name: "Priority finding" })).toContainText("Potential credential embedded in client code");
  await expect(page.getByRole("region", { name: "Actual assessment coverage" })).toContainText("Runtime behavior and exploitability");
  const severity = page.getByRole("button", { name: "Show High findings" });
  await severity.click();
  await expect(severity).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".result-finding-item")).toHaveCount(2);
  await severity.click();
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
});

test("verified partial report announces bounded coverage and persists review state on refresh", async ({ page }) => {
  const runId = "12345678-1234-4321-9999-123456789013";
  const report = {
    ...SAMPLE_REPORT,
    runId,
    appName: "acme/public-app",
    revision: "b".repeat(40),
    findings: SAMPLE_REPORT.findings.slice(0, 2),
    scanMetrics: { filesInspected: 12, eligibleFiles: 85, linesInspected: 2600, dependencyVersions: 4, rulesExecuted: 12 },
    coverage: [...SAMPLE_REPORT.coverage, { id: "limits", label: "Exhaustive repository coverage", status: "skipped", note: "Safety caps prevented exhaustive inspection." }],
  };
  await page.route("**/api/assessments/*/report", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(report),
  }));
  await page.goto("/assess/results?run=" + runId);
  await expect(page.getByRole("heading", { level: 1, name: /Security assessment complete/i })).toBeVisible();
  const scope = page.getByRole("region", { name: "Actual assessment coverage" });
  await expect(scope).toContainText("Partial source coverage");
  await expect(scope).toContainText("12 of 85 eligible files");
  await expect(page.getByText("Runtime behavior and exploitability have not been tested.")).toHaveCount(0);
  const checklist = page.locator(".result-checklist").getByRole("checkbox").first();
  await checklist.check();
  await expect(page.getByText(/1\/4 marked reviewed/)).toBeVisible();
  await page.reload();
  await expect(page.locator(".result-checklist").getByRole("checkbox").first()).toBeChecked();
  await expect(page.getByRole("region", { name: "Priority finding" })).toContainText("Potential credential");
});

test("results v2 separates supporting detector evidence from confirmed exploitation", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.getByRole("heading", { name: "Observed evidence" })).toBeVisible();
  await expect(page.getByText(/not proof that the issue is exploitable/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Potential impact" })).toBeVisible();
  await expect(page.locator(".result-finding-copy").first()).toContainText("medium confidence");
});
