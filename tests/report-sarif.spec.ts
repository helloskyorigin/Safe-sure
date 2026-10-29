import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { SAMPLE_REPORT } from "../lib/report-contract";
import { reportToSarif } from "../lib/report-sarif";

const id = "12345678-1234-4321-9999-123456789012";
const verified = {
  ...SAMPLE_REPORT, runId:id, appName:"acme/secure-app",
  revision:"a".repeat(40), finishedAt:"2026-10-28T13:00:00.000Z",
};

test("SARIF export uses real file locations, severity and scanner identities", () => {
  const output = reportToSarif(verified);
  expect(output.version).toBe("2.1.0");
  expect(output.runs[0].tool.driver.name).toBe("Secuvora");
  expect(output.runs[0].results).toHaveLength(6);
  expect(output.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri)
    .toBe("src/lib/client.ts");
  expect(output.runs[0].results[0].locations[0].physicalLocation.region?.startLine).toBe(18);
  expect(output.runs[0].results[0].level).toBe("error");
  expect(output.runs[0].results[5].level).toBe("note");
  expect(output.runs[0].results[0].properties.candidateNotConfirmed).toBe(true);
  const json = JSON.stringify(output);
  expect(json).not.toContain("SAMPLE ONLY");
  expect(json).not.toContain("REDACTED_SAMPLE_VALUE");
  expect(json).not.toContain("security-severity");
});

test("SARIF omits unsafe paths, URL-looking artifacts and all scanner evidence", () => {
  const report = { ...verified, findings: [
    { ...verified.findings[0], location:{ path:"../secrets/file.ts",line:19 }, evidence:"PRIVATE_VALUE_DO_NOT_EXPORT" },
    { ...verified.findings[1], location:{ path:"src/unsafe?file.ts",line:12 }, evidence:"SECRET_EVIDENCE" },
    { ...verified.findings[2], location:{ path:"src/space module.ts",line:3 }, evidence:"DONT_EXPORT" },
  ] };
  const sarif = reportToSarif(report);
  expect(sarif.runs[0].results).toHaveLength(1);
  expect(sarif.runs[0].properties.excludedUnsafeLocations).toBe(2);
  expect(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri)
    .toBe("src/space%20module.ts");
  expect(JSON.stringify(sarif)).not.toContain("DO_NOT_EXPORT");
  expect(JSON.stringify(sarif)).not.toContain("SECRET_EVIDENCE");
  expect(JSON.stringify(sarif)).not.toContain("DONT_EXPORT");
});

test("verified report has downloadable SARIF, fictional sample never does", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.getByRole("button", { name: "Export SARIF" })).toHaveCount(0);
  await page.route("**/api/assessments/*/report", route => route.fulfill({
    status:200,contentType:"application/json",body:JSON.stringify(verified),
  }));
  await page.goto("/assess/results?run=" + id);
  await page.locator(".result-export-menu summary").click();
  const button = page.getByRole("button", { name: "Export SARIF" });
  await expect(button).toBeVisible();
  const pending = page.waitForEvent("download");
  await button.click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("secuvora-security-results.sarif");
  const data = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(data.version).toBe("2.1.0");
  expect(data.runs[0].results).toHaveLength(6);
  await expect(page.getByText("SARIF file downloaded")).toBeVisible();
});

test("SARIF toolbar stays within 320px on mobile", async ({ browser }) => {
  const ctx = await browser.newContext({viewport:{width:320,height:760},isMobile:true,hasTouch:true});
  const page = await ctx.newPage();
  await page.route("**/api/assessments/*/report", route => route.fulfill({
    status:200,contentType:"application/json",body:JSON.stringify(verified),
  }));
  await page.goto("/assess/results?run=" + id);
  await page.locator(".result-export-menu summary").click();
  await expect(page.getByRole("button", {name:"Export SARIF"})).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await ctx.close();
});
