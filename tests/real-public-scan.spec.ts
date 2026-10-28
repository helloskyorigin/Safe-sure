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
  await page.getByRole("textbox", { name: "Public GitHub repository" }).fill("acme/testapp");
  await page.getByRole("button", { name: "Scan public repository" }).click();
  await expect(page).toHaveURL(/\/assess\/scanning\?repo=acme%2Ftestapp/);
  await expect(page.getByRole("link", { name: /View full real results/i })).toBeVisible();
  await page.getByRole("link", { name: /View full real results/i }).click();
  await expect(page).toHaveURL(/\/assess\/results\?local=/);
  await expect(page.getByText("REAL PUBLIC-SOURCE SCAN")).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
});

test("real report id without tab-held report does not leak or invent findings", async ({ page }) => {
  await page.goto("/assess/results?local=12345678-1234-4321-9999-123456789012");
  await expect(page.getByRole("heading", { name: /A verified report isn't available/i })).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(0);
});
