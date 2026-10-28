import { test, expect } from "@playwright/test";

test("private source and saved report APIs fail closed before GitHub authentication", async ({ request }) => {
  const repos = await request.get("/api/github/repositories");
  expect(repos.status()).toBe(401);
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

test("private assessment only advertises real GitHub installation when configured", async ({ page }) => {
  await page.goto("/assess");
  const privateButton = page.getByRole("button", { name: "Connect with GitHub" });
  await expect(privateButton).toBeVisible();
  await privateButton.click();
  await expect(page.getByRole("dialog", { name: /GitHub connection is coming soon/i })).toBeVisible();
});

test("saved reports screen never fabricates history without login", async ({ page }) => {
  await page.goto("/assess/history");
  await expect(page.getByRole("heading", { name: /Your saved reports/i })).toBeVisible();
  await expect(page.getByText(/GitHub sign-in required/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Connect with GitHub/i })).toBeVisible();
});

test("unauthenticated direct private scan URL cannot reveal findings", async ({ page }) => {
  await page.goto("/assess/scanning?private=someowner%2Fsomeprivate");
  await expect(page.getByText(/GitHub sign-in required/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Retry this scan/i })).toBeVisible();
  await expect(page).not.toHaveURL(/\/assess\/results/);
});
