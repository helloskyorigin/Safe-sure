import { test, expect } from "@playwright/test";

test("homepage begins at the hero and ignores late non-user scroll restoration", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Know the risks/i })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: /Know the risks/i })).toBeVisible();
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
