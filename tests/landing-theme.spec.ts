import { test, expect } from "@playwright/test";

const criticalSelectors = [
  ".hero-text h1",
  ".hero-sub",
  ".preview",
  "#how .section-heading h2",
  "#how .step:first-child",
  ".value-card:first-child",
  ".experience-shell",
  "#security .trust-item:first-child",
  "#pricing .price-card",
  "#faq .faq-trigger",
  ".final-cta-inner h2",
  ".footer-identity",
];

test("mobile hamburger contains a persistent dark mode control", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation" }).click();
  const theme = page.getByRole("button", { name: "Switch to dark mode" });
  await expect(theme).toBeVisible();
  await expect(theme).toHaveAttribute("aria-pressed", "false");

  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("secuvora:theme"))).toBe("dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("secuvora:theme"))).toBe("light");
  await context.close();
});

for (const theme of ["light", "dark"] as const) {
  test(theme + " theme keeps landing content visible and readable across widths", async ({ browser }) => {
    for (const width of [320, 375, 430, 1024, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        isMobile: width < 500,
        hasTouch: width < 500,
        reducedMotion: "reduce",
      });
      await context.addInitScript(value => localStorage.setItem("secuvora:theme", value), theme);
      const page = await context.newPage();
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      for (const selector of criticalSelectors) {
        const node = page.locator(selector).first();
        await expect(node, selector + " should be attached").toBeAttached();
        const state = await node.evaluate(el => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            display: style.display,
            visibility: style.visibility,
            opacity: Number.parseFloat(style.opacity || "1"),
            color: style.color,
            width: rect.width,
            height: rect.height,
          };
        });
        expect(state.display, selector + " display at " + width).not.toBe("none");
        expect(state.visibility, selector + " visibility at " + width).not.toBe("hidden");
        expect(state.opacity, selector + " opacity at " + width).toBeGreaterThan(0.9);
        expect(state.color, selector + " transparent text at " + width).not.toBe("rgba(0, 0, 0, 0)");
        expect(state.width, selector + " width at " + width).toBeGreaterThan(0);
        expect(state.height, selector + " height at " + width).toBeGreaterThan(0);
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, theme + " horizontal overflow at " + width).toBeLessThanOrEqual(2);

      const landingBg = await page.locator(".landing-page").evaluate(el => getComputedStyle(el).backgroundColor);
      if (theme === "dark") {
        expect(landingBg).toBe("rgb(9, 13, 20)");
      } else {
        expect(landingBg).toBe("rgb(252, 253, 255)");
      }
      await context.close();
    }
  });
}

test("dark theme preserves distinct surfaces for major cards", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await context.addInitScript(() => localStorage.setItem("secuvora:theme", "dark"));
  const page = await context.newPage();
  await page.goto("/");

  const surfaces = await page.evaluate(() => {
    const bg = (selector: string) => getComputedStyle(document.querySelector(selector) as HTMLElement).backgroundColor;
    return {
      page: bg(".landing-page"),
      preview: bg(".preview"),
      report: bg(".experience-shell"),
      pricing: bg(".price-card"),
      menuButton: bg(".menu-toggle"),
    };
  });

  expect(surfaces.preview).not.toBe(surfaces.page);
  expect(surfaces.report).not.toBe(surfaces.page);
  expect(surfaces.pricing).not.toBe(surfaces.page);
  expect(surfaces.menuButton).not.toBe(surfaces.page);
  await context.close();
});
