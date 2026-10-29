import { test, expect } from "@playwright/test";
import { scanPublicRepository, ScanError } from "../lib/public-repo-scanner";
import type { AssessmentSnapshot } from "../lib/assessment-contract";

const COMMIT = "a".repeat(40);
const TREE = "b".repeat(40);
const BLOB = "c".repeat(40);
const SOURCE = "export const example = { ready: true };\n";
const REPO = "founder/example";

function mockedGithub(mode: "public" | "private") {
  const calls: { url: string; auth: string | null }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ url, auth: headers.get("authorization") });
    if (!url.startsWith("https://api.github.com/repos/founder/example")) {
      throw new Error("Unexpected external request: " + url);
    }
    const respond = (value: unknown) => new Response(JSON.stringify(value), {
      status: 200, headers: { "content-type": "application/json" },
    });
    if (url.endsWith("/repos/founder/example"))
      return respond({ private: mode === "private", default_branch: "main", size: 2 });
    if (url.endsWith("/commits/main"))
      return respond({ sha: COMMIT, commit: { tree: { sha: TREE } } });
    if (url.endsWith("/git/trees/" + TREE + "?recursive=1"))
      return respond({ truncated: false, tree: [{ path: "src/index.ts", type: "blob", size: Buffer.byteLength(SOURCE), sha: BLOB }] });
    if (url.endsWith("/git/blobs/" + BLOB))
      return respond({ encoding: "base64", content: Buffer.from(SOURCE).toString("base64"), size: Buffer.byteLength(SOURCE) });
    throw new Error("Unexpected GitHub path: " + url);
  }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = original; } };
}

for (const visibility of ["public", "private"] as const) {
  test("connected " + visibility + " repo completes real scanner pipeline using authorized GitHub blobs", async () => {
    const mocked = mockedGithub(visibility);
    const snapshots: AssessmentSnapshot[] = [];
    try {
      const report = await scanPublicRepository(REPO, new AbortController().signal,
        update => snapshots.push(update), "github-user-token");
      expect(report.appName).toBe(REPO);
      expect(report.revision).toBe(COMMIT);
      expect(report.scanMetrics.filesInspected).toBe(1);
      expect(report.scopeNote).toContain("authorized GitHub repository");
      expect(report.coverage.find(item => item.id === "access")?.label).toBe("Authorized GitHub source snapshot");
      expect(snapshots.at(-1)?.progress.done).toBe(5);
      expect(mocked.calls).toHaveLength(4);
      expect(mocked.calls.every(call => call.auth === "Bearer github-user-token")).toBe(true);
      expect(mocked.calls.some(call => call.url.includes("/git/blobs/" + BLOB))).toBe(true);
      expect(mocked.calls.some(call => call.url.startsWith("https://raw.githubusercontent.com"))).toBe(false);
    } finally {
      mocked.restore();
    }
  });
}

test("unconnected public scanner still rejects private repository access", async () => {
  const mocked = mockedGithub("private");
  try {
    await expect(scanPublicRepository(REPO, new AbortController().signal, () => {}))
      .rejects.toThrow("Repository could not be accessed");
    expect(mocked.calls).toHaveLength(1);
    expect(mocked.calls[0].url).toContain("/repos/founder/example");
  } finally {
    mocked.restore();
  }
});

test("invalid repository input cannot bypass GitHub hostname restrictions", async () => {
  await expect(scanPublicRepository("https://untrusted.example/private", new AbortController().signal, () => {},
    "github-user-token")).rejects.toBeInstanceOf(ScanError);
});
