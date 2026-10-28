import { test, expect } from "@playwright/test";

test("idle scanning page stays minimal and never invents progress", async ({ page }) => {
  await page.goto("/assess/scanning");
  await expect(page.getByRole("heading", { name: "Ready to scan" })).toBeVisible();
  await expect(page.getByText("Awaiting repository")).toBeVisible();
  await expect(page.getByText("No repository selected")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(page.locator(".scan-check")).toHaveCount(5);
  await expect(page.getByRole("link", { name: /Scan a public repository/i })).toBeVisible();
  await expect(page.locator(".scan-detail-section, .scan-activity, .scan-footer-cta")).toHaveCount(0);
});

test("live scanning shows only five backend-driven stage labels", async ({ page }) => {
  await page.goto("/assess/scanning");
  await expect(page.locator(".scan-check-name")).toHaveText([
    "Source access",
    "Secrets & credentials",
    "Dependencies",
    "Security patterns",
    "Finalizing report",
  ]);
  await expect(page.locator(".scan-check-status")).toHaveText(["Waiting","Waiting","Waiting","Waiting","Waiting"]);
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("connection screen has exactly two repository choices", async ({ page }) => {
  await page.goto("/assess");
  await expect(page.getByRole("group", { name: "Repository visibility" }).getByRole("button")).toHaveCount(2);
  await expect(page.getByRole("link", { name: /Preview scanning workspace/i })).toHaveCount(0);
});

test("legacy status API remains fail closed for unknown runs", async ({ request }) => {
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

test("unknown run never shows an invented completed scan", async ({ page }) => {
  await page.goto("/assess/scanning?run=safeTestRun123456");
  await expect(page.getByText("Scan interrupted")).toBeVisible();
  await expect(page.getByText(/not configured/i)).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
});

test("mobile and desktop scanning UI has no horizontal overflow", async ({ browser }) => {
  for (const width of [320, 375, 430, 768, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 810 }, isMobile: width < 500, hasTouch: width < 500,
    });
    const page = await context.newPage();
    await page.goto("/assess/scanning");
    await expect(page.getByRole("heading", { name: "Ready to scan" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, "horizontal overflow at " + width + "px").toBeLessThanOrEqual(1);
    await context.close();
  }
});


test("live progress and stage statuses follow the real stream, never a fake timer", async ({ page }) => {
  const runId = "12345678-1234-4321-9999-123456789012";
  const stageNames = ["access", "secrets", "dependencies", "patterns", "evidence"];
  await page.addInitScript(({ id, keys }) => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input !== "string" || input !== "/api/scan/public")
        return nativeFetch(input, init);
      const encode = new TextEncoder();
      const timestamp = new Date().toISOString();
      const snapshot = {
        runId: id, target: { name: "acme/testapp" }, status: "running", updatedAt: timestamp,
        checks: keys.map((key, i) => ({ key, status: i === 0 ? "complete" : i === 1 ? "running" : "queued" })),
        events: [], progress: { done: 1, total: 5 },
      };
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encode.encode(JSON.stringify({ type: "snapshot", snapshot }) + "\n"));
          window.setTimeout(() => {
            controller.enqueue(encode.encode(JSON.stringify({ type: "error", message: "Upstream disconnected." }) + "\n"));
            controller.close();
          }, 4000);
        },
      });
      return Promise.resolve(new Response(stream, { status: 200, headers: { "content-type": "application/x-ndjson" } }));
    };
  }, { id: runId, keys: stageNames });
  await page.goto("/assess/scanning?repo=acme%2Ftestapp");
  await expect(page.getByRole("heading", { name: "Scanning your app" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Assessment progress" })).toHaveAttribute("aria-valuenow", "20");
  await expect(page.locator(".scan-check-status")).toHaveText(["Done", "Scanning", "Waiting", "Waiting", "Waiting"]);
  await expect(page.getByText("1 of 5 checks")).toBeVisible();
  await expect(page.getByText("Upstream disconnected.")).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole("button", { name: /Retry this scan/i })).toBeVisible();
  await expect(page).toHaveURL(/\/assess\/scanning\?repo=/);
});
