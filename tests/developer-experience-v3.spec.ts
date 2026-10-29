import { test, expect } from "@playwright/test";

test("landing gives both real-scan and explicitly illustrative-report routes", async ({ page }) => {
  await page.goto("/");
  const primary = page.locator(".hero-action").getByRole("link", { name: /Start investigation/i });
  const example = page.locator(".hero-action").getByRole("link", { name: /Explore sample report/i });
  await expect(primary).toHaveAttribute("href", "/assess");
  await expect(example).toHaveAttribute("href", "/assess/results");
  await expect(page.locator(".hero-sub")).toContainText("surfaces evidence");
  await example.click();
  await expect(page).toHaveURL(/\/assess\/results$/);
  await expect(page.getByText("INTERACTIVE SAMPLE")).toBeVisible();
  await expect(page.getByText(/No application was connected, scanned or found vulnerable/)).toBeVisible();
});

test("public scan is the ready-to-use default; private connector remains a choice", async ({ page }) => {
  await page.goto("/assess");
  await expect(page.getByRole("button", { name:/Public repository/i })).toHaveAttribute("aria-pressed", "true");
  const input = page.getByRole("textbox", { name: "GitHub repository URL" });
  await expect(input).toBeVisible();
  await expect(page.getByText(/No account required/)).toBeVisible();
  await expect(page.getByRole("button", {name:"Begin analysis"})).toBeVisible();
  await expect(page.getByRole("heading", {name:/What should Secuvora investigate/})).toBeVisible();
  await expect(page.locator(".connect-reassurance")).toContainText("No source changes");

  await page.getByRole("button", {name:/Private repository/i}).click();
  await expect(page.getByRole("textbox", {name:"GitHub repository URL"})).toHaveCount(0);
  await page.getByRole("button", {name:/Public repository/i}).click();
  await expect(input).toBeVisible();
  await input.fill("https://github.com/vercel/ms.git");
  await page.getByRole("button", {name:"Begin analysis"}).click();
  await expect(page).toHaveURL(/\/assess\/scanning\?repo=vercel%2Fms/);
});

test("scan stages explain what checks do without inventing activity", async ({ page }) => {
  await page.goto("/assess/scanning");
  await expect(page.locator(".scan-check")).toHaveCount(5);
  await expect(page.locator(".scan-check-info small")).toHaveText([
    "Establish what can be inspected",
    "Inspect supported secret patterns",
    "Match supported packages to advisories",
    "Inspect code and configuration signals",
    "Consolidate findings and limitations",
  ]);
  await expect(page.locator(".scan-honesty")).toContainText("No code execution");
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  const opacity = await page.locator(".scan-card").evaluate(el => Number.parseFloat(getComputedStyle(el).opacity));
  expect(opacity).toBeGreaterThanOrEqual(.99);
});

test("finding pager moves through filtered results and respects disabled bounds", async ({ page }) => {
  await page.goto("/assess/results");
  const pager = page.getByRole("navigation", { name: "Move between filtered findings" });
  await expect(pager).toContainText("Finding 1 of 6");
  await expect(pager.getByRole("button", {name:"Previous finding"})).toBeDisabled();
  await pager.getByRole("button", {name:"Next finding"}).click();
  await expect(pager).toContainText("Finding 2 of 6");
  await pager.getByRole("button", {name:"Previous finding"}).click();
  await expect(pager).toContainText("Finding 1 of 6");

  await page.locator(".result-filter-pills").getByRole("button", { name:"High" }).click();
  await expect(pager).toContainText("Finding 1 of 2");
  await pager.getByRole("button", {name:"Next finding"}).click();
  await expect(pager).toContainText("Finding 2 of 2");
  await expect(pager.getByRole("button", {name:"Next finding"})).toBeDisabled();
  await expect(page.getByRole("link", {name:/Review findings/})).toHaveAttribute("href","#findings");
  await expect(page.getByRole("link", {name:"Coverage"})).toHaveAttribute("href","#coverage");
});

test("mobile report pagination remains tappable without overflowing", async ({ browser }) => {
  for (const width of [320, 375, 768]) {
    const context = await browser.newContext({viewport:{width,height:810},isMobile:width<500,hasTouch:width<500});
    const page = await context.newPage();
    await page.goto("/assess/results");
    const nav = page.getByRole("navigation", {name:"Move between filtered findings"});
    await expect(nav.getByRole("button", {name:"Next finding"})).toBeVisible();
    await nav.getByRole("button", {name:"Next finding"}).click();
    await expect(nav).toContainText("Finding 2 of 6");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "report pager horizontal overflow at "+width).toBeLessThanOrEqual(2);
    await context.close();
  }
});
