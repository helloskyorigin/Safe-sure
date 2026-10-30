import { test, expect } from "@playwright/test";
import { analyzeSourceDetailed } from "../lib/source-security-engine";
import { isAssessmentReport } from "../lib/report-contract";

test("v2 produces stable reproducible evidence and never returns credential material", () => {
  const credential = "ghp_" + "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8";
  const files = [{ path:"src/auth.ts", content:[
    "const apiKey = \"abcdefghijklmnopqrstuvwxyz987654\";",
    "const providerToken = \"" + credential + "\";",
    "const x = eval(userInput);",
    "const agent = { rejectUnauthorized: false };",
    "const html = <div dangerouslySetInnerHTML={{ __html: input }} />;",
  ].join("\n") }];
  const first = analyzeSourceDetailed(files);
  const again = analyzeSourceDetailed(files);
  expect(first.findings).toHaveLength(5);
  expect(first.rulesRun).toBe(7);
  expect(first.inspectedLines).toBe(5);
  expect(first.findings.map(f => f.id)).toEqual(again.findings.map(f => f.id));
  expect(new Set(first.findings.map(f => f.ruleId)).size).toBe(5);
  expect(first.findings.every(f => f.ruleEngine && f.location.path === "src/auth.ts" &&
    typeof f.location.line === "number")).toBe(true);
  for (const finding of first.findings) {
    expect(finding.evidence).not.toContain(credential);
    expect(finding.evidence).not.toContain("abcdefghijklmnopqrstuvwxyz987654");
    expect(finding.steps.length).toBeGreaterThan(0);
    expect(finding.verification.length).toBeGreaterThan(5);
    expect(finding.limitations).toMatch(/not|may|cannot|might|might|proof|review/i);
  }
});

test("production-like dangerous configuration is inspected while placeholders and comments are suppressed", () => {
  const result = analyzeSourceDetailed([
    { path:".github/workflows/deploy.yml", content:"name: deploy\npermissions: write-all\n" },
    { path:"infra/database.tf", content:"resource \"aws_db_instance\" \"db\" {\n publicly_accessible = true\n}" },
    { path:"settings.py", content:"DEBUG = True\n" },
    { path:"src/credentials.ts", content:'// apiKey = "AA999999999999999999999999"\nconst apiKey = "placeholder_1234567890000";\nconst pass = process.env.PASSWORD;\n' },
    { path:"src/anything.ts", content:"const note = 'ordinary business logic';" },
  ]);
  expect(result.findings.map(f => f.ruleId)).toEqual(["SS-CI-001", "SS-IAC-001", "SS-CONFIG-001"]);
  expect(result.findings.map(f => f.location.line)).toEqual([2, 2, 1]);
  expect(result.findings.every(f => f.confidence === "high" || f.confidence === "medium")).toBe(true);
});

test("recognizable provider token in a test fixture is demoted, not reported as a confirmed production leak", () => {
  const token = "xoxb-" + "12345678901234567890";
  const findings = analyzeSourceDetailed([{ path:"tests/auth.test.ts", content:'const token = "' + token + '";' }]).findings;
  expect(findings).toHaveLength(1);
  expect(findings[0].confidence).toBe("medium");
  expect(findings[0].limitations).toMatch(/test\/example code/i);
  expect(findings[0].evidence).not.toContain(token);
});

test("source-level shell and deserialization checks show evidence without claiming exploitability", () => {
  const result = analyzeSourceDetailed([{ path:"app/worker.py", content:"subprocess.run(command, shell=True)\nobj = pickle.loads(payload)\n" }]);
  expect(result.findings.map(f => f.ruleId)).toEqual(["SS-EXEC-001","SS-DESER-001"]);
  expect(result.findings.every(f => f.confidence !== "high")).toBe(true);
});

test("report validator accepts real scanner rule identity and scope metrics, rejects fabricated counts", () => {
  const file = analyzeSourceDetailed([{ path:"src/config.ts", content:'const apiKey = "abcdefghijklmnopqrstuvwxyz987654";' }]).findings;
  const valid = {
    runId:"12345678-1234-4321-9999-123456789012", appName:"acme/repo",
    revision:"a".repeat(40), finishedAt:"2026-10-28T12:00:00Z",
    findings:file, coverage:[],scopeNote:"Read-only source check",
    scanMetrics:{ filesInspected:1,eligibleFiles:1,linesInspected:1,dependencyVersions:0,rulesExecuted:12 },
  };
  expect(isAssessmentReport(valid, valid.runId)).toBe(true);
  expect(isAssessmentReport({ ...valid, scanMetrics:{ ...valid.scanMetrics,filesInspected:9 } },valid.runId)).toBe(false);
  expect(isAssessmentReport({ ...valid, findings:valid.findings.map(f=>({ ...f, ruleId:"" })) },valid.runId)).toBe(false);
});

test("agent integration bypass flags are reported with bounded evidence and explicit uncertainty", () => {
  const files = [
    { path:"agents/vector.py",content:"db = FAISS.load_local(store, emb, allow_dangerous_deserialization=True)" },
    { path:"agents/browser.py",content:"toolkit = RequestsToolkit(requests_wrapper=client, allow_dangerous_requests=True)" },
    { path:"tests/agent_config.test.py",content:"# allow_dangerous_requests=True\\n" +
      "allow_dangerous_requests=False\\n" },
  ];
  const result = analyzeSourceDetailed(files);
  expect(result.findings.map(f => f.ruleId)).toEqual(["SS-AGENT-001","SS-AGENT-002"]);
  expect(result.findings[0].severity).toBe("high");
  expect(result.findings[1].severity).toBe("medium");
  expect(result.findings.every(f => f.confidence === "medium" &&
    f.limitations?.toLowerCase().includes("not") || false)).toBe(true);
  expect(result.findings.every(f => !f.evidence.includes("FAISS.load_local"))).toBe(true);
  expect(result.rulesRun).toBe(9);
});
