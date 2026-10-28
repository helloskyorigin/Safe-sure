import { test, expect } from "@playwright/test";

test("scroll effects are attached to many landing sections, not only one reveal", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.classList.contains("landing-motion-active"));
  const effects = await page.locator("[data-ship-motion]").count();
  expect(effects).toBeGreaterThanOrEqual(40);

  for (const kind of ["rise", "slide-left", "slide-right", "pop", "blur", "scale"]) {
    await expect(page.locator('[data-ship-motion="' + kind + '"]').first()).toBeAttached();
  }
  const target = page.locator("#how .section-heading");
  await expect(target).toHaveAttribute("data-ship-motion", "rise");
  // It starts outside the first viewport and must not already be revealed.
  await expect(target).not.toHaveClass(/ship-motion-revealed/);
  // CSS transition begins at hydration; let the entrance-to-hidden transition settle.
  await expect.poll(async () => Number(await target.evaluate(el => getComputedStyle(el).opacity)),
    { timeout: 2500 }).toBeLessThan(0.1);
});

test("scroll into view reveals all process steps in a stagger and never replays", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.classList.contains("landing-motion-active"));
  // Inform the existing restoration guard that scrolling is intentional.
  await page.evaluate(() => window.dispatchEvent(new Event("wheel")));
  const first = page.locator("#how .step").first();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveClass(/ship-motion-revealed/);
  const heading = page.locator("#how .section-heading");
  await expect(heading).toHaveClass(/ship-motion-revealed/);
  const session = await first.getAttribute("data-ship-motion-key");
  expect(session).toBeTruthy();
  const saved = await page.evaluate(() => JSON.parse(sessionStorage.getItem("shipsafe:landing-reveals:v2") || "[]") as string[]);
  expect(saved).toContain(session);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(first).toHaveClass(/ship-motion-revealed/);
  await first.scrollIntoViewIfNeeded();
  await expect(first).toHaveClass(/ship-motion-revealed/);
  await expect(first).toHaveCSS("opacity", "1");

  // A same-tab revisit does not replay completed animations.
  await page.goto("/assess");
  await page.goto("/");
  await page.waitForFunction(() => document.body.classList.contains("landing-motion-active"));
  await expect(page.locator("#how .step").first()).toHaveClass(/ship-motion-revealed/);
});

test("deeper sections reveal distinct motion targets without repeat", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.body.classList.contains("landing-motion-active"));
  await page.evaluate(() => window.dispatchEvent(new Event("wheel")));
  for (const selector of [
    ".value-heading h2", ".value-card .value-card-content",
    ".experience-shell .experience-toolbar", "#security .trust-item",
    "#pricing .price-card", "#faq .faq-entry", ".final-cta-inner h2", ".footer-identity",
  ]) {
    const node = page.locator(selector).first();
    await node.scrollIntoViewIfNeeded();
    await expect(node, "One-shot motion missing on " + selector).toHaveClass(/ship-motion-revealed/, { timeout: 4000 });
  }
});

test("reduced-motion readers see everything without hidden content or delayed effects", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "How ShipSafe works" })).toBeAttached();
  expect(await page.locator("body.landing-motion-active").count()).toBe(0);
  const target = page.locator("#how .section-heading");
  await expect(target).toHaveCSS("opacity", "1");
  await context.close();
});

test("mobile 320 to 430 widths allow deliberate scroll and no horizontal overflow after reveals", async ({ browser }) => {
  for (const width of [320, 375, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 812 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForFunction(() => document.body.classList.contains("landing-motion-active"));
    await page.evaluate(() => window.dispatchEvent(new Event("touchstart")));
    const node = page.locator("#security .trust-item").first();
    await node.scrollIntoViewIfNeeded();
    await expect(node).toHaveClass(/ship-motion-revealed/);
    const x = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(x, "overflow at " + width).toBeLessThanOrEqual(1);
    const y = await page.evaluate(() => window.scrollY);
    expect(y, "scroll blocked at " + width).toBeGreaterThan(200);
    await context.close();
  }
});
