import { test, expect } from "@playwright/test";

test("full report preview shows all findings without a paywall", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.getByRole("heading", { level: 1, name: /See the risk.*Know the fix/i })).toBeVisible();
  await expect(page.getByText("INTERACTIVE SAMPLE")).toBeVisible();
  await expect(page.getByText("6/6")).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: "Potential credential embedded in client code" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Remediation checklist" })).toBeVisible();
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
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
});

test("full remediation is interactive and export works without payment", async ({ page }) => {
  await page.goto("/assess/results");
  await page.locator(".result-checklist").getByRole("checkbox").first().check();
  await expect(page.getByText("1 / 4 reviewed")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export example/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("shipsafe-sample-full-report.json");
  await expect(page.getByText("All report details are accessible. No locked findings.")).toBeVisible();
});

test("coverage openly distinguishes complete and skipped checks", async ({ page }) => {
  await page.goto("/assess/results");
  await page.getByRole("button", { name: /Show coverage/i }).click();
  await expect(page.getByText("Authenticated runtime testing")).toBeVisible();
  await expect(page.locator(".result-coverage-tag").filter({ hasText: "skipped" })).toBeVisible();
  await expect(page.getByText("Illustrative source and configuration review.", { exact: false })).toBeVisible();
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

test("scanning links to complete sample report", async ({ page }) => {
  await page.goto("/assess/scanning");
  await page.getByRole("link", { name: /View full sample/i }).click();
  await expect(page).toHaveURL(/\/assess\/results$/);
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
});

test("all results widths avoid horizontal overflow", async ({ browser }) => {
  for (const width of [320, 375, 430, 768, 1024, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 812 }, isMobile: width <= 430, hasTouch: width <= 430,
    });
    const page = await context.newPage();
    await page.goto("/assess/results");
    await expect(page.getByRole("heading", { level: 1, name: /See the risk/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "results overflow at " + width + "px").toBeLessThanOrEqual(1);
    await context.close();
  }
});
