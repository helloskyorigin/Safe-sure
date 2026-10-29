import { test, expect } from "@playwright/test";

test("connected source and saved report APIs fail closed before GitHub authentication", async ({ request }) => {
  const repos = await request.get("/api/github/repositories");
  expect([401, 503]).toContain(repos.status());
  expect(repos.headers()["cache-control"]).toContain("no-store");

  const reports = await request.get("/api/reports");
  expect(reports.status()).toBe(401);

  const scan = await request.post("/api/scan/private", { data: { repo: "vercel/ms" } });
  expect(scan.status()).toBe(401);

  const stored = await request.get("/api/assessments/12345678-1234-4321-9999-123456789012/report");
  expect(stored.status()).toBe(401);

  const deletion = await request.delete("/api/assessments/12345678-1234-4321-9999-123456789012/report");
  expect(deletion.status()).toBe(401);
});

test("assessment advertises only a real GitHub connection", async ({ page }) => {
  await page.goto("/assess");
  await expect(page.getByText(/GitHub connection is not configured/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Public repository/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Private repository/i })).toHaveCount(0);
});

test("saved reports screen never fabricates GitHub history without login", async ({ page }) => {
  await page.goto("/assess/history");
  await expect(page.getByRole("heading", { name: /Agent history/i })).toBeVisible();
  await expect(page.getByText(/GitHub sign-in required/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Connect GitHub/i })).toBeVisible();
});

test("unauthenticated direct connected scan URL cannot reveal findings", async ({ page }) => {
  await page.goto("/assess/scanning?github=someowner%2Fsomeprivate");
  await expect(page.getByText(/GitHub sign-in required/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Retry analysis/i })).toBeVisible();
  await expect(page).not.toHaveURL(/\/assess\/results/);
});
