import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";
import { parsePublicRepo, analyzeSource, parseDependencies } from "../lib/public-repo-scanner";

test("source checks use real input and redact suspected credentials", () => {
  const findings = analyzeSource([{ path: "src/config.ts", content: 'const apiKey = "abcdefghijklmnopqrstuvwxyz987654";\nconst x = eval(userValue);' }]);
  expect(findings.length).toBe(2);
  expect(findings[0].severity).toBe("high");
  expect(findings[0].evidence).not.toContain("abcdefghijklmnopqrstuvwxyz987654");
  expect(findings[1].title).toMatch(/dynamic code execution/i);
});

test("pinned lockfiles parse actual versions; repository input rejects unknown hosts", () => {
  const items = parseDependencies([{ path: "package-lock.json",
    content: JSON.stringify({ packages: { "": {}, "node_modules/example": { version: "1.2.3" } } }) }]);
  expect(items.deps).toEqual([{ name: "example", version: "1.2.3", ecosystem: "npm", path: "package-lock.json" }]);
  expect(parsePublicRepo("https://github.com/acme/project")).toEqual({ owner: "acme", repo: "project" });
  expect(() => parsePublicRepo("https://attacker.example/path")).toThrow();
  expect(() => parsePublicRepo("http://127.0.0.1/internal")).toThrow();
});

test("public scan POST rejects malformed repository and cross-origin requests", async ({ request }) => {
  const bad = await request.post("/api/scan/public", { data: { repo: "https://example.com/bad" } });
  expect(bad.status()).toBe(400);
  const cross = await request.post("/api/scan/public", {
    headers: { origin: "https://not-shipsafe.example" }, data: { repo: "acme/example" },
  });
  expect(cross.status()).toBe(403);
});

test("public source scan streams worker snapshots into full report experience", async ({ page }) => {
  const runId = "12345678-1234-4321-9999-123456789012";
  const snapshot = {
    runId, target: { name: "acme/testapp", revision: "0123456789abcdef" }, status: "completed",
    updatedAt: "2026-10-28T00:00:00.000Z",
    checks: ["access","secrets","dependencies","patterns","evidence"].map(key => ({ key, status: "complete" })),
    events: [{ id: "1", at: "2026-10-28T00:00:00.000Z", message: "Source checked" }],
    progress: { done: 5, total: 5 },
  };
  const report = { ...SAMPLE_REPORT, runId, appName: "acme/testapp", revision: "0123456789abcdef0123456789abcdef01234567" };
  await page.route("**/api/scan/public", route => route.fulfill({
    status: 200, headers: { "content-type": "application/x-ndjson" },
    body: JSON.stringify({ type: "snapshot", snapshot })+"\n"+JSON.stringify({ type: "report", report })+"\n",
  }));
  await page.goto("/assess");
  await page.getByRole("button", { name: /Public repository/i }).click();
  await page.getByRole("textbox", { name: "GitHub repository URL" }).fill("acme/testapp");
  await page.getByRole("button", { name: "Scan repository" }).click();
  // No extra click: completed, validated stream must navigate automatically.
  await expect(page).toHaveURL(/\/assess\/results\?local=/, { timeout: 12000 });
  await expect(page.getByText("REAL PUBLIC-SOURCE SCAN")).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
});

test("real report id without tab-held report does not leak or invent findings", async ({ page }) => {
  await page.goto("/assess/results?local=12345678-1234-4321-9999-123456789012");
  await expect(page.getByRole("heading", { name: /A verified report isn't available/i })).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(0);
});


test("live source scan integrates GitHub public tree and full report end-to-end", async ({ page }) => {
  test.skip(process.env.RUN_LIVE_SCAN !== "1", "External integration smoke test is opt-in");
  test.setTimeout(95_000);
  await page.goto("/assess");
  await page.getByRole("button", { name: /Public repository/i }).click();
  await page.getByRole("textbox", { name: "GitHub repository URL" }).fill("vercel/ms");
  await page.getByRole("button", { name: "Scan repository" }).click();
  // Real GitHub source -> real streamed checks -> auto result without clicking.
  try {
    await expect(page).toHaveURL(/\/assess\/results\?local=/, { timeout: 72_000 });
  } catch (error) {
    const details = await page.locator(".scan-visual-bottom").innerText().catch(() => "Unavailable");
    throw new Error("Live scan did not auto-open report. " + details.slice(0, 1100) + " " + String(error).slice(0, 300));
  }
  await expect(page.getByText("REAL PUBLIC-SOURCE SCAN")).toBeVisible();
  await expect(page.getByRole("heading", { name: "vercel/ms" })).toBeVisible();
  await expect(page.getByText(/Read-only public source scan|Static public-source scan/i).first()).toBeVisible();
});


test("failed stream remains on inspection screen and offers an immediate retry", async ({ page }) => {
  await page.route("**/api/scan/public", route => route.fulfill({
    status: 200, headers: { "content-type": "application/x-ndjson" },
    body: JSON.stringify({ type: "error", message: "GitHub returned a rate limit. Try later." }) + "\n",
  }));
  await page.goto("/assess/scanning?repo=acme%2Ftestapp");
  await expect(page.getByText("GitHub returned a rate limit. Try later.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Retry this scan/i })).toBeVisible();
  await expect(page).toHaveURL(/\/assess\/scanning\?repo=/);
  await expect(page.getByText("REAL PUBLIC-SOURCE SCAN")).toHaveCount(0);
});

test("invalid or incomplete report never triggers automatic navigation", async ({ page }) => {
  const id = "12345678-1234-4321-9999-123456789012";
  const snapshot = { runId: id, target: { name: "acme/testapp" }, status: "completed",
    updatedAt: "2026-10-28T00:00:00Z", checks: [], events: [], progress: { done: 5, total: 5 } };
  await page.route("**/api/scan/public", route => route.fulfill({
    status: 200, headers: { "content-type": "application/x-ndjson" },
    body: JSON.stringify({ type: "snapshot", snapshot })+"\n"+JSON.stringify({ type: "report", report: { bogus: true } })+"\n",
  }));
  await page.goto("/assess/scanning?repo=acme%2Ftestapp");
  await expect(page.getByText(/invalid report/i)).toBeVisible();
  await expect(page).toHaveURL(/\/assess\/scanning\?repo=/);
  await expect(page.getByRole("button", { name: /Retry this scan/i })).toBeVisible();
});

test("zero real findings is not mislabeled a clean security certificate", async ({ page }) => {
  const runId = "12345678-1234-4321-9999-123456789012";
  const snapshot = { runId, target: { name: "example/no-findings" }, status: "completed",
    updatedAt: "2026-10-28T00:00:00Z", checks: [], events: [], progress: { done: 5, total: 5 } };
  const report = { ...SAMPLE_REPORT, runId, appName: "example/no-findings", findings: [],
    scopeNote: "Static public-source scan, limited supported checks." };
  await page.route("**/api/scan/public", route => route.fulfill({
    status: 200, headers: { "content-type": "application/x-ndjson" },
    body: JSON.stringify({ type: "snapshot", snapshot })+"\n"+JSON.stringify({ type: "report", report })+"\n",
  }));
  await page.goto("/assess/scanning?repo=example%2Fno-findings");
  await expect(page).toHaveURL(/\/assess\/results\?local=/);
  await expect(page.getByText(/No candidates detected in supported checks/i)).toBeVisible();
  await expect(page.getByText("No findings flagged by these rules")).toBeVisible();
  await expect(page.getByText(/does not prove the application is secure/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Review coverage", exact: true })).toBeVisible();
});
