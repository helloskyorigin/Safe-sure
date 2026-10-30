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

test("GitHub connection is the single source-selection experience", async ({ page }) => {
  await page.route("**/api/auth/github/status", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ configured: true, connected: true, login: "founder" }),
  }));
  await page.route("**/api/github/repositories", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ repositories: [
      { fullName: "founder/app", private: true },
      { fullName: "founder/open", private: false },
    ] }),
  }));
  await page.goto("/assess");
  await expect(page.getByRole("heading", {name:/Choose the codebase to investigate/})).toBeVisible();
  await expect(page.locator(".connect-reassurance")).toContainText("No source changes");
  const select = page.getByRole("combobox", { name: "Repository" });
  await expect(select.locator("option")).toHaveCount(2);
  await select.selectOption("founder/open");
  await page.getByRole("button", {name:"Begin analysis"}).click();
  await expect(page).toHaveURL(/\/assess\/scanning\?github=founder%2Fopen/);
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

test("developer findings expand on demand and severity filtering stays accurate", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.locator(".result-finding-card")).toHaveCount(6);
  const high=page.getByRole("button",{name:"Show High findings"});
  await high.click();
  await expect(page.locator(".result-finding-card")).toHaveCount(2);
  await page.locator(".result-finding-card").first().locator("summary").first().click();
  await expect(page.locator(".result-finding-card").first().getByRole("heading",{name:"How to fix"})).toBeVisible();
  await page.getByRole("button",{name:"Show all findings"}).click();
  await expect(page.locator(".result-finding-card")).toHaveCount(6);
});

test("mobile report finding cards are tappable without overflow", async ({ browser }) => {
  for(const width of [320,375,768]){
    const context=await browser.newContext({viewport:{width,height:810},isMobile:width<500,hasTouch:width<500});
    const page=await context.newPage();await page.goto("/assess/results");
    const card=page.locator(".result-finding-card").first();
    await card.locator("summary").first().click();
    await expect(card.getByRole("heading",{name:"Potential impact"})).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow,"report horizontal overflow at "+width).toBeLessThanOrEqual(2);
    await context.close();
  }
});
