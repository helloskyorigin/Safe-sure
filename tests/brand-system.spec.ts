import { test, expect } from "@playwright/test";

test("Secuvora brand mark is used without the old trailing dot", async ({ page }) => {
  for (const path of ["/", "/assess", "/assess/scanning", "/assess/results", "/assess/history", "/privacy", "/legal"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const brand = page.locator(".secuvora-brand").first();
    await expect(brand, "brand on " + path).toBeVisible();
    await expect(brand.locator(".secuvora-mark")).toBeVisible();
    await expect(brand.locator(".secuvora-wordmark")).toHaveText("secuvora");
    await expect(brand.locator(".secuvora-wordmark")).not.toContainText(".");
  }
});

test("brand mark remains visible in light and dark mode", async ({ browser }) => {
  for (const theme of ["light", "dark"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await context.addInitScript(value => localStorage.setItem("secuvora:theme", value), theme);
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const mark = page.locator(".header .secuvora-mark").first();
    await expect(mark).toBeVisible();
    const colors = await mark.evaluate(svg => {
      const shell = svg.querySelector(".secuvora-mark-shell") as SVGElement;
      const core = svg.querySelector(".secuvora-mark-core") as SVGElement;
      return { shell: getComputedStyle(shell).fill, core: getComputedStyle(core).fill };
    });
    expect(colors.shell).not.toBe(colors.core);
    expect(colors.shell).not.toBe("rgba(0, 0, 0, 0)");
    expect(colors.core).not.toBe("rgba(0, 0, 0, 0)");
    await context.close();
  }
});

test("top CTA and report cards use the same premium UI font stack", async ({ page }) => {
  await page.goto("/");
  const fonts = await page.evaluate(() => ({
    cta: getComputedStyle(document.querySelector(".top-cta") as HTMLElement).fontFamily,
    preview: getComputedStyle(document.querySelector(".preview") as HTMLElement).fontFamily,
    report: getComputedStyle(document.querySelector(".experience-shell") as HTMLElement).fontFamily,
  }));
  expect(fonts.cta).toBe(fonts.preview);
  expect(fonts.cta).toBe(fonts.report);
});

test("FAQ starts fully collapsed and opens only after interaction", async ({ page }) => {
  await page.goto("/");
  const triggers = page.locator("#faq .faq-trigger");
  await expect(triggers.first()).toHaveAttribute("aria-expanded", "false");
  const count = await triggers.count();
  for (let i = 0; i < count; i++) await expect(triggers.nth(i)).toHaveAttribute("aria-expanded", "false");
  await triggers.first().click();
  await expect(triggers.first()).toHaveAttribute("aria-expanded", "true");
});
