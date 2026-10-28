import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const routes = [
  "/", "/assess", "/assess/scanning", "/assess/results", "/assess/history",
  "/legal", "/privacy", "/terms", "/refunds", "/security", "/contact",
] as const;
const widths = [320, 360, 375, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920];
const screenshotRoutes = new Set(["/", "/assess", "/assess/results", "/legal", "/privacy"]);
const screenshotWidths = new Set([320, 768, 1440]);

for (const width of widths) {
  test("all eleven product and policy routes fit at " + width + "px", async ({ browser }) => {
    test.setTimeout(135_000);
    const ctx = await browser.newContext({
      viewport: { width, height: 820 },
      isMobile: width <= 430,
      hasTouch: width <= 430,
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route + " HTTP status at " + width + "px").toBe(200);
      await expect(page.locator("main").first(), route + " missing landmark").toBeVisible();
      await expect(page.getByRole("heading", { level: 1 }).first(), route + " missing page title").toBeVisible();

      const state = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const heading = document.querySelector("h1")?.getBoundingClientRect();
        return {
          overflow: Math.max(0, document.documentElement.scrollWidth - viewport),
          titleOverflow: heading ? Math.max(0, heading.right - viewport) : 0,
          invalidViewport: viewport <= 0,
        };
      });
      expect(state.invalidViewport, route + " invalid viewport at " + width).toBe(false);
      expect(state.overflow, route + " creates horizontal page overflow at " + width).toBeLessThanOrEqual(2);
      expect(state.titleOverflow, route + " title clipped outside viewport at " + width).toBeLessThanOrEqual(3);

      if (screenshotWidths.has(width) && screenshotRoutes.has(route)) {
        await mkdir("test-results/ux-snapshots", { recursive: true });
        const slug = route === "/" ? "home" : route.replaceAll("/", "-").replace(/^-/, "");
        await page.screenshot({
          path: "test-results/ux-snapshots/" + slug + "-" + width + ".png",
          animations: "disabled", fullPage: true,
        });
      }
    }
    await ctx.close();
  });
}

test("policy navigation is a disclosure on phones, sticky outline on desktop, all sections reachable", async ({ browser }) => {
  for (const width of [320, 390, 768, 1440]) {
    const ctx = await browser.newContext({ viewport:{ width, height:820 } });
    const page = await ctx.newPage();
    await page.goto("/privacy");
    const mobile = page.getByRole("navigation", { name:"Policy sections on smaller screens" });
    const desktop = page.getByRole("navigation", { name:"On this page" });
    if (width <= 700) {
      await expect(mobile).toBeVisible();
      await expect(desktop).toBeHidden();
      const summary = mobile.locator("summary");
      await expect(summary).toBeVisible();
      await summary.click();
      const dataLink = mobile.getByRole("link", { name:/Information processed/ });
      await expect(dataLink).toBeVisible();
      await dataLink.click();
      await expect(page).toHaveURL(/\/privacy#data$/);
      await expect(page.locator("#data")).toBeVisible();
    } else {
      await expect(mobile).toBeHidden();
      await expect(desktop).toBeVisible();
      await desktop.getByRole("link", { name:/Information processed/ }).click();
      await expect(page).toHaveURL(/\/privacy#data$/);
    }
    await ctx.close();
  }
});

test("responsive landing nav has accessible 44px toggle, escape and breakpoint behavior", async ({ browser }) => {
  for (const width of [320, 390, 768, 820]) {
    const ctx = await browser.newContext({ viewport: { width, height: 740 } });
    const page = await ctx.newPage();
    await page.goto("/");
    const toggle = page.getByRole("button", { name:"Open navigation" });
    await expect(toggle).toBeVisible();
    const box = await toggle.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(43);
    expect(box?.height).toBeGreaterThanOrEqual(43);
    await toggle.click();
    await expect(page.getByRole("button", { name:"Close navigation" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name:"Mobile navigation" }).getByRole("link", { name:"Agent history" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name:"Open navigation" })).toHaveAttribute("aria-expanded", "false");
    await ctx.close();
  }

  const desktop = await browser.newContext({ viewport:{width:1024,height:820} });
  const page = await desktop.newPage();
  await page.goto("/");
  await expect(page.getByRole("navigation", { name:"Main navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name:"Open navigation" })).toBeHidden();
  await desktop.close();
});

test("policy pages have real links, a unique primary heading and no fictional contact promise", async ({ page }) => {
  for (const route of ["/legal", "/privacy", "/terms", "/security", "/contact", "/refunds"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const hrefs = await page.locator('main a[href^="/"]').evaluateAll(nodes =>
      nodes.map(node => (node as HTMLAnchorElement).getAttribute("href") || ""));
    for (const link of hrefs) {
      expect(link).toMatch(/^\/(?:$|[a-z/#-])/);
    }
    expect((await page.locator("main").innerText()).toLowerCase()).not.toContain("placeholder@example.com");
  }
  await page.goto("/privacy");
  await expect(page.getByText(/system-font stack/)).toBeVisible();
  await expect(page.getByText(/individual reports from Agent history/)).toBeVisible();
  await page.goto("/legal");
  await expect(page.getByText(/Real public-source scanning is available/)).toBeVisible();
});
