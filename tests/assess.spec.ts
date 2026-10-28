import { test, expect } from "@playwright/test";

test("landing assessment CTA opens exactly two choices without unnecessary fields", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".hero-action").getByRole("link", { name: /Run security agent/i }).click();
  await expect(page).toHaveURL(/\/assess$/);
  await expect(page.getByRole("heading", { level: 1, name: /Which repository should your agent inspect/i })).toBeVisible();
  await expect(page.getByRole("group", { name: "Repository visibility" }).getByRole("button")).toHaveCount(2);
  await expect(page.getByRole("button", { name: /Public repository/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Private repository/i })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /GitHub repository URL/i })).toHaveCount(0);
  await expect(page.getByText(/Explore the flow|What comes after connection|What will Secuvora look for/i)).toHaveCount(0);
});

test("public choice reveals one URL field, validates, then opens scanning", async ({ page }) => {
  await page.goto("/assess");
  const publicChoice = page.getByRole("button", { name: /Public repository/i });
  await publicChoice.click();
  await expect(publicChoice).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("textbox", { name: "GitHub repository URL" })).toBeVisible();
  await page.getByRole("textbox", { name: "GitHub repository URL" }).fill("https://evil.example/my/repo");
  await page.getByRole("button", { name: "Run security agent" }).click();
  await expect(page.locator("#connect-url-error")).toContainText("Enter a valid GitHub URL");
  await page.getByRole("textbox", { name: "GitHub repository URL" }).fill("github.com/vercel/ms");
  await page.getByRole("button", { name: "Run security agent" }).click();
  await expect(page).toHaveURL(/\/assess\/scanning\?repo=vercel%2Fms/);
});

test("private choice only shows its connection state when GitHub is unconfigured", async ({ page }) => {
  await page.route("**/api/auth/github/status", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ configured: false, connected: false, login: null }),
  }));
  await page.goto("/assess");
  const privateChoice = page.getByRole("button", { name: /Private repository/i });
  await privateChoice.click();
  await expect(privateChoice).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/Private GitHub access isn't configured/i)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "GitHub repository URL" })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("private connected account selects a real authorized repo and continues to scan", async ({ page }) => {
  await page.route("**/api/auth/github/status", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ configured: true, connected: true, login: "founder" }),
  }));
  await page.route("**/api/github/repositories", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ repositories: [
      { fullName: "founder/alpha", private: true },
      { fullName: "founder/beta", private: true },
      { fullName: "founder/open", private: false },
    ] }),
  }));
  await page.goto("/assess");
  await page.getByRole("button", { name: /Private repository/i }).click();
  await expect(page.getByText(/Connected as/)).toBeVisible();
  const select = page.getByRole("combobox", { name: "Choose repository" });
  await expect(select.locator("option")).toHaveCount(2);
  await select.selectOption("founder/beta");
  await page.getByRole("button", { name: "Run security agent" }).click();
  await expect(page).toHaveURL(/\/assess\/scanning\?private=founder%2Fbeta/);
});

test("returning from GitHub OAuth opens private choice automatically", async ({ page }) => {
  await page.route("**/api/auth/github/status", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ configured: true, connected: false, login: null }),
  }));
  await page.goto("/assess?connected=1");
  await expect(page.getByRole("button", { name: /Private repository/i })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: /Continue with GitHub/i })).toBeVisible();
});

test("mobile connection fits at 320, 375 and 430px with both flows", async ({ browser }) => {
  for (const width of [320, 375, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 812 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto("/assess");
    await page.getByRole("button", { name: /Public repository/i }).click();
    await expect(page.getByRole("textbox", { name: "GitHub repository URL" })).toBeVisible();
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, "public mode overflow at " + width).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: /Private repository/i }).click();
    await expect(page.getByRole("textbox", { name: "GitHub repository URL" })).toHaveCount(0);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, "private mode overflow at " + width).toBeLessThanOrEqual(1);
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/$/);
    await context.close();
  }
});
