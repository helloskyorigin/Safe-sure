import { test, expect } from "@playwright/test";

test("application-first hero is concise and does not repeat agent language", async ({ page }) => {
  await page.goto("/");
  const hero=page.locator(".hero");
  await expect(hero.getByRole("heading",{level:1})).toContainText("Security risks.");
  await expect(hero.getByRole("heading",{level:1})).toContainText("Under investigation.");
  await expect(hero.locator(".eyebrow")).toHaveText("SECUVORA / SECURITY AGENT");
  await expect(hero.locator(".hero-sub")).toContainText("examines security signals");
  await expect(hero.locator(".hero-sub")).toContainText("shows what needs attention");
  await expect(hero.getByRole("link",{name:/Start investigation/i})).toHaveAttribute("href","/assess");
  await expect(hero.getByRole("link",{name:/Explore sample report/i})).toHaveAttribute("href","/assess/results");
  await expect(hero.locator(".preview-overline")).toHaveText("INVESTIGATION SUMMARY");
  await expect(hero.locator(".preview-heading h2")).toHaveText("Security findings");
  await expect(hero.locator(".example-tag")).toContainText("ILLUSTRATIVE REPORT");
  await expect(hero.locator(".preview-bottom")).toContainText("Fictional example");
  await expect(hero.locator(".under-cta")).toContainText("No source changes");
  await expect(hero.locator(".under-cta")).not.toContainText("Free");
  const after=await hero.locator(".hero-text h1 em").evaluate(el=>getComputedStyle(el,"::after").content);
  expect(after).toBe("none");
});

test("application check CTA opens the GitHub repository flow", async ({ page }) => {
  await page.route("**/api/auth/github/status", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ configured: true, connected: false, login: null }),
  }));
  await page.goto("/");
  await page.locator(".hero").getByRole("link",{name:"Start investigation"}).click();
  await expect(page).toHaveURL(/\/assess$/);
  await expect(page.getByRole("heading",{level:1})).toContainText("Choose the codebase");
  await expect(page.getByRole("link",{name:/Connect GitHub/})).toBeVisible();
  await expect(page.locator(".connect-subtitle")).toContainText("Connect GitHub once");
  await expect(page.locator(".connect-reassurance")).toContainText("No source changes");
});

test("same unchanged layout fits phone, tablet and desktop with new copy",async({browser})=>{
  for(const width of [320,375,430,768,1024,1440]){
    const context=await browser.newContext({viewport:{width,height:810},reducedMotion:"reduce"});
    const page=await context.newPage();
    await page.goto("/");
    await expect(page.locator(".hero-text h1")).toBeVisible();
    await expect(page.locator(".preview")).toBeVisible();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow,"horizontal overflow at "+width).toBeLessThanOrEqual(2);
    await context.close();
  }
});
