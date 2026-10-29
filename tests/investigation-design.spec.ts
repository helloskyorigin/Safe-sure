import { test, expect } from "@playwright/test";

test("first impression communicates a credible investigation rather than a synthetic scanner claim", async ({ page }) => {
  await page.goto("/", { waitUntil:"domcontentloaded" });
  await expect(page.getByRole("heading", {level:1, name:/Security risks don't exist in isolation/i})).toBeVisible();
  await expect(page.locator(".sec-hero .eyebrow")).toContainText("SECURITY INVESTIGATIONS");
  const primary = page.locator(".sec-hero").getByRole("link", { name:/Start an investigation/i });
  await expect(primary).toHaveAttribute("href","/assess");
  await expect(page.locator(".sec-hero").getByRole("link", {name:/Explore a sample report/i})).toHaveAttribute("href","/assess/results");
  await expect(page.locator(".sec-console .sec-specimen-tag")).toHaveText("ILLUSTRATIVE SAMPLE");
  await expect(page.locator(".sec-console .sec-console-bottom")).toContainText("Fictional walkthrough");
  await expect(page.locator(".sec-console-finding")).toHaveCount(3);
  await expect(page.locator(".sec-console-detail")).toContainText("[REDACTED]");
  await expect(page).toHaveTitle("Secuvora — Security Investigations");
  const color = await page.locator(".sec-hero").evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(color).not.toBe("rgb(255, 255, 255)");
  await primary.click();
  await expect(page).toHaveURL(/\/assess$/);
  await expect(page.getByRole("heading", {name:/Start with the evidence/i})).toBeVisible();
});

test("evidence preview fits phone, tablet and desktop without horizontal scrolling or invisible first paint", async ({ browser }) => {
  for(const width of [320,360,375,430,768,1024,1440,1920]){
    const ctx=await browser.newContext({viewport:{width,height:830},reducedMotion:"reduce",isMobile:width<=430,hasTouch:width<=430});
    const page=await ctx.newPage();
    await page.goto("/",{waitUntil:"domcontentloaded"});
    await expect(page.locator(".sec-console")).toBeVisible();
    const info=await page.evaluate(()=>{
      const doc=document.documentElement;
      const hero=document.querySelector(".sec-hero")!;
      const panel=document.querySelector(".sec-console")!;
      return {overflow:doc.scrollWidth-doc.clientWidth,
        heroOpacity:getComputedStyle(hero).opacity,
        previewOpacity:getComputedStyle(panel).opacity,
        panelRight:panel.getBoundingClientRect().right,
        viewport:doc.clientWidth};
    });
    expect(info.overflow,"overflow at "+width).toBeLessThanOrEqual(2);
    expect(Number(info.heroOpacity),"hero paint at "+width).toBeGreaterThanOrEqual(.99);
    expect(Number(info.previewOpacity),"preview paint at "+width).toBeGreaterThanOrEqual(.99);
    expect(info.panelRight,"clipped panel at "+width).toBeLessThanOrEqual(info.viewport+2);
    await ctx.close();
  }
});

test("sample report and verified results have explicit separate states",async ({page})=>{
  await page.goto("/assess/results");
  await expect(page.getByRole("heading",{level:1,name:/Investigation report/i})).toBeVisible();
  await expect(page.getByText("INTERACTIVE SAMPLE")).toBeVisible();
  await expect(page.getByText(/No application was connected, scanned or found vulnerable/)).toBeVisible();
  await expect(page.getByRole("button",{name:/Export SARIF/i})).toHaveCount(0);
});
