import { test, expect } from "@playwright/test";

test("landing renders all sections without scroll-triggered hiding or repeat reveals", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).not.toHaveClass(/landing-motion-active/);
  await expect(page.locator("[data-ship-motion]")).toHaveCount(0);
  const targets = ["#how .step", ".value-card", ".experience-shell", "#security .trust-item",
    "#pricing .price-card", "#faq .faq-list", ".final-cta-inner"];
  for (const selector of targets) {
    const node = page.locator(selector).first();
    await node.scrollIntoViewIfNeeded();
    await expect(node).toBeVisible();
    await expect(node).toHaveCSS("opacity", "1");
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  for (const selector of targets) {
    const node = page.locator(selector).first();
    await node.scrollIntoViewIfNeeded();
    await expect(node).toHaveCSS("opacity", "1");
    await expect(node).not.toHaveAttribute("data-ship-motion", /.+/);
  }
});

test("hero sample report is flat, not parallaxed, and cards do not overlap on phones", async ({ browser }) => {
  for (const width of [320, 375, 430, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 840 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const preview = page.locator(".hero .preview");
    await expect(preview).toHaveCSS("transform", "none");
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(bodyWidth, "horizontal overflow at " + width).toBeLessThanOrEqual(2);
    const b = await page.locator(".hero-text").boundingBox();
    const p = await page.locator(".preview-wrap").boundingBox();
    expect(b).toBeTruthy();
    expect(p).toBeTruthy();
    if (width <= 850) {
      expect(p!.y, "preview overlaps hero text at " + width).toBeGreaterThanOrEqual(b!.y + b!.height - 2);
    } else {
      expect(p!.x, "preview overlaps hero column at " + width).toBeGreaterThanOrEqual(b!.x + b!.width - 3);
    }
    await context.close();
  }
});

test("FAQ rows remain readable after opening and scrolling away and back", async ({ page }) => {
  await page.goto("/");
  const faq = page.locator("#faq");
  await faq.scrollIntoViewIfNeeded();
  const rows = faq.locator(".faq-entry");
  await expect(rows.first()).toBeVisible();
  const third = faq.locator(".faq-trigger").nth(2);
  await third.click();
  await expect(third).toHaveAttribute("aria-expanded", "true");
  await page.locator("#how").scrollIntoViewIfNeeded();
  await faq.scrollIntoViewIfNeeded();
  await expect(third).toHaveAttribute("aria-expanded", "true");
  await expect(rows.first()).toHaveCSS("opacity", "1");
  await third.click();
  await expect(third).toHaveAttribute("aria-expanded", "false");
});
