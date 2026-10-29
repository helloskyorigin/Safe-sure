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
  await expect(hero).not.toContainText("Meet Secuvora");
  await expect(hero).not.toContainText("Run security agent");
  await expect(hero).not.toContainText("Agent security report");
  // The old wide blue smear below the final headline word must not render.
  const after=await hero.locator(".hero-text h1 em").evaluate(el=>getComputedStyle(el,"::after").content);
  expect(after).toBe("none");
});

test("application check CTA keeps the working GitHub-source flow", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hero").getByRole("link",{name:"Begin analysis"}).click();
  await expect(page).toHaveURL(/\/assess$/);
  await expect(page.getByRole("heading",{level:1})).toContainText("What should Secuvora");
  await expect(page.getByRole("button",{name:/Public repository/})).toHaveAttribute("aria-pressed","true");
  await expect(page.getByRole("textbox",{name:"GitHub repository URL"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Begin analysis"})).toBeVisible();
  await expect(page.locator(".connect-subtitle")).toContainText("Connect a source to begin");
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
