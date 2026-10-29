import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";
import { priorityFindings, remediationMarkdown, githubSourceUrl } from "../lib/report-presentation";

test("report priorities are based on scanner severity and do not alter source data", () => {
  const input = [SAMPLE_REPORT.findings[5], SAMPLE_REPORT.findings[1], SAMPLE_REPORT.findings[0]];
  expect(priorityFindings(input).map(f => f.severity)).toEqual(["critical", "high", "low"]);
  expect(input[0].severity).toBe("low");
  expect(priorityFindings([])).toEqual([]);
});

test("fix plan is report-derived, covers everything and makes no claim of applied changes", () => {
  const plan = remediationMarkdown(SAMPLE_REPORT, true);
  expect(plan).toContain("ILLUSTRATIVE SAMPLE - NOT A REAL SCAN");
  expect(plan).toContain("This sample is fictional");
  for (const item of SAMPLE_REPORT.findings) {
    expect(plan).toContain(item.title);
    expect(plan).toContain(item.verification);
    expect(plan).toContain(item.steps[0]);
  }
  expect(plan).not.toMatch(/Patch applied|Fixed automatically|Confirmed secure/i);
});

test("verified revision and safe relative file path required for GitHub source links", () => {
  const report = { ...SAMPLE_REPORT, appName: "acme/demo", revision: "a".repeat(40) };
  expect(githubSourceUrl(report, "src/lib/config file.ts", 24))
    .toBe("https://github.com/acme/demo/blob/"+"a".repeat(40)+"/src/lib/config%20file.ts#L24");
  expect(githubSourceUrl(report, "../.env", 1)).toBeNull();
  expect(githubSourceUrl(report, "https://evil.example", 1)).toBeNull();
  expect(githubSourceUrl({ ...report, revision: "unverified" }, "src/file.ts")).toBeNull();
  expect(githubSourceUrl({ ...report, appName: "bad/../repo" }, "src/file.ts")).toBeNull();
});

test("server-verified private report renders real details and guarded source link", async ({ page }) => {
  const runId = "12345678-1234-4321-9999-123456789012";
  const revision = "a".repeat(40);
  const live = { ...SAMPLE_REPORT, runId, appName: "acme/private-project", revision };
  await page.route("**/api/assessments/*/report", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(live),
  }));
  await page.goto("/assess/results?run=" + runId);
  await expect(page.getByText("AUTHORIZED PRIVATE REPOSITORY")).toBeVisible();
  await expect(page.getByText("AGENT REVIEW COMPLETE")).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(6);
  await expect(page.getByRole("link", { name: "Open source" })).toHaveAttribute("href",
    "https://github.com/acme/private-project/blob/"+revision+"/src/lib/client.ts#L18");
  await expect(page.getByText("INTERACTIVE SAMPLE")).toHaveCount(0);
  await expect(page.getByText(/\$19|Checkout|Upgrade to Pro/i)).toHaveCount(0);
});

test("private report with no authenticated data never shows sample findings", async ({ page }) => {
  await page.route("**/api/assessments/*/report", route => route.fulfill({
    status: 401, contentType: "application/json", body: JSON.stringify({ error: "Unauthorized" }),
  }));
  await page.goto("/assess/results?run=12345678-1234-4321-9999-123456789012");
  await expect(page.getByRole("heading", { name: /A verified report isn't available/i })).toBeVisible();
  await expect(page.locator(".result-finding-item")).toHaveCount(0);
});
