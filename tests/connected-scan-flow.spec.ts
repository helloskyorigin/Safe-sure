import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";

const runId = "12345678-1234-4321-9999-123456789012";

for (const visibility of ["public", "private"] as const) {
  test("authorized " + visibility + " repo uses one stream and opens its stored report", async ({ page }) => {
    const repo = "founder/" + visibility + "-app";
    await page.route("**/api/auth/github/status", route => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({
        configured: true, connected: true, login: "founder", storageConfigured: true,
      }),
    }));
    await page.route("**/api/github/repositories", route => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ repositories: [{ fullName: repo, private: visibility === "private" }] }),
    }));
    let connectedScans = 0;
    await page.route("**/api/scan/private", async route => {
      const body = route.request().postDataJSON() as { repo?: string };
      expect(body.repo).toBe(repo);
      connectedScans++;
      const snapshot = {
        runId, target: { name: repo }, status: "completed",
        updatedAt: "2026-10-29T00:00:00.000Z",
        checks: ["access", "secrets", "dependencies", "patterns", "evidence"]
          .map(key => ({ key, status: "complete" })),
        events: [], progress: { done: 5, total: 5 },
      };
      await route.fulfill({
        status: 200, headers: { "content-type": "application/x-ndjson" },
        body: JSON.stringify({ type: "snapshot", snapshot }) + "\n" +
          JSON.stringify({ type: "stored", runId }) + "\n",
      });
    });
    await page.route("**/api/assessments/*/report", route => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ ...SAMPLE_REPORT, runId, appName: repo, revision: "a".repeat(40) }),
    }));

    await page.goto("/assess");
    await expect(page.getByText("Connected as")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Repository" })).toHaveValue(repo);
    await page.getByRole("button", { name: "Begin analysis" }).click();

    await expect(page).toHaveURL(new RegExp("/assess/results\\?run=" + runId), { timeout: 12000 });
    await expect(page.locator(".result-finding-card")).toHaveCount(SAMPLE_REPORT.findings.length);
    await expect(page.getByText("AUTHORIZED GITHUB REPOSITORY")).toBeVisible();
    expect(connectedScans).toBe(1);
  });
}
