import { test, expect } from "@playwright/test";
import { osvScan } from "../lib/public-repo-scanner";

test("real OSV protocol: verify identity, package-specific rating and fixed-version event", async () => {
  const nativeFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async input => {
    const url = String(input);
    requests.push(url);
    if (url.endsWith("/v1/querybatch")) return new Response(JSON.stringify({ results: [
      { vulns: [{ id:"GHSA-aaaa-bbbb-cccc" }] },
      { vulns: [{ id:"GHSA-dddd-eeee-ffff" }] },
    ] }), { status:200,headers:{"content-type":"application/json"} });
    if (url.endsWith("/GHSA-aaaa-bbbb-cccc")) return new Response(JSON.stringify({
      id:"GHSA-aaaa-bbbb-cccc",summary:"Example high-impact advisory",
      database_specific:{severity:"HIGH"},
      affected:[{package:{ecosystem:"npm",name:"some-library"},ranges:[{
        type:"ECOSYSTEM",events:[{introduced:"0"},{fixed:"2.1.8"}],
      }]}],
    }));
    if (url.endsWith("/GHSA-dddd-eeee-ffff")) return new Response(JSON.stringify({
      id:"GHSA-dddd-eeee-ffff",summary:"Example critical advisory",
      affected:[{package:{ecosystem:"PyPI",name:"web-library"},
        ecosystem_specific:{severity:"CRITICAL"},ranges:[{
          type:"ECOSYSTEM",events:[{introduced:"0"},{fixed:"4.2.1"}],
        }]}],
    }));
    throw new Error("Unexpected OSV URL " + url);
  };
  try {
    const deps = [
      {name:"some-library",version:"1.2.3",ecosystem:"npm" as const,path:"package-lock.json"},
      {name:"web-library",version:"3.2.0",ecosystem:"PyPI" as const,path:"requirements.txt"},
    ];
    const first = await osvScan(deps, new AbortController().signal);
    const second = await osvScan(deps, new AbortController().signal);
    expect(first.partial).toBe(false);
    expect(first.findings).toHaveLength(2);
    expect(first.findings.map(f => f.severity)).toEqual(["high","critical"]);
    expect(first.findings.map(f => f.location.path)).toEqual(["package-lock.json","requirements.txt"]);
    expect(first.findings[0].evidence).toContain("2.1.8");
    expect(first.findings[1].evidence).toContain("4.2.1");
    expect(first.findings[1].whyItMatters).toContain("Example critical advisory");
    expect(first.findings[0].ruleEngine).toBe("OSV published advisory");
    expect(first.findings.map(f => f.id)).toEqual(second.findings.map(f => f.id));
    expect(requests.length).toBe(6);
  } finally { globalThis.fetch = nativeFetch; }
});

test("advisory details that mismatch the requested package never create fabricated findings", async () => {
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async input => {
    const url = String(input);
    if (url.endsWith("/v1/querybatch"))
      return new Response(JSON.stringify({results:[{vulns:[{id:"GHSA-aaaa-bbbb-cccc"}]}]}));
    return new Response(JSON.stringify({
      id:"GHSA-aaaa-bbbb-cccc", summary:"Different affected package",
      affected:[{package:{ecosystem:"npm",name:"another-package"},ranges:[{type:"ECOSYSTEM",events:[{fixed:"9.9.9"}]}]}],
    }));
  };
  try {
    const value = await osvScan([{
      name:"some-library",version:"1.2.3",ecosystem:"npm",path:"package-lock.json",
    }], new AbortController().signal);
    expect(value.findings).toEqual([]);
    expect(value.partial).toBe(true);
  } finally { globalThis.fetch = nativeFetch; }
});
