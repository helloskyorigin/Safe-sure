import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";

const runId = "12345678-1234-4321-9999-123456789012";
const name = "owner/safe-repo";
const keys = ["access","secrets","dependencies","patterns","evidence"];
function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    runId, target: { name }, status: "running",
    updatedAt: "2026-10-29T16:00:00.000Z",
    checks: keys.map((key, index) => ({
      key, status: index < 4 ? "complete" : "running",
    })),
    events: [], progress: { done: 4, total: 5 }, ...overrides,
  };
}
const completed = snapshot({
  status: "completed",
  checks: keys.map(key => ({ key, status: "complete" })),
  progress: { done: 5, total: 5 },
});
const stored = JSON.stringify({ type: "stored", runId }) + "\n";
const partial = JSON.stringify({ type: "snapshot", snapshot: snapshot() }) + "\n";
const final = JSON.stringify({ type: "snapshot", snapshot: completed }) + "\n";

test("connected scanner rejects a stored event before all stages finish", async ({ page }) => {
  let reportCalls = 0;
  await page.route("**/api/scan/private", route => route.fulfill({
    status: 200, headers: { "content-type": "application/x-ndjson" },
    body: partial + stored,
  }));
  await page.route("**/api/assessments/*/report", route => {
    reportCalls++;
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ ...SAMPLE_REPORT, runId, appName: name }) });
  });
  await page.goto("/assess/scanning?github=" + encodeURIComponent(name));
  await expect(page.getByRole("heading", { name: "Analysis interrupted" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Analysis progress" })).toHaveAttribute("aria-valuenow", "80");
  expect(reportCalls).toBe(0);
  await expect(page).toHaveURL(/\/assess\/scanning\?/);
});

test("a completed scan stays on scanner if the owner cannot retrieve the saved report", async ({ page }) => {
  let reportCalls = 0;
  await page.route("**/api/scan/private", route => route.fulfill({
    status: 200, headers: { "content-type": "application/x-ndjson" },
    body: partial + final + stored,
  }));
  await page.route("**/api/assessments/*/report", route => {
    reportCalls++;
    return route.fulfill({ status: 503, contentType: "application/json",
      body: JSON.stringify({ error: "Storage unavailable" }) });
  });
  await page.goto("/assess/scanning?github=" + encodeURIComponent(name));
  await expect(page.getByRole("heading", { name: "Analysis interrupted" })).toBeVisible();
  await expect(page.getByText(/saved report could not be opened/i)).toBeVisible();
  expect(reportCalls).toBe(1);
  await expect(page).toHaveURL(/\/assess\/scanning\?/);
});

test("completed scan verifies stored report before navigating to actual Results", async ({ page }) => {
  let reportCalls = 0;
  await page.route("**/api/scan/private", route => route.fulfill({
    status: 200, headers: { "content-type": "application/x-ndjson" },
    body: partial + final + stored,
  }));
  await page.route("**/api/assessments/*/report", route => {
    reportCalls++;
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ ...SAMPLE_REPORT, runId, appName: name, revision: "a".repeat(40) }) });
  });
  await page.goto("/assess/scanning?github=" + encodeURIComponent(name));
  await expect(page).toHaveURL(new RegExp("/assess/results\\?run=" + runId), { timeout: 12000 });
  await expect(page.getByRole("heading", { name })).toBeVisible();
  expect(reportCalls).toBeGreaterThanOrEqual(2);
});

test("scanner rejects completed status with an unfinished final stage", async ({ page }) => {
  await page.route("**/api/scan/private", route => route.fulfill({
    status: 200, headers: { "content-type": "application/x-ndjson" },
    body: JSON.stringify({ type: "snapshot", snapshot: snapshot({
      status: "completed",
      progress: { done: 4, total: 5 },
    }) }) + "\n" + stored,
  }));
  await page.goto("/assess/scanning?github=" + encodeURIComponent(name));
  await expect(page.getByRole("heading", { name: "Analysis interrupted" })).toBeVisible();
  await expect(page.getByText(/before every stage was resolved/i)).toBeVisible();
  await expect(page).toHaveURL(/\/assess\/scanning\?/);
});
