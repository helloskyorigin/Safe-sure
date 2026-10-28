import { test, expect } from "@playwright/test";

test("scanning route renders honest idle state without invented progress", async ({ page }) => {
  await page.goto("/assess/scanning");
  await expect(page.getByRole("heading", { level: 1, name: /Under the surface/i })).toBeVisible();
  await expect(page.getByText("Awaiting authorization")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ready when your application is." })).toBeVisible();
  await expect(page.getByText(/No progress data received/i)).toBeVisible();
  await expect(page.getByText(/No assessment activity yet/i)).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Scan a public repository/i })).toBeVisible();
});

test("inspectable check layers explain actual coverage and limitations", async ({ page }) => {
  await page.goto("/assess/scanning");
  const button = page.getByRole("button", { name: /Dependency advisories/i });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: /Know the risk in what you depend on/i })).toBeVisible();
  await expect(page.getByText(/An advisory match alone does not prove/i)).toBeVisible();
  await page.getByRole("button", { name: /Credential exposure/i }).click();
  await expect(page.getByRole("heading", { name: /Credentials belong outside your code/i })).toBeVisible();
});

test("connection screen explicitly links to a non-running inspection preview", async ({ page }) => {
  await page.goto("/assess");
  await page.getByRole("link", { name: "Preview scanning workspace" }).click();
  await expect(page).toHaveURL(/\/assess\/scanning$/);
  await expect(page.getByText(/No assessment activity yet/i)).toBeVisible();
});

test("scan API is fail-closed until authorization and worker are implemented", async ({ request }) => {
  const runId = "safeTestRun123456";
  const status = await request.get("/api/assessments/" + runId);
  expect(status.status()).toBe(503);
  expect(status.headers()["cache-control"]).toContain("no-store");
  const payload = await status.json();
  expect(payload.code).toBe("SCAN_ENGINE_NOT_CONFIGURED");
  expect(JSON.stringify(payload)).not.toContain(runId);
  const cancel = await request.delete("/api/assessments/" + runId);
  expect(cancel.status()).toBe(503);
});

test("unconfigured run is never displayed as running or complete", async ({ page }) => {
  await page.goto("/assess/scanning?run=safeTestRun123456");
  await expect(page.getByText("Integration required")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ready when your application is." })).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("desktop and mobile scanning routes avoid horizontal overflow", async ({ browser }) => {
  for (const width of [320, 375, 430, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 810 }, isMobile: width < 500, hasTouch: width < 500 });
    const page = await context.newPage();
    await page.goto("/assess/scanning");
    await expect(page.getByRole("heading", { level: 1, name: /Under the surface/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "horizontal overflow at " + width + "px").toBeLessThanOrEqual(1);
    await context.close();
  }
});
