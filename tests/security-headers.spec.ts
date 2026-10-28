import { test, expect } from "@playwright/test";

test("application pages reject framing and disable unused browser capabilities", async ({ request }) => {
  const response = await request.get("/assess");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["permissions-policy"]).toContain("camera=()");
});

test("scan API rejects cross-origin requests with explicit browser metadata", async ({ request }) => {
  const response = await request.post("/api/scan/public", {
    headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
    data: { repo: "vercel/ms" },
  });
  expect(response.status()).toBe(403);
  expect(response.headers()["cache-control"]).toContain("no-store");
});
