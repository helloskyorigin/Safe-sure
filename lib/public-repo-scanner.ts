import type { AssessmentReport, CoverageItem, ReportFinding, Severity } from "@/lib/report-contract";
import type { AssessmentCheck, AssessmentSnapshot, CheckKey } from "@/lib/assessment-contract";
import { randomUUID } from "node:crypto";
import { analyzeSourceDetailed } from "@/lib/source-security-engine";
export { analyzeSource } from "@/lib/source-security-engine";

type Source = { path: string; content: string };
type Dependency = { name: string; version: string; ecosystem: "npm" | "PyPI"; path: string };
type TreeEntry = { path: string; type: string; size?: number; sha?: string };
type Progress = (value: AssessmentSnapshot) => void;
const FILE_LIMIT = 65;
const SOURCE_LIMIT = 120_000;
const MANIFEST_LIMIT = 1_500_000;
const DEP_LIMIT = 75;
const FINDING_LIMIT = 45;

export class ScanError extends Error {
  constructor(message: string, public status = 422) { super(message); }
}

export function parsePublicRepo(raw: string) {
  const value = raw.trim().replace(/\/+$/, "").replace(/\.git$/i, "");
  const m = /^(?:https:\/\/github\.com\/)?([A-Za-z0-9-]{1,39})\/([A-Za-z0-9_.-]{1,100})$/i.exec(value);
  if (!m || !/^[A-Za-z0-9]/.test(m[1]) || !/^[A-Za-z0-9]/.test(m[2]))
    throw new ScanError("Enter a public GitHub repository like github.com/owner/repo.", 400);
  return { owner: m[1], repo: m[2] };
}
const IGNORED = /(^|\/)(node_modules|vendor|dist|build|coverage|\.next|\.venv|venv|__pycache__|target|generated|fixtures|\.git|\.cache)(\/|$)/i;
const CODE = /\.(js|jsx|ts|tsx|cjs|mjs|py|php|rb|go)$/i;
const MANIFEST = /(^|\/)(package-lock\.json|requirements(?:-[\w-]+)?\.txt|Pipfile\.lock)$/i;
const parseJson = (s: string): unknown => JSON.parse(s);
async function download(url: string, signal: AbortSignal, limit: number, opts: RequestInit = {}) {
  if (signal.aborted) throw new ScanError("Scan cancelled.", 408);
  const res = await fetch(url, { ...opts, signal, cache: "no-store", redirect: "error" });
  if (!res.ok) {
    if (res.status === 404) throw new ScanError("Repository not found, not public or source unavailable.", 404);
    if (res.status === 403 || res.status === 429) throw new ScanError("Source or advisory provider rate-limited the scan.", 429);
    throw new ScanError("Source provider failed (" + res.status + ").", 502);
  }
  if (Number(res.headers.get("content-length") || 0) > limit) throw new ScanError("Source file exceeds scanner safety limits.", 413);
  if (!res.body) throw new ScanError("Provider returned an empty body.", 502);
  const chunks: Uint8Array[] = []; let size = 0;
  const reader = res.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new ScanError("Source exceeded scanner safety limits.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(size);
  let n = 0; for (const chunk of chunks) { data.set(chunk, n); n += chunk.byteLength; }
  return new TextDecoder().decode(data);
}

export function parseDependencies(files: Source[]) {
  const deps: Dependency[] = [];
  const seen = new Set<string>();
  let manifestFound = false, truncated = false;
  function add(name: string, version: string, ecosystem: Dependency["ecosystem"], path: string) {
    if (!/^[A-Za-z0-9@/_.-]{1,140}$/.test(name) || !/^[0-9][A-Za-z0-9_.+!-]{0,60}$/.test(version)) return;
    const key = ecosystem + name + version;
    if (seen.has(key)) return;
    seen.add(key);
    if (deps.length >= DEP_LIMIT) { truncated = true; return; }
    deps.push({ name, version, ecosystem, path });
  }
  for (const file of files) {
    if (!MANIFEST.test(file.path)) continue;
    manifestFound = true;
    try {
      if (file.path.endsWith("package-lock.json")) {
        const json = parseJson(file.content) as { packages?: Record<string,{ version?: string }>; dependencies?: Record<string,{ version?: string }> };
        if (json.packages) for (const [path,pkg] of Object.entries(json.packages)) {
          const name = path.split("node_modules/").at(-1);
          if (path.includes("node_modules/") && name && pkg?.version) add(name, pkg.version, "npm", file.path);
        }
        else if (json.dependencies) for (const [name,pkg] of Object.entries(json.dependencies)) {
          if (pkg?.version) add(name, pkg.version, "npm", file.path);
        }
      } else if (file.path.endsWith("Pipfile.lock")) {
        const json = parseJson(file.content) as { default?: Record<string, { version?: string }> };
        for (const [name,dep] of Object.entries(json.default || {})) {
          if (dep?.version?.startsWith("==")) add(name, dep.version.slice(2), "PyPI", file.path);
        }
      } else {
        for (const line of file.content.split(/\r?\n/)) {
          const match = /^\s*([A-Za-z0-9_.-]+)==([0-9][A-Za-z0-9_.+!-]*)\s*(?:#.*)?$/.exec(line);
          if (match) add(match[1].replace(/_/g, "-").toLowerCase(), match[2], "PyPI", file.path);
        }
      }
    } catch { truncated = true; }
  }
  return { deps, manifestFound, truncated };
}

async function osvScan(deps: Dependency[], signal: AbortSignal) {
  const body = JSON.stringify({ queries: deps.map(d => ({ package: { ecosystem: d.ecosystem, name: d.name }, version: d.version })) });
  const data = parseJson(await download("https://api.osv.dev/v1/querybatch", signal, 2_000_000, {
    method: "POST", body, headers: { "content-type": "application/json" },
  })) as { results?: { vulns?: { id: string }[]; next_page_token?: string }[] };
  if (!Array.isArray(data.results) || data.results.length !== deps.length) throw new ScanError("Invalid OSV response.", 502);
  const matches = new Map<string, Dependency>(); let partial = false;
  data.results.forEach((result, index) => {
    if (result.next_page_token) partial = true;
    for (const vuln of result.vulns || []) if (/^[A-Za-z0-9_.-]{4,90}$/.test(vuln.id) && !matches.has(vuln.id))
      matches.set(vuln.id, deps[index]);
  });
  if (matches.size > 12) partial = true;
  const findings: ReportFinding[] = [];
  for (const [id, dep] of [...matches].slice(0, 12)) {
    try {
      const v = parseJson(await download("https://api.osv.dev/v1/vulns/" + encodeURIComponent(id), signal, 700_000)) as {
        summary?: string; details?: string; database_specific?: { severity?: string };
      };
      const priority = v.database_specific?.severity?.toUpperCase();
      const severity: Severity = priority === "CRITICAL" ? "critical" : priority === "HIGH" ? "high" : priority === "LOW" ? "low" : "medium";
      const link = "https://osv.dev/vulnerability/" + id;
      findings.push({
        id: "OSV-" + String(findings.length+1).padStart(3,"0"),
        severity, title: "OSV advisory " + id + " matches " + dep.name,
        category: "Dependency advisory", confidence: "high", location: { path: dep.path },
        overview: dep.name + "@" + dep.version + " matches published advisory " + id + " in the OSV database.",
        whyItMatters: (v.summary || v.details || "The installed version matches a published security advisory.").slice(0, 850),
        evidence: dep.name + "@" + dep.version + " · " + id + " · " + link, redacted: false,
        steps: ["Review the original advisory: " + link, "Check whether the affected code path is reachable.", "Upgrade to a fixed version or implement a documented mitigation.", "Retest and verify the resolved dependency tree."],
        verification: "Confirm the installed version no longer matches the advisory and assess runtime reachability.",
        limitations: "An advisory match does not confirm exploitability. When OSV provides no usable numerical score, displayed severity is a triage estimate.",
      });
    } catch (e) { if (signal.aborted) throw e; partial = true; }
  }
  return { findings, partial };
}

export async function scanPublicRepository(input: string, signal: AbortSignal, emit: Progress,
  privateToken?: string): Promise<AssessmentReport> {
  const { owner, repo } = parsePublicRepo(input);
  const target = owner + "/" + repo;
  const runId = randomUUID();
  const keys: CheckKey[] = ["access","secrets","dependencies","patterns","evidence"];
  const checks: AssessmentCheck[] = keys.map(key => ({ key, status: "queued" }));
  const events: AssessmentSnapshot["events"] = [];
  const send = (key: CheckKey, status: AssessmentCheck["status"], message: string) => {
    checks.find(c => c.key === key)!.status = status;
    events.push({ id: String(events.length+1), at: new Date().toISOString(), message });
    emit({ runId, target: { name: target }, status: "running", updatedAt: new Date().toISOString(),
      checks: checks.map(c => ({ ...c })), events: events.slice(-25),
      progress: { done: checks.filter(c => ["complete","skipped","failed"].includes(c.status)).length, total: 5 } });
  };
  const ghHeaders = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "ShipSafe-PublicSourceScanner/1.0",
    ...(privateToken ? { Authorization: "Bearer " + privateToken } : process.env.GITHUB_TOKEN ? { Authorization: "Bearer " + process.env.GITHUB_TOKEN } : {}) };
  send("access","running","Verifying public repository and pinning source revision");
  const meta = parseJson(await download("https://api.github.com/repos/"+owner+"/"+repo, signal, 150_000, { headers: ghHeaders })) as { private?: boolean; default_branch?: string; size?: number };
  if ((!privateToken && meta.private) || !meta.default_branch) throw new ScanError("Repository is private or unauthorized.", 403);
  if (privateToken && !meta.private) throw new ScanError("Select a private repository for this flow. Public repositories use the public scanner.", 400);
  if (!/^[a-zA-Z0-9_./-]{1,140}$/.test(meta.default_branch) || meta.default_branch.includes("..")) throw new ScanError("Unsupported branch name.", 422);
  if ((meta.size || 0) > 100_000) throw new ScanError("Repository is too large for the limited public scanner.", 413);
  const commit = parseJson(await download("https://api.github.com/repos/"+owner+"/"+repo+"/commits/"+encodeURIComponent(meta.default_branch), signal, 150_000, { headers: ghHeaders })) as {
    sha?: string; commit?: { tree?: { sha?: string } };
  };
  const sha = commit.sha || ""; const treeSha = commit.commit?.tree?.sha || "";
  if (!/^[0-9a-f]{40}$/.test(sha) || !/^[0-9a-f]{40}$/.test(treeSha)) throw new ScanError("Unable to pin a Git source tree.", 502);
  const tree = parseJson(await download("https://api.github.com/repos/"+owner+"/"+repo+"/git/trees/"+treeSha+"?recursive=1", signal, 2_000_000, { headers: ghHeaders })) as { tree?: TreeEntry[]; truncated?: boolean };
  if (!Array.isArray(tree.tree)) throw new ScanError("Repository tree could not be read.", 502);
  const eligible = tree.tree.filter(x => x.type === "blob" && !IGNORED.test(x.path) &&
    (CODE.test(x.path) || MANIFEST.test(x.path))).sort((a,b) => Number(MANIFEST.test(b.path)) - Number(MANIFEST.test(a.path)));
  const chosen = eligible.filter(x => typeof x.size === "number" && x.size <= (MANIFEST.test(x.path)?MANIFEST_LIMIT:SOURCE_LIMIT)).slice(0, FILE_LIMIT);
  if (!chosen.length) throw new ScanError("No supported source files were found.", 422);
  let incomplete = !!tree.truncated || chosen.length < eligible.length;
  const files: Source[] = [];
  // Bounded concurrency. Only source on a trusted, fixed GitHub raw host is retrieved.
  for (let i=0; i<chosen.length; i+=5) {
    const group = await Promise.allSettled(chosen.slice(i,i+5).map(async x => {
      let content: string;
      if (privateToken) {
        // Private repository file contents must stay on the authenticated GitHub
        // REST API, never unauthenticated raw.githubusercontent.com.
        const blob = parseJson(await download("https://api.github.com/repos/"+owner+"/"+repo+
          "/git/blobs/"+encodeURIComponent(x.sha || ""), signal,
          Math.ceil((MANIFEST.test(x.path)?MANIFEST_LIMIT:SOURCE_LIMIT) * 1.6) + 1000, { headers: ghHeaders })) as {
            content?: unknown; encoding?: unknown; size?: unknown;
          };
        if (blob.encoding !== "base64" || typeof blob.content !== "string" ||
          typeof blob.size !== "number" || blob.size > (MANIFEST.test(x.path)?MANIFEST_LIMIT:SOURCE_LIMIT))
          throw new ScanError("GitHub blob did not meet source limits.", 413);
        content = Buffer.from(blob.content.replace(/\s/g, ""), "base64").toString("utf8");
      } else {
        const path = x.path.split("/").map(encodeURIComponent).join("/");
        content = await download("https://raw.githubusercontent.com/"+owner+"/"+repo+"/"+sha+"/"+path, signal,
          MANIFEST.test(x.path)?MANIFEST_LIMIT:SOURCE_LIMIT);
      }
      if (content.includes("\0")) throw new ScanError("Binary source excluded.");
      return { path: x.path, content };
    }));
    for (const result of group) {
      if (result.status === "fulfilled") files.push(result.value);
      else { if (signal.aborted) throw new ScanError("Scan cancelled.",408); incomplete = true; }
    }
  }
  if (!files.length) throw new ScanError("GitHub source files could not be retrieved.", 502);
  send("access","complete","Loaded "+files.length+" source files at commit "+sha.slice(0,12));
  send("secrets","running","Inspecting source for potential secrets and unsafe patterns");
  const analyzed = analyzeSourceDetailed(files);
  const findings = analyzed.findings;
  send("secrets","complete","Source patterns reviewed. Findings remain candidates until verified");
  send("dependencies","running","Reading dependency versions and consulting OSV");
  const deps = parseDependencies(files);
  let osvFailed = false, osvPartial = false;
  if (deps.deps.length) try {
    const osv = await osvScan(deps.deps, signal);
    findings.push(...osv.findings); osvPartial = osv.partial;
  } catch (e) { if (signal.aborted) throw e; osvFailed = true; }
  send("dependencies", !deps.deps.length ? "skipped" : osvFailed ? "failed" : "complete",
    !deps.deps.length ? "No supported pinned lockfile packages found" : osvFailed ? "OSV database query failed" :
    "Compared "+deps.deps.length+" pinned packages with OSV advisories");
  send("patterns","running","Finalizing source-pattern coverage");
  send("patterns","complete","Static review finished (no application code executed)");
  send("evidence","running","Compiling evidence and explicit scan limitations");
  incomplete ||= deps.truncated || osvPartial || analyzed.truncated;
  const coverage: CoverageItem[] = [
    { id:"access", label:"Public source snapshot", status:"complete",
      note:files.length+" of "+eligible.length+" eligible files loaded at "+sha+". "+(incomplete?"Some files or checks were omitted by safety limits.":"Other file formats were outside this scan's scope.") },
    { id:"secrets", label:"Credential-like source patterns", status:"complete", note:"High-signal provider token and credential-pattern review. Secret values are redacted; token validity is never tested." },
    { id:"dependencies", label:"Pinned npm/PyPI dependency advisories", status:!deps.deps.length?"skipped":osvFailed?"failed":"complete",
      note: deps.deps.length ? deps.deps.length+" pinned package versions checked against OSV." : "No supported pinned versions were available." },
    { id:"patterns", label:"Supported static code/config rules", status:"complete", note:analyzed.inspectedLines+" eligible code/config lines inspected against "+analyzed.rulesRun+" high-signal rules. Matching is syntactic, not complete taint analysis." },
    { id:"runtime", label:"Runtime and authenticated penetration testing", status:"skipped", note:"Not performed. This scan does not run untrusted code or visit deployed app endpoints." },
  ];
  if (incomplete) coverage.push({ id:"limits", label:"Exhaustive repository coverage", status:"skipped", note:"File count, finding caps, source size or advisory limits prevented a full repository review." });
  send("evidence","complete","Produced "+findings.length+" potential findings and coverage disclosures");
  return { runId, appName:target, revision:sha, finishedAt:new Date().toISOString(), findings, coverage,
    scopeNote:"Read-only "+(privateToken ? "authorized private" : "public")+" source scan pinned to "+sha.slice(0,12)+". Curated source/config rules and pinned-package OSV advisories only. No runtime testing, exploit verification or security guarantee."+
      (incomplete?" Some supported content was omitted by safety limits.":"") };
}
