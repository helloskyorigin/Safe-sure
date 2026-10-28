import type { AssessmentReport, CoverageItem, ReportFinding, Severity } from "@/lib/report-contract";
import type { AssessmentCheck, AssessmentSnapshot, CheckKey } from "@/lib/assessment-contract";
import { randomUUID } from "node:crypto";

type Source = { path: string; content: string };
type Dependency = { name: string; version: string; ecosystem: "npm" | "PyPI"; path: string };
type TreeEntry = { path: string; type: string; size?: number };
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

function finding(
  id: string, title: string, severity: Severity, category: string, file: string, line: number,
  overview: string, evidence: string, impact: string, steps: string[], verification: string, limits: string,
): ReportFinding {
  return { id, title, severity, category, confidence: "medium", location: { path: file, line },
    overview, evidence: evidence.slice(0, 1100), redacted: true, whyItMatters: impact,
    steps, verification, limitations: limits };
}

export function analyzeSource(files: Source[]): ReportFinding[] {
  const out: ReportFinding[] = [];
  const counts = new Map<string, number>();
  for (const file of files) {
    if (!CODE.test(file.path)) continue;
    for (const [index, line] of file.content.split(/\r?\n/).entries()) {
      if (out.length >= FINDING_LIMIT) return out;
      if (line.length > 1200 || /^\s*(?:\/\/|#|\*|\/\*)/.test(line)) continue;
      function add(rule: string, title: string, severity: Severity, category: string, overview: string,
        impact: string, steps: string[], verification: string, limits: string, safeExcerpt?: string) {
        const n = counts.get(rule) || 0;
        if (n >= 6) return;
        counts.set(rule, n + 1);
        out.push(finding("SRC-" + String(out.length + 1).padStart(3, "0"), title, severity, category,
          file.path, index + 1, overview,
          (index + 1) + "  " + (safeExcerpt || "[SENSITIVE SOURCE LINE REDACTED]"),
          impact, steps, verification, limits));
      }
      if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(line)) {
        add("privatekey", "Private key marker in source", "high", "Potential secret",
          "A private-key boundary marker was found in source.",
          "An exposed valid private key could allow unauthorized access.",
          ["Confirm whether this is active key material.", "Rotate or revoke it if exposed.", "Use a secure secret store and check repository history."],
          "Verify old credentials are disabled and no key material is delivered to users.",
          "A pattern match does not establish that the key is valid or usable.");
      } else if (/(?:api[_-]?key|(?:client[_-]?)?secret|access[_-]?token|auth[_-]?token|password)\s*[:=]\s*["'][^"']{16,}["']/i.test(line) &&
        !/(?:process\.env|import\.meta\.env|os\.environ|example|placeholder|dummy|your[_-]?key)/i.test(line)) {
        add("secret", "Possible hardcoded credential", "high", "Potential secret",
          "A credential-like string literal was found. Its value is never included in this report.",
          "If an active token is exposed in code, attackers may misuse its privileges.",
          ["Verify whether the match is a real token.", "Rotate it if exposed.", "Move replacements to protected server-side secrets.", "Review commit history and published assets."],
          "Confirm the old token is revoked and no credentials appear in distributed source.",
          "Source patterns cannot prove that the value is active or externally exposed.");
      } else if (/rejectUnauthorized\s*:\s*false|verify\s*=\s*False|verify\s*:\s*false/.test(line)) {
        add("tls", "TLS verification override", "high", "Transport security",
          "Code may bypass TLS certificate checks.",
          "When enabled, certificate bypass can permit interception of secure connections.",
          ["Trace the network call.", "Restore certificate verification.", "Test with valid and invalid certificates."],
          "Confirm the actual connection rejects invalid certificates.",
          "The override might be test-only or unreachable.");
      } else if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(line)) {
        add("eval", "Dynamic code execution sink", "medium", "Code injection",
          "A runtime evaluation primitive was found.",
          "Untrusted input sent to dynamic evaluation can cause code injection.",
          ["Trace data reaching the evaluation.", "Avoid dynamic execution or strictly constrain inputs.", "Test untrusted input paths."],
          "Confirm untrusted inputs cannot reach an evaluation sink.",
          "eval usage alone is not an exploitable vulnerability.", "[DYNAMIC EVALUATION CALL FOUND]");
      } else if (/dangerouslySetInnerHTML\s*=/.test(line)) {
        add("html", "HTML injection sink needs review", "medium", "Browser injection",
          "Source includes an HTML rendering sink.",
          "Unsanitized user-controlled HTML may enable XSS.",
          ["Trace content sources.", "Prefer safe text rendering.", "Apply suitable sanitization and tests where HTML is required."],
          "Test that crafted HTML cannot execute untrusted scripts.",
          "Sanitized or constant HTML can be safe.", "[HTML RENDERING SINK FOUND]");
      } else if (/^\s*DEBUG\s*=\s*True\b/.test(line) && /settings\.py$/.test(file.path)) {
        add("debug", "Django debug flag enabled", "low", "Configuration",
          "A Django settings module enables DEBUG.",
          "If this setting reaches production, error pages may expose internal details.",
          ["Turn off debug in production settings.", "Check environment overrides.", "Inspect production error responses."],
          "Verify deployed DEBUG is disabled and sensitive tracebacks are not served.",
          "This may be a development-only settings file.", "DEBUG = True");
      }
    }
  }
  return out;
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

export async function scanPublicRepository(input: string, signal: AbortSignal, emit: Progress): Promise<AssessmentReport> {
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
  const ghHeaders = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
    ...(process.env.GITHUB_TOKEN ? { Authorization: "Bearer " + process.env.GITHUB_TOKEN } : {}) };
  send("access","running","Verifying public repository and pinning source revision");
  const meta = parseJson(await download("https://api.github.com/repos/"+owner+"/"+repo, signal, 150_000, { headers: ghHeaders })) as { private?: boolean; default_branch?: string; size?: number };
  if (meta.private || !meta.default_branch) throw new ScanError("Repository must be public.", 403);
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
      const path = x.path.split("/").map(encodeURIComponent).join("/");
      const content = await download("https://raw.githubusercontent.com/"+owner+"/"+repo+"/"+sha+"/"+path, signal,
        MANIFEST.test(x.path)?MANIFEST_LIMIT:SOURCE_LIMIT);
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
  const findings = analyzeSource(files);
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
  incomplete ||= deps.truncated || osvPartial;
  const coverage: CoverageItem[] = [
    { id:"access", label:"Public source snapshot", status:"complete",
      note:files.length+" of "+eligible.length+" eligible files loaded at "+sha+". "+(incomplete?"Some files or checks were omitted by safety limits.":"Other file formats were outside this scan's scope.") },
    { id:"secrets", label:"Credential-like source patterns", status:"complete", note:"Static candidate matching only; values are redacted and token validity is not tested." },
    { id:"dependencies", label:"Pinned npm/PyPI dependency advisories", status:!deps.deps.length?"skipped":osvFailed?"failed":"complete",
      note: deps.deps.length ? deps.deps.length+" pinned package versions checked against OSV." : "No supported pinned versions were available." },
    { id:"patterns", label:"Supported static code/config rules", status:"complete", note:"Potential TLS overrides, eval, HTML sinks and Django debug are checked; exploitability is not established." },
    { id:"runtime", label:"Runtime and authenticated penetration testing", status:"skipped", note:"Not performed. This scan does not run untrusted code or visit deployed app endpoints." },
  ];
  if (incomplete) coverage.push({ id:"limits", label:"Exhaustive repository coverage", status:"skipped", note:"File count, source size or advisory limits prevented a full repository review." });
  send("evidence","complete","Produced "+findings.length+" potential findings and coverage disclosures");
  return { runId, appName:target, revision:sha, finishedAt:new Date().toISOString(), findings, coverage,
    scopeNote:"Read-only public source scan pinned to "+sha.slice(0,12)+". Static patterns and pinned-package OSV advisories only. No runtime testing, exploit verification or security guarantee."+
      (incomplete?" Some supported content was omitted by safety limits.":"") };
}
