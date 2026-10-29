import { test, expect } from "@playwright/test";
import { durableStoreStatus } from "../lib/durable-reports";

const original = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  kvUrl: process.env.KV_REST_API_URL,
  kvToken: process.env.KV_REST_API_TOKEN,
  secret: process.env.SHIPSAFE_SESSION_SECRET,
};

function restore() {
  const entries = [
    ["UPSTASH_REDIS_REST_URL", original.url],
    ["UPSTASH_REDIS_REST_TOKEN", original.token],
    ["KV_REST_API_URL", original.kvUrl],
    ["KV_REST_API_TOKEN", original.kvToken],
    ["SHIPSAFE_SESSION_SECRET", original.secret],
  ] as const;
  for (const [key, value] of entries) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

test.afterEach(restore);

test("storage config accepts trimmed and quoted Upstash values", () => {
  process.env.UPSTASH_REDIS_REST_URL = '  "https://example.upstash.io"  ';
  process.env.UPSTASH_REDIS_REST_TOKEN = "  'secret-token'  ";
  process.env.SHIPSAFE_SESSION_SECRET = "x".repeat(48);
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;

  expect(durableStoreStatus()).toEqual({
    configured: true,
    hasUrl: true,
    hasToken: true,
    hasSessionSecret: true,
  });
});

test("storage config accepts Vercel KV-compatible aliases", () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.KV_REST_API_URL = "https://example.upstash.io";
  process.env.KV_REST_API_TOKEN = "secret-token";
  process.env.SHIPSAFE_SESSION_SECRET = "y".repeat(48);

  expect(durableStoreStatus().configured).toBe(true);
});

test("storage config reports exactly which requirement is missing", () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  process.env.SHIPSAFE_SESSION_SECRET = "z".repeat(48);
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;

  const status = durableStoreStatus();
  expect(status.configured).toBe(false);
  expect(status.hasUrl).toBe(false);
  expect(status.hasToken).toBe(true);
  expect(status.hasSessionSecret).toBe(true);
});
