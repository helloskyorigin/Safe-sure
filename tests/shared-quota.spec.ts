import { test, expect } from "@playwright/test";
import { enforceSharedQuota } from "../lib/durable-reports";

test("distributed quota sends one atomic EVAL with expiry instead of INCR + EXPIRE REST race", async () => {
  const before = {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    secret: process.env.SHIPSAFE_SESSION_SECRET,
    fetch: globalThis.fetch,
  };
  const commands: unknown[][] = [];
  let count = 0;
  try {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-test-token";
    process.env.SHIPSAFE_SESSION_SECRET = "test-secret-longer-than-thirty-two-characters";
    globalThis.fetch = async (_url, init) => {
      const command: unknown = JSON.parse(String(init?.body));
      expect(Array.isArray(command)).toBe(true);
      commands.push(command as unknown[]);
      return new Response(JSON.stringify({ result: ++count }), {
        status:200,headers:{"content-type":"application/json"},
      });
    };
    expect(await enforceSharedQuota("user:123", 2)).toBe(true);
    expect(await enforceSharedQuota("user:123", 2)).toBe(true);
    expect(await enforceSharedQuota("user:123", 2)).toBe(false);
    expect(commands).toHaveLength(3);
    for (const command of commands) {
      expect(command[0]).toBe("EVAL");
      expect(command[1]).toContain("redis.call('INCR',KEYS[1])");
      expect(command[1]).toContain("redis.call('EXPIRE',KEYS[1],ARGV[1])");
      expect(command[2]).toBe(1);
      expect(String(command[3])).toMatch(/^shipsafe:quota:v1:user:123:\d+$/);
      expect(command[4]).toBe(120);
    }
  } finally {
    globalThis.fetch = before.fetch;
    for (const [key, value] of [
      ["UPSTASH_REDIS_REST_URL", before.url], ["UPSTASH_REDIS_REST_TOKEN", before.token],
      ["SHIPSAFE_SESSION_SECRET", before.secret],
    ] as const) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("malformed Redis quota reply fails closed instead of accepting an unbounded scan", async () => {
  const oldFetch = globalThis.fetch;
  const old = [process.env.UPSTASH_REDIS_REST_URL,process.env.UPSTASH_REDIS_REST_TOKEN,
    process.env.SHIPSAFE_SESSION_SECRET] as const;
  try {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    process.env.SHIPSAFE_SESSION_SECRET = "very-long-unique-test-value-over-thirty-two-characters";
    globalThis.fetch = async () => new Response(JSON.stringify({ result: "not-a-number" }), { status:200 });
    await expect(enforceSharedQuota("public:test", 10)).rejects.toThrow(/Invalid quota counter/);
  } finally {
    globalThis.fetch = oldFetch;
    for(const [key,value] of [
      ["UPSTASH_REDIS_REST_URL",old[0]],["UPSTASH_REDIS_REST_TOKEN",old[1]],
      ["SHIPSAFE_SESSION_SECRET",old[2]],
    ] as const) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
