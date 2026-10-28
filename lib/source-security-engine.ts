import { createHash } from "node:crypto";
import type { Confidence, ReportFinding, Severity } from "@/lib/report-contract";

type Source = { path: string; content: string };
type Signal = {
  id: string; title: string; severity: Severity; confidence: Confidence;
  category: string; overview: string; why: string; steps: string[]; verify: string;
  limitations: string; evidence: string; redacted?: boolean;
};
const CODE = /\.(?:js|jsx|ts|tsx|cjs|mjs|py|php|rb|go)$/i;
const CONFIG = /(?:^|\/)(?:Dockerfile(?:\.[\w-]+)?|[\w.-]+\.tf|[\w.-]+\.ya?ml)$/i;
const FIXTURE = /(?:^|\/)(?:__tests__|tests?|specs?|fixtures?|examples?|mocks?|samples?|\.storybook)(?:\/|$)|(?:\.test|\.spec|_test)\.[\w]+$|(?:^|\/)test_[^/]+\.py$|(?:^|\/)[^/]+_test\.go$/i;
const COMMENT = /^\s*(?:\/\/|#|\*|\/\*|<!--)/;
const PLACEHOLDER = /(?:example|dummy|placeholder|changeme|replace[_-]?me|your[_-]?(?:key|token|secret)|fake|not[_-]?real|test[_-]?only|sample|xxx{3,})/i;
const TOKEN_LIKE = /(?:AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk_live_[A-Za-z0-9]{18,}|xox[baprs]-[A-Za-z0-9-]{18,})/g;
const GENERIC = /(?:api[_-]?key|(?:client[_-]?)?secret|access[_-]?token|auth[_-]?token|password|private[_-]?key)\s*[:=]\s*["']([^"']{16,})["']/i;
const SECRET_HINT = /(?:credential|token|secret|password|api.key|private.key)/i;
const ALLOW = new Set(["development", "production", "staging", "undefined", "null", "false", "true"]);
const ENGINE_LIMIT = 45;
const PER_RULE_LIMIT = 6;

/** Entropy is a heuristic, not proof of an active secret. */
function entropy(value: string) {
  if (!value) return 0;
  const frequencies = new Map<string, number>();
  for (const c of value) frequencies.set(c, (frequencies.get(c) || 0) + 1);
  return [...frequencies.values()].reduce((n, count) => {
    const p = count / value.length;
    return n - p * Math.log2(p);
  }, 0);
}
function genericCandidate(value: string): boolean {
  return value.length >= 16 && value.length <= 220 &&
    !PLACEHOLDER.test(value) && !ALLOW.has(value.toLowerCase()) &&
    !/^(?:https?:|file:|data:|\/|\.|[0-9a-f]{32,64}$)/i.test(value) &&
    entropy(value) >= 3.1 &&
    (/[0-9]/.test(value) || /[_\-+/=]/.test(value)) &&
    !/\s{2,}/.test(value);
}

function contextualConfidence(file: string, base: Confidence): Confidence {
  if (!FIXTURE.test(file)) return base;
  return base === "high" ? "medium" : "low";
}
function fingerprint(rule: string, path: string, line: string) {
  // Stable across repeated scans at the same source, unlike incremental IDs.
  // Do not include raw secret bytes in the saved fingerprint.
  const normalized = line.replace(TOKEN_LIKE, "[TOKEN]").replace(/(["'])[A-Za-z0-9_+/=-]{16,}\1/g,"[VALUE]");
  return createHash("sha256").update(rule + "\0" + path + "\0" + normalized.trim()).digest("hex").slice(0, 20);
}
function finding(signal: Signal, file: string, row: number, line: string): ReportFinding {
  return {
    id: signal.id + "-" + fingerprint(signal.id, file, line),
    ruleId: signal.id, ruleEngine: "ShipSafe static rules v2",
    severity: signal.severity, confidence: contextualConfidence(file, signal.confidence),
    title: signal.title, category: signal.category,
    location: { path: file, line: row },
    overview: signal.overview,
    evidence: row + "  " + signal.evidence,
    redacted: signal.redacted ?? true,
    whyItMatters: signal.why, steps: signal.steps, verification: signal.verify,
    limitations: signal.limitations + (FIXTURE.test(file) ? " Detected in test/example code, so production exposure is less certain." : ""),
  };
}

export function analyzeSourceDetailed(files: Source[]): { findings: ReportFinding[]; truncated: boolean; inspectedLines: number; rulesRun: number } {
  const findings: ReportFinding[] = [];
  const seen = new Set<string>();
  const byRule = new Map<string, number>();
  let inspectedLines = 0, truncated = false;

  function add(signal: Signal, path: string, row: number, line: string) {
    const key = signal.id + "\0" + path + "\0" + row;
    if (seen.has(key)) return;
    if (findings.length >= ENGINE_LIMIT || (byRule.get(signal.id) || 0) >= PER_RULE_LIMIT) {
      truncated = true; return;
    }
    seen.add(key);
    byRule.set(signal.id, (byRule.get(signal.id) || 0) + 1);
    findings.push(finding(signal, path, row, line));
  }

  for (const file of files) {
    if (!CODE.test(file.path) && !CONFIG.test(file.path)) continue;
    const lines = file.content.split(/\r?\n/);
    const python = /\.py$/i.test(file.path);
    const js = /\.(?:jsx?|tsx?|cjs|mjs)$/i.test(file.path);
    const docker = /(?:^|\/)Dockerfile(?:\.[\w-]+)?$/i.test(file.path);
    const yaml = /\.ya?ml$/i.test(file.path);
    const terraform = /\.tf$/i.test(file.path);
    let inPem = false;
    for (const [index, raw] of lines.entries()) {
      inspectedLines++;
      const row = index + 1;
      const line = raw.trim();
      if (!line || line.length > 1500) continue;
      if (/-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/.test(line)) {
        inPem = true;
        add({ id:"SS-SECRET-001", title:"Private key material committed in source", severity:"critical", confidence:"high",
          category:"Credential exposure", overview:"A private key PEM boundary was detected in repository source.",
          why:"If the key is active, repository access may disclose credentials or permit impersonation.",
          steps:["Identify the key owner and exposure history.","Revoke/rotate the key and any dependent credentials.","Replace it with a secret-manager reference.","Purge exposed key history if required by your incident response policy."],
          verify:"Verify the previous key is disabled, the new secret is not committed and affected systems use the replacement.",
          limitations:"The scanner does not verify key validity or access to associated services.",
          evidence:"[PRIVATE KEY HEADER AND MATERIAL REDACTED]" },file.path,row,raw);
        continue;
      }
      if (inPem) { if (/-----END .*PRIVATE KEY-----/.test(line)) inPem=false; continue; }
      if (COMMENT.test(line)) continue;
      // Avoid wasting capacity on lines known to be documentation-like examples.
      if (/^\s*(?:console\.log|print\s*\()\s*["']/.test(line)) continue;

      if (CODE.test(file.path)) {
        const detected = [...line.matchAll(TOKEN_LIKE)].map(m=>m[0]);
        if (detected.length && !PLACEHOLDER.test(line.replace(TOKEN_LIKE,"")) && !/^(?:import|from)\b/.test(line)) {
          add({ id:"SS-SECRET-002", title:"Provider credential pattern in repository", severity:"high",
            confidence:"high", category:"Credential exposure",
            overview:"A string matches a recognizable provider token format. The value is redacted and never verified by sending it to its provider.",
            why:"Active provider tokens in source may be copied and misused by anyone who can read the repository.",
            steps:["Confirm whether this credential is live using your provider's console, not by pasting it into a website.",
              "Revoke or rotate the affected token if exposed.","Replace the literal with a server-side secret reference.","Review commit history and build artifacts for exposure."],
            verify:"Confirm the old token is revoked and the deployed source no longer contains the credential.",
            limitations:"Provider format matching does not prove token validity or exposure scope.",
            evidence:"[RECOGNIZABLE PROVIDER TOKEN REDACTED]" },file.path,row,raw);
        } else {
          const generic = GENERIC.exec(line);
          if (generic && genericCandidate(generic[1]) && !/(?:process\.env|import\.meta\.env|os\.environ|getenv|dotenv)/i.test(line)) {
            add({ id:"SS-SECRET-003", title:"Possible hardcoded credential", severity:"high",
              confidence:"medium", category:"Credential exposure",
              overview:"A credential-named variable contains a nontrivial string literal. Its contents are not retained in the finding.",
              why:"If used for authentication, an embedded credential can be exposed through source or published code.",
              steps:["Confirm this is a real credential and whether the affected source is exposed.","Rotate it if it is active or has leaked.",
                "Move the value to protected server-only configuration.","Review deployment bundles and commit history."],
              verify:"Confirm the retired value cannot authenticate and source/build output no longer embeds it.",
              limitations:"This is a heuristic; string complexity does not prove a secret is valid.",
              evidence:"[CREDENTIAL-NAMED STRING REDACTED]" },file.path,row,raw);
          }
        }
      }
      if (js && /\brejectUnauthorized\s*:\s*false\b|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']?0\b/.test(line) ||
          python && /\bverify\s*=\s*False\b/.test(line) ||
          /\.(?:php|rb)$/i.test(file.path) && /CURLOPT_SSL_VERIFYPEER\s*,\s*false|VERIFY_NONE/.test(line)) {
        add({ id:"SS-TLS-001", title:"TLS certificate validation disabled", severity:"high", confidence:"high",
          category:"Transport security", overview:"A network configuration may explicitly skip TLS certificate verification.",
          why:"Disabling certificate verification can permit interception or server impersonation on affected connections.",
          steps:["Identify the connection and whether it runs in production.","Remove the bypass; use trusted certificate authorities.",
            "Repair local CA or development certificates rather than turning validation off."],
          verify:"Confirm connections with untrusted certificates fail in the relevant runtime environment.",
          limitations:"A configuration value may be overridden or used only during testing.",
          evidence:"Certificate verification explicitly disabled (value: false or 0)." },file.path,row,raw);
      }
      if (js && /\beval\s*\(|\bnew\s+Function\s*\(/.test(line)) {
        const dangerousInput = /\b(?:req(?:uest)?\.(?:body|query|params)|location\.(?:search|hash)|userInput)\b/.test(line);
        add({ id:"SS-INJECT-001", title:"Dynamic JavaScript evaluation sink", severity:dangerousInput?"high":"medium",
          confidence:dangerousInput?"medium":"low", category:"Code injection",
          overview:dangerousInput?"An evaluation primitive appears near a request-controlled value.":"A dynamic JavaScript execution primitive needs source-level review.",
          why:"If attacker-controlled input reaches an evaluator, the application may execute unintended JavaScript.",
          steps:["Trace values reaching the evaluation call.","Prefer structured parsers or explicit allowed operations.",
            "If input can be controlled externally, add regression tests with malicious payloads."],
          verify:"Confirm no untrusted data can reach dynamic evaluation and regression tests pass.",
          limitations:"This is a source-pattern signal, not verified input-flow taint analysis.",
          evidence:"Dynamic evaluation primitive detected; input flow not proven." },file.path,row,raw);
      }
      if (js && /dangerouslySetInnerHTML\s*=/.test(line)) {
        add({ id:"SS-XSS-001", title:"HTML injection sink requires review", severity:"medium", confidence:"low",
          category:"Browser injection", overview:"React raw-HTML rendering was detected.",
          why:"Unsanitized user-controlled HTML passed to this sink can enable cross-site scripting.",
          steps:["Trace the rendered HTML's origin.","Prefer React escaped text rendering.","If HTML is essential, sanitize it with a maintained HTML sanitizer and test untrusted input."],
          verify:"Use malicious HTML test cases and verify no script executes in the rendered output.",
          limitations:"Constant or correctly sanitized content may be safe; this rule does not establish exploitability.",
          evidence:"React raw HTML sink detected." },file.path,row,raw);
      }
      if (python && /(?:^|\/)settings(?:_production)?\.py$/i.test(file.path) && /^DEBUG\s*=\s*True\b/.test(line)) {
        add({ id:"SS-CONFIG-001", title:"Django DEBUG enabled in settings", severity:"medium", confidence:"medium",
          category:"Security configuration", overview:"DEBUG is set to True in a Django settings file.",
          why:"If this setting reaches production, sensitive tracebacks and configuration details can be exposed.",
          steps:["Separate development and production configurations.","Disable DEBUG for deployed services.","Review error pages for sensitive data."],
          verify:"Verify DEBUG is false in actual production settings and stack traces are not publicly exposed.",
          limitations:"A deploy-time override may already disable the setting.",
          evidence:"DEBUG = True", redacted:false },file.path,row,raw);
      }
      if (python && /\b(?:subprocess\.(?:run|Popen|call|check_output)|os\.system)\s*\(/.test(line) &&
          /shell\s*=\s*True\b/.test(line)) {
        add({ id:"SS-EXEC-001", title:"Python subprocess invokes a shell", severity:"medium", confidence:"medium",
          category:"Command execution", overview:"A subprocess call explicitly enables shell interpretation.",
          why:"When untrusted strings reach a shell command, command injection can occur.",
          steps:["Prefer argument arrays with shell=False.","Validate/allowlist each external input.","Audit command construction for request-controlled data."],
          verify:"Test shell metacharacters against the affected code path and confirm arguments remain data.",
          limitations:"Shell use can be safe with fixed commands and trusted inputs; no dataflow proof is provided.",
          evidence:"subprocess shell=True detected." },file.path,row,raw);
      }
      if (python && /\bpickle\.loads?\s*\(/.test(line)) {
        add({ id:"SS-DESER-001", title:"Python pickle deserialization sink", severity:"medium", confidence:"low",
          category:"Deserialization", overview:"The source deserializes Python pickle data.",
          why:"Loading untrusted pickle bytes can execute arbitrary code.",
          steps:["Trace the input provenance.","Avoid pickle for untrusted input; use a safe data format.","Constrain trusted serialized sources and test the handling path."],
          verify:"Confirm that inputs from untrusted users are never passed to pickle deserialization.",
          limitations:"Use with strictly trusted serialized data may be acceptable.",
          evidence:"pickle load operation detected." },file.path,row,raw);
      }
      if (js && /\b(?:child_process\.)?exec\s*\(/.test(line) && /\b(?:req(?:uest)?\.(?:body|query|params)|userInput|params\.)/.test(line)) {
        add({ id:"SS-EXEC-002", title:"Request value passed to command execution", severity:"high", confidence:"medium",
          category:"Command execution", overview:"A command execution call and request-controlled value occur on the same source line.",
          why:"Untrusted command strings can result in arbitrary shell commands.",
          steps:["Trace the full parameter and command construction.","Replace shell-based execution with safe argument arrays and fixed binaries.","Constrain input types and add command-injection regression tests."],
          verify:"Confirm untrusted inputs cannot change the executed program or add shell arguments.",
          limitations:"Same-line matching is not complete taint analysis; review call context.",
          evidence:"Shell execution sink with request-value reference detected." },file.path,row,raw);
      }
      if (yaml && /(?:^|\/)\.github\/workflows\//.test(file.path) &&
          /^\s*permissions\s*:\s*write-all(?:\s*#.*)?$/.test(line)) {
        add({ id:"SS-CI-001", title:"GitHub Actions grants all write permissions", severity:"high", confidence:"high",
          category:"CI/CD permissions", overview:"A workflow grants write-all permissions to the GitHub token.",
          why:"Broad write permissions increase potential impact if an untrusted workflow step or dependency is compromised.",
          steps:["Replace write-all with job-specific least-privilege permissions.","Restrict workflow triggers and untrusted code execution.","Review third-party actions before granting write scopes."],
          verify:"Confirm every workflow job has only the minimal required token permissions.",
          limitations:"This may be an intentionally privileged maintenance workflow; review the full job context.",
          evidence:"permissions: write-all", redacted:false },file.path,row,raw);
      }
      if (terraform && /^\s*(?:skip_final_snapshot|publicly_accessible)\s*=\s*true\b/i.test(line)) {
        if (/publicly_accessible\s*=\s*true/.test(line)) {
          add({ id:"SS-IAC-001", title:"Database resource may be publicly accessible", severity:"high", confidence:"medium",
            category:"Infrastructure configuration", overview:"Terraform sets publicly_accessible = true for a resource.",
            why:"An internet-accessible database can increase exposure if network controls or authentication are weak.",
            steps:["Verify which resource this property belongs to.","Restrict database network access to required private networks.","Audit security groups and authentication policies."],
            verify:"Confirm the deployed database does not expose unnecessary public ingress.",
            limitations:"Public accessibility alone does not prove an exploitable endpoint.",
            evidence:"publicly_accessible = true", redacted:false },file.path,row,raw);
        }
      }
      if (docker && /^\s*HEALTHCHECK\s+NONE\b/i.test(line)) {
        // Operational configuration is not a security vulnerability. Do not flag.
      }
    }
  }
  return { findings, truncated, inspectedLines, rulesRun: 12 };
}

export function analyzeSource(files: Source[]): ReportFinding[] {
  return analyzeSourceDetailed(files).findings;
}
