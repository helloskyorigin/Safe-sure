import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("release build does not depend on downloading Google fonts", async () => {
  const layout = await readFile("app/layout.tsx", "utf-8");
  const css = await readFile("app/globals.css", "utf-8");
  expect(layout).not.toContain('next/font/google');
  expect(css).toContain("--font-inter: ui-sans-serif");
  expect(css).toContain("font-family: var(--font-inter), system-ui");
});

test("fallback UI font renders on mobile without loading external stylesheets", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.goto("/assess");
  await expect(page.getByRole("heading", { name: /Which repository should your agent inspect/i })).toBeVisible();
  const font = await page.locator("body").evaluate(element => getComputedStyle(element).fontFamily);
  expect(font).toMatch(/system-ui|ui-sans-serif|Segoe UI|Roboto/);
});
