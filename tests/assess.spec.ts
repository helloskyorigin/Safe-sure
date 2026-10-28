import { test, expect } from "@playwright/test";

test("main landing CTA opens the assessment connection screen", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".hero-action").getByRole("link", { name: /Assess your application/i }).click();
  await expect(page).toHaveURL(/\/assess$/);
  await expect(page.getByRole("heading", { level: 1, name: /Better security starts with clarity/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connect your application" })).toBeVisible();
});

test("permissions disclosure and GitHub connection status are honest and interactive", async ({ page }) => {
  await page.goto("/assess");
  const permission = page.getByRole("button", { name: /What access will ShipSafe request/i });
  await expect(permission).toHaveAttribute("aria-expanded", "false");
  await permission.click();
  await expect(permission).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Repository contents: read")).toBeVisible();

  await page.getByRole("button", { name: "Connect with GitHub" }).click();
  const dialog = page.getByRole("dialog", { name: /GitHub connection is coming soon/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/No GitHub authorization was initiated/i)).toBeVisible();
  await dialog.getByRole("button", { name: /Understood/i }).click();
  await expect(dialog).not.toBeVisible();
});

test("workflow walkthrough toggles and reports no fabricated scan", async ({ page }) => {
  await page.goto("/assess");
  await expect(page.getByText("NOT CONNECTED")).toBeVisible();
  await expect(page.getByText(/No assessment is running/i)).toBeVisible();
  const walkthrough = page.getByRole("button", { name: /Explore the flow/i });
  await walkthrough.click();
  await expect(page.getByText("Preview of the planned assessment flow")).toBeVisible();
  await page.getByRole("button", { name: /Hide walkthrough/i }).click();
  await expect(page.getByText("Preview of the planned assessment flow")).not.toBeVisible();
});

test("mobile connection view fits viewport, can scroll and navigate back", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/assess");
  await expect(page.getByRole("heading", { name: /Better security starts with clarity/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect with GitHub" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole("link", { name: /Back to website/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await context.close();
});

test("small-screen assessment does not overflow at 320px", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/assess");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await context.close();
});
