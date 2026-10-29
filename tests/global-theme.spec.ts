import { test, expect } from "@playwright/test";

const globalRoutes = [
  { path: "/assess", root: ".assess-page" },
  { path: "/assess/scanning", root: ".scan-page" },
  { path: "/assess/results", root: ".result-page" },
  { path: "/assess/history", root: ".assess-page" },
  { path: "/legal", root: ".legal-site" },
  { path: "/privacy", root: ".legal-site" },
  { path: "/terms", root: ".legal-site" },
  { path: "/refunds", root: ".legal-site" },
  { path: "/security", root: ".legal-site" },
  { path: "/contact", root: ".legal-site" },
];

test("dark preference follows the user across app, report and legal routes", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await context.addInitScript(() => localStorage.setItem("secuvora:theme", "dark"));
  const page = await context.newPage();

  for (const route of globalRoutes) {
    await page.goto(route.path);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(route.root).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Switch to light mode" }).first()).toBeVisible();

    const rootBackground = await page.locator(route.root).first().evaluate(el => getComputedStyle(el).backgroundColor);
    expect(rootBackground, route.path + " should not fall back to white").not.toBe("rgb(255, 255, 255)");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, route.path + " dark-mode overflow").toBeLessThanOrEqual(2);
  }

  await context.close();
});

test("landing sample card has no hidden light strip in dark mode", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await context.addInitScript(() => localStorage.setItem("secuvora:theme", "dark"));
  const page = await context.newPage();
  await page.goto("/");

  const top = page.locator(".preview-top");
  await expect(top).toBeVisible();
  const styles = await top.evaluate(el => {
    const s = getComputedStyle(el);
    return { background: s.backgroundImage, color: s.color };
  });
  expect(styles.background).not.toContain("rgb(255, 255, 255)");
  await expect(page.locator(".preview-brand")).toBeVisible();
  await expect(page.locator(".example-tag")).toBeVisible();
  await context.close();
});

test("result download controls remain visible and usable in dark mode", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await context.addInitScript(() => localStorage.setItem("secuvora:theme", "dark"));
  const page = await context.newPage();
  await page.goto("/assess/results");

  const exportMenu = page.locator(".result-export-menu");
  await expect(exportMenu).toBeVisible();
  await exportMenu.locator("summary").click();
  await expect(page.getByRole("button", { name: /Fix plan/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Save PDF/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Export example JSON/ })).toBeVisible();

  const optionsBg = await page.locator(".result-export-options").evaluate(el => getComputedStyle(el).backgroundColor);
  expect(optionsBg).not.toBe("rgb(255, 255, 255)");
  await context.close();
});

test("theme can be changed from an inner route and persists back to landing", async ({ page }) => {
  await page.goto("/privacy");
  const toggle = page.getByRole("button", { name: "Switch to dark mode" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
