import { test, expect } from "@playwright/test";

test("homepage starts with its message and respects intentional subsequent scrolling", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: /Built with AI/i })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  await expect(page.locator(".final-cta-inner")).toBeAttached();
});

test("section links navigate to the requested section without scroll resets", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "How it works" }).click();
  await expect(page).toHaveURL(/#how$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await nav.getByRole("link", { name: "Sample report" }).click();
  await expect(page).toHaveURL(/#product$/);
  await expect(page.locator("#product")).toBeVisible();
});

test("mobile first paint and native touch scroll remain stable", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: /Built with AI/i })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 550, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  await context.close();
});

test("marketing clearly states current scan limits rather than claiming full AI pentesting", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Secuvora — Security Checks for AI-Built Apps");
  await expect(page.locator(".hero .eyebrow")).toContainText("AI-BUILT APP SECURITY");
  await expect(page.locator(".hero-sub")).toContainText("file-level evidence");
  await expect(page.locator(".price-card")).toContainText("FREE");
  await expect(page.locator("#faq")).toContainText("not live penetration testing");
  await page.goto("/assess");
  await expect(page.locator(".connect-header-mark")).toContainText("SECUVORA · SECURITY AGENT");
});
