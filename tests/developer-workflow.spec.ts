import { test, expect } from "@playwright/test";
import { SAMPLE_REPORT } from "../lib/report-contract";
import { compareAssessmentReports } from "../lib/report-delta";

const olderId = "11111111-1111-4111-8111-111111111111";
const currentId = "22222222-2222-4222-8222-222222222222";
const original = {
  ...SAMPLE_REPORT, runId: olderId, appName: "acme/real-repo",
  revision: "a".repeat(40), finishedAt: "2026-10-20T00:00:00.000Z",
  scanMetrics: { filesInspected: 8, eligibleFiles: 8, linesInspected: 150, dependencyVersions: 4, rulesExecuted: 12 },
};
const latest = {
  ...original, runId: currentId, revision: "b".repeat(40),
  finishedAt: "2026-10-28T00:00:00.000Z",
  findings: [original.findings[0], original.findings[1], {
    ...original.findings[5], id: "NEW-123", title: "Newly detected dangerous setting",
  }],
};

test("report delta uses stable identities and NEVER says absent findings are fixed", () => {
  const result = compareAssessmentReports(latest, original);
  expect(result).not.toBeNull();
  expect(result?.added.map(x => x.id)).toEqual(["NEW-123"]);
  expect(result?.persisted.map(x => x.id)).toEqual([original.findings[0].id, original.findings[1].id]);
  expect(result?.notDetected.length).toBe(4);
  expect(result?.scopeChanged).toBe(false);
  expect(result?.revisionChanged).toBe(true);
  expect(compareAssessmentReports(original, original)).toBeNull();
  expect(compareAssessmentReports(latest, { ...original, appName:"different/repo" })).toBeNull();
});

test("changing scanner coverage is disclosed before interpreting missing signals", () => {
  const changed = { ...latest,
    scanMetrics: { ...latest.scanMetrics, filesInspected: 2 },
    coverage: latest.coverage.map((c, i) => i === 0 ? { ...c, status: "skipped" as const } : c),
  };
  expect(compareAssessmentReports(changed, original)?.scopeChanged).toBe(true);
});

test("developer result view shows truthful previous scan delta and repo rescan action", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(({ older, current }) => {
    for (const item of [older, current]) {
      localStorage.setItem("shipsafe:public-report:v1:" + item.runId, JSON.stringify(item));
    }
    localStorage.setItem("shipsafe:public-history:v1", JSON.stringify(
      [current, older].map(item => ({
        runId: item.runId, appName: item.appName, finishedAt: item.finishedAt,
        findings: item.findings.length, revision: item.revision, savedAt: Date.now(),
      })),
    ));
  }, { older: original, current: latest });
  await page.goto("/assess/results?local=" + currentId);
  await expect(page.getByRole("heading", { name: "What changed since last scan?" })).toBeVisible();
  await expect(page.locator(".delta-metric.new")).toContainText("1");
  await expect(page.locator(".delta-metric.continuing")).toContainText("2");
  await expect(page.locator(".delta-metric.absent")).toContainText("4");
  await expect(page.locator(".delta-disclaimer")).toContainText("not confirmed exploits or verified fixes");
  await expect(page.getByRole("link", { name: /Rescan repository/i })).toHaveAttribute(
    "href", "/assess/scanning?repo=acme%2Freal-repo");
  await expect(page.getByRole("link", { name: /Open earlier report/i })).toHaveAttribute(
    "href", "/assess/results?local=" + olderId);
  await page.keyboard.press("/");
  await expect(page.getByRole("searchbox", { name: "Search findings" })).toBeFocused();
  await page.keyboard.type("NEW-123");
  await expect(page.locator(".result-finding-item")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator(".result-finding-item")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Copy issue-ready finding" })).toBeVisible();
});

test("scan history provides action to rescan exact saved repository", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(report => {
    localStorage.setItem("shipsafe:public-report:v1:" + report.runId, JSON.stringify(report));
    localStorage.setItem("shipsafe:public-history:v1", JSON.stringify([{
      runId: report.runId, appName: report.appName, finishedAt: report.finishedAt,
      findings: report.findings.length, savedAt: Date.now(),
    }]));
  }, original);
  await page.goto("/assess/history");
  await expect(page.getByRole("link", { name: "Rescan" })).toHaveAttribute(
    "href", "/assess/scanning?repo=acme%2Freal-repo");
});

test("a first scan shows a baseline instead of inventing historical data", async ({ page }) => {
  await page.goto("/assess/results");
  await expect(page.locator(".delta-panel")).toHaveCount(0);
  await expect(page.getByText(/Sample report, not a security assessment/i)).toBeVisible();
});

test("developer report delta fits 320 and 375px and history actions remain tappable", async ({ browser }) => {
  for (const width of [320, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 750 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto("/");
    await page.evaluate(({ older, current }) => {
      [older, current].forEach(item =>
        localStorage.setItem("shipsafe:public-report:v1:" + item.runId, JSON.stringify(item)));
      localStorage.setItem("shipsafe:public-history:v1", JSON.stringify([current, older].map(item => ({
        runId:item.runId, appName:item.appName, finishedAt:item.finishedAt,
        findings:item.findings.length, savedAt:Date.now(),
      }))));
    }, { older: original, current: latest });
    await page.goto("/assess/results?local=" + currentId);
    await expect(page.getByRole("heading", { name: "What changed since last scan?" })).toBeVisible();
    await expect(page.locator(".delta-metrics")).toBeVisible();
    const resultOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(resultOverflow).toBe(false);
    await page.goto("/assess/history");
    await expect(page.getByRole("link", { name: "Rescan" }).first()).toBeVisible();
    const historyOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 2);
    expect(historyOverflow).toBe(false);
    await context.close();
  }
});
