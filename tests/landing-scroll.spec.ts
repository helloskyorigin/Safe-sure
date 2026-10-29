import { test, expect } from "@playwright/test";

test("homepage begins at the hero and ignores late non-user scroll restoration", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Security risks don't exist in isolation/i })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBeLessThan(15);

  // Simulate an embedded preview restoring a stale scroll position after hydration.
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 3000 }).toBeLessThan(15);
});

test("intentional navigation still scrolls to the requested section", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "How it works" }).click();
  await expect(page).toHaveURL(/#how$/);
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeGreaterThan(100);
});

test("mobile first paint shows hero and supports real touch scrolling", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Security risks don't exist in isolation/i })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBeLessThan(15);
  // Verify the client-side restoration guard is ready before dispatching a real user-intent event.
  await page.waitForFunction(() => document.documentElement.dataset.shipsafeScrollGuard === "active");
  await page.evaluate(() => {
    window.dispatchEvent(new Event("touchstart"));
    window.scrollTo({ top: 550, behavior: "instant" });
  });
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 3000 }).toBeGreaterThan(300);
  await context.close();
});


test("Secuvora shows confident AI-agent positioning without beta or launch-only language", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Security risks don't exist in isolation/i })).toBeVisible();
  await expect(page.locator(".hero .eyebrow")).toContainText("SECUVORA / SECURITY INVESTIGATIONS");
  await expect(page.locator(".hero-sub")).toContainText("read-only source and dependency analysis");
  await expect(page).toHaveTitle("Secuvora — Security Investigations");
  await expect(page.locator("body")).not.toContainText(/\bbeta\b|not just before launch|before you ship/i);
  await expect(page.locator(".final-eyebrow")).toHaveText(/SECURITY INVESTIGATIONS/);
  await page.goto("/assess");
  await expect(page.locator(".connect-header-mark")).toContainText("SECUVORA / INVESTIGATIONS");
  await expect(page.locator("body")).not.toContainText(/\bbeta\b|not just before launch|before you ship/i);
});
