import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";

const runId = "12345678-1234-4321-9999-123456789012";
const snapshot = {
  runId, target: { name: "acme/testapp", revision: "a".repeat(40) }, status: "completed",
  updatedAt: "2026-10-28T00:00:00.000Z",
  checks: ["access", "secrets", "dependencies", "patterns", "evidence"].map(key => ({ key, status: "complete" })),
  events: [], progress: { done: 5, total: 5 },
};
const report = { ...SAMPLE_REPORT, runId, appName: "acme/testapp", revision: "a".repeat(40) };

test("completed public report survives refresh, tab navigation and appears in hamburger history", async ({ page }) => {
  await page.route("**/api/scan/public", route => route.fulfill({
    status: 200, headers: { "content-type": "application/x-ndjson" },
    body: JSON.stringify({ type: "snapshot", snapshot }) + "\n" +
      JSON.stringify({ type: "report", report }) + "\n",
  }));
  await page.goto("/assess/scanning?repo=acme%2Ftestapp");
  await expect(page).toHaveURL(/\/assess\/results\?local=/);
  await expect(page.getByRole("heading", { name: "acme/testapp" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "acme/testapp" })).toBeVisible();
  await page.goto("/");
  await page.getByRole("link", { name: "History" }).first().click();
  await expect(page).toHaveURL(/\/assess\/history/);
  await expect(page.getByRole("heading", { level: 1, name: /Investigations/i })).toBeVisible();
  await expect(page.locator(".history-report-row")).toHaveCount(1);
  await expect(page.getByText("acme/testapp")).toBeVisible();
  await page.getByRole("link", { name: "Open report" }).click();
  await expect(page).toHaveURL(/\/assess\/results\?local=/);
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
});

test("saved public history survives new tab and can be deleted", async ({ browser }) => {
  const ctx = await browser.newContext();
  const first = await ctx.newPage();
  await first.goto("/");
  await first.evaluate((r) => {
    localStorage.setItem("shipsafe:public-report:v1:" + r.runId, JSON.stringify(r));
    localStorage.setItem("shipsafe:public-history:v1", JSON.stringify([{
      runId:r.runId, appName:r.appName, finishedAt:r.finishedAt,
      findings:r.findings.length, savedAt:Date.now(),
    }]));
  }, report);
  const next = await ctx.newPage();
  await next.goto("/assess/history");
  await expect(next.getByRole("link", { name: "Open report" })).toBeVisible();
  next.once("dialog", dialog => dialog.accept());
  await next.getByRole("button", { name: "Delete report for acme/testapp" }).click();
  await expect(next.getByText("No agent reports saved yet.")).toBeVisible();
  await next.goto("/assess/results?local=" + runId);
  await expect(next.getByRole("heading", { name: /A verified report isn't available/i })).toBeVisible();
  await ctx.close();
});

test("refresh during public scan restarts a real request instead of displaying stale completion", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/scan/public", route => {
    requests++;
    return route.fulfill({
      status: 200, headers: { "content-type": "application/x-ndjson" },
      body: JSON.stringify({ type: "error", message: "Network unavailable: retry safely." }) + "\n",
    });
  });
  await page.goto("/assess/scanning?repo=acme%2Ftestapp");
  await expect(page.getByText("Network unavailable: retry safely.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Investigation interrupted" })).toBeVisible();
  expect(requests).toBe(2);
  await expect(page).not.toHaveURL(/\/assess\/results/);
});

test("mobile hamburger has Scan history without requiring GitHub login", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  await nav.getByRole("link", { name: "History" }).click();
  await expect(page).toHaveURL(/\/assess\/history/);
  await expect(page.getByRole("heading", { level: 1, name: /Investigations/i })).toBeVisible();
  await expect(page.getByText("No agent reports saved yet.")).toBeVisible();
  await context.close();
});
