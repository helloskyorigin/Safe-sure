import { test, expect } from "@playwright/test";
import { isAllowedMutationOrigin, readBoundedJson, RequestBodyError } from "../lib/api-request-guards";

const endpoint = "https://secuvora.example/api/scan/private";

test("mutation guard checks Origin even when Fetch Metadata claims same-origin", () => {
  const spoofed = new Request(endpoint, {
    method: "POST",
    headers: { origin: "https://attacker.example", "sec-fetch-site": "same-origin" },
  });
  expect(isAllowedMutationOrigin(spoofed, "https://secuvora.example")).toBe(false);

  const noneSite = new Request(endpoint, {
    method: "POST",
    headers: { origin: "https://attacker.example", "sec-fetch-site": "none" },
  });
  expect(isAllowedMutationOrigin(noneSite, "https://secuvora.example")).toBe(false);

  const valid = new Request(endpoint, {
    method: "POST",
    headers: { origin: "https://secuvora.example", "sec-fetch-site": "same-origin" },
  });
  expect(isAllowedMutationOrigin(valid, "https://secuvora.example")).toBe(true);

  const crossSite = new Request(endpoint, {
    method: "POST",
    headers: { origin: "https://secuvora.example", "sec-fetch-site": "cross-site" },
  });
  expect(isAllowedMutationOrigin(crossSite, "https://secuvora.example")).toBe(false);
});

test("mutation guard rejects malformed origins and permits localhost development", () => {
  for (const origin of ["null", "https://secuvora.example.attacker.example", "https://secuvora.example/path",
    "http://secuvora.example", "https://attacker.example@secuvora.example"]) {
    const req = new Request(endpoint, { method: "POST", headers: { origin } });
    expect(isAllowedMutationOrigin(req, "https://secuvora.example")).toBe(false);
  }
  const localhost = new Request("http://localhost:3000/api/scan/private", {
    method: "POST", headers: { origin: "http://localhost:3000" },
  });
  expect(isAllowedMutationOrigin(localhost, "http://localhost:3000")).toBe(true);
});

test("bounded JSON reader rejects oversized streaming content even without Content-Length", async () => {
  const request = new Request(endpoint, {
    method: "POST",
    body: JSON.stringify({ repo: "acme/repo", padding: "a".repeat(3000) }),
  });
  await expect(readBoundedJson(request, 1000))
    .rejects.toMatchObject({ name: "RequestBodyError", status: 413 });
});

test("bounded JSON reader checks declared size, rejects malformed JSON and accepts a valid repo", async () => {
  const claimedLarge = new Request(endpoint, {
    method: "POST", body: "{}", headers: { "content-length": "9000" },
  });
  await expect(readBoundedJson(claimedLarge, 1000))
    .rejects.toBeInstanceOf(RequestBodyError);

  const invalid = new Request(endpoint, { method: "POST", body: "{invalid" });
  await expect(readBoundedJson(invalid, 1000))
    .rejects.toMatchObject({ status: 400 });

  const valid = new Request(endpoint, {
    method: "POST", body: JSON.stringify({ repo: "owner/repository" }),
  });
  await expect(readBoundedJson(valid, 1000)).resolves.toEqual({ repo: "owner/repository" });
});

test("private scan and deletion endpoints reject hostile Origins before checking session", async ({ request }) => {
  const scan = await request.post("/api/scan/private", {
    headers: { origin: "https://attacker.example", "sec-fetch-site": "none" },
    data: { repo: "vercel/ms" },
  });
  expect(scan.status()).toBe(403);
  expect(scan.headers()["cache-control"]).toContain("no-store");

  const deletion = await request.delete(
    "/api/assessments/12345678-1234-4321-9999-123456789012/report",
    { headers: { origin: "https://attacker.example", "sec-fetch-site": "same-origin" } },
  );
  expect(deletion.status()).toBe(403);
});
