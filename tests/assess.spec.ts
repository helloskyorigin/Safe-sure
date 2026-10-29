import { test, expect } from "@playwright/test";

test("landing opens one GitHub repository connection flow", async ({ page }) => {
  await page.route("**/api/auth/github/status", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ configured: true, connected: false, login: null }),
  }));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".hero-action").getByRole("link", { name: /Start investigation/i }).click();
  await expect(page).toHaveURL(/\/assess$/);
  await expect(page.getByRole("heading", { level: 1, name: /Choose the codebase to investigate/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Connect GitHub/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Public repository/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Private repository/i })).toHaveCount(0);
  await expect(page.locator(".connect-reassurance")).toContainText("No source changes");
});

test("connection fails closed when GitHub deployment configuration is unavailable", async ({ page }) => {
  await page.route("**/api/auth/github/status", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ configured: false, connected: false, login: null }),
  }));
  await page.goto("/assess");
  await expect(page.getByText(/GitHub connection is not configured/i)).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Repository" })).toHaveCount(0);
});

test("connected account shows every authorized public and private repository", async ({ page }) => {
  await page.route("**/api/auth/github/status", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ configured: true, connected: true, login: "founder" }),
  }));
  await page.route("**/api/github/repositories", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ repositories: [
      { fullName: "founder/private-one", private: true },
      { fullName: "founder/public-one", private: false },
      { fullName: "founder/private-two", private: true },
    ] }),
  }));
  await page.goto("/assess");
  await expect(page.getByText(/Connected as/)).toBeVisible();
  const select = page.getByRole("combobox", { name: "Repository" });
  await expect(select.locator("option")).toHaveCount(3);
  await expect(select.locator("option").filter({ hasText: "founder/public-one" })).toHaveCount(1);
  await expect(select.locator("option").filter({ hasText: "founder/private-one" })).toContainText("Private");
  await select.selectOption("founder/public-one");
  await page.getByRole("button", { name: "Begin analysis" }).click();
  await expect(page).toHaveURL(/\/assess\/scanning\?github=founder%2Fpublic-one/);
});

test("connected source screen exposes GitHub repository access management", async ({ page }) => {
  await page.route("**/api/auth/github/status", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ configured: true, connected: true, login: "founder" }),
  }));
  await page.route("**/api/github/repositories", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ repositories: [] }),
  }));
  await page.goto("/assess");
  await expect(page.getByText("No authorized repositories")).toBeVisible();
  const manage = page.getByRole("link", { name: /Manage repository access/i });
  await expect(manage).toHaveAttribute("href", "https://github.com/settings/installations");
  await expect(page.getByText(/add repositories in GitHub/i)).toBeVisible();
});

test("mobile GitHub connection fits at 320, 375 and 430px", async ({ browser }) => {
  for (const width of [320, 375, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 812 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.route("**/api/auth/github/status", route => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ configured: true, connected: false, login: null }),
    }));
    await page.goto("/assess");
    await expect(page.getByRole("link", { name: /Connect GitHub/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, "GitHub connection overflow at " + width).toBeLessThanOrEqual(1);
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/$/);
    await context.close();
  }
});

test("single repository panel keeps one dominant action at narrow and desktop widths", async ({ browser }) => {
  for (const width of [320, 375, 430, 768, 1024]) {
    const context = await browser.newContext({ viewport: { width, height: 820 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.route("**/api/auth/github/status", route => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ configured: true, connected: true, login: "founder" }),
    }));
    await page.route("**/api/github/repositories", route => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ repositories: [{ fullName: "founder/project", private: true }] }),
    }));
    await page.goto("/assess");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Choose the codebase to investigate.");
    await expect(page.getByRole("combobox", { name: "Repository" })).toBeVisible();
    const action = page.getByRole("button", { name: "Begin analysis" });
    await expect(action).toBeVisible();
    const box = await action.boundingBox();
    expect(box?.height, "CTA touch height at " + width).toBeGreaterThanOrEqual(44);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "horizontal overflow at " + width).toBeLessThanOrEqual(2);
    await context.close();
  }
});
