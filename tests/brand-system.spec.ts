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
    const mark = page.locator(".secuvora-brand .secuvora-mark").first();
    await expect(mark).toBeVisible();
    const state = await mark.evaluate(svg => {
      const shell = svg.querySelector(".secuvora-mark-shell") as SVGElement;
      const core = svg.querySelector(".secuvora-mark-core") as SVGElement;
      return {
        viewBox: svg.getAttribute("viewBox"),
        pathCount: svg.querySelectorAll("path").length,
        shell: getComputedStyle(shell).fill,
        core: getComputedStyle(core).fill,
        stroke: getComputedStyle(svg).stroke,
      };
    });
    expect(state.viewBox).toBe("0 0 512 512");
    expect(state.pathCount).toBe(7);
    expect(state.shell).not.toBe(state.core);
    expect(state.shell).not.toBe("rgba(0, 0, 0, 0)");
    expect(state.core).not.toBe("rgba(0, 0, 0, 0)");
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

test("FAQ starts collapsed and opened answers stay visible in both themes", async ({ browser }) => {
  for (const theme of ["light", "dark"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(value => localStorage.setItem("secuvora:theme", value), theme);
    const page = await context.newPage();
    await page.goto("/");
    const triggers = page.locator("#faq .faq-trigger");
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "false");
    const count = await triggers.count();
    for (let i = 0; i < count; i++) await expect(triggers.nth(i)).toHaveAttribute("aria-expanded", "false");

    await triggers.first().scrollIntoViewIfNeeded();
    await triggers.first().click();
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "true");

    const wrap = page.locator("#faq-answer-0");
    const answer = wrap.locator(".faq-answer");
    await expect(wrap).toHaveAttribute("data-open", "true");
    await expect(answer).toBeVisible();
    await page.waitForTimeout(450);
    await expect(answer).toBeVisible();
    const state = await wrap.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return { height: rect.height, opacity: Number.parseFloat(style.opacity || "1") };
    });
    expect(state.height).toBeGreaterThan(20);
    expect(state.opacity).toBeGreaterThan(.95);
    await context.close();
  }
});

test("landing header uses the icon plus dotless Secuvora wordmark", async ({ page }) => {
  await page.goto("/");
  const brand = page.locator(".header .secuvora-brand").first();
  await expect(brand).toBeVisible();
  await expect(brand.locator(".secuvora-mark")).toBeVisible();
  await expect(brand.locator(".secuvora-wordmark")).toHaveText("secuvora");
  await expect(page.locator(".preview-top .secuvora-wordmark")).toHaveText("secuvora");
});

test("top navigation CTA uses tuned deterministic premium typography", async ({ page }) => {
  await page.goto("/");
  const style = await page.locator(".top-cta").evaluate(el => {
    const css = getComputedStyle(el);
    return {
      family: css.fontFamily,
      weight: Number.parseInt(css.fontWeight, 10),
      spacing: css.letterSpacing,
      radius: css.borderRadius,
    };
  });
  expect(style.family).toMatch(/system-ui|Segoe UI|Roboto|Arial|ui-sans-serif/i);
  expect(style.weight).toBeGreaterThanOrEqual(700);
  expect(Number.parseFloat(style.spacing)).toBeLessThan(0);
  expect(Number.parseFloat(style.radius)).toBeGreaterThanOrEqual(8);
});
