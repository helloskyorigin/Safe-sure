import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "shipsafe_gh_session";
export const OAUTH_COOKIE = "shipsafe_oauth_state";
const TTL_SECONDS = 6 * 60 * 60;

export type GithubSession = { userId: number; login: string; token: string; expires: number };

function key() {
  const secret = process.env.SHIPSAFE_SESSION_SECRET || "";
  if (secret.length < 32) throw new Error("SHIPSAFE_SESSION_SECRET must be a random string at least 32 characters long.");
  return createHash("sha256").update(secret).digest();
}
export function configuredGithubOAuth() {
  return Boolean(process.env.GITHUB_APP_CLIENT_ID && process.env.GITHUB_APP_CLIENT_SECRET &&
    process.env.SHIPSAFE_SESSION_SECRET && process.env.SHIPSAFE_SESSION_SECRET.length >= 32);
}

export function seal(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function unseal(payload: string): string | null {
  try {
    const bytes = Buffer.from(payload, "base64url");
    if (bytes.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
  } catch { return null; }
}
export function constantEqual(a: string, b: string): boolean {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function secureCookie() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
}
export async function getGithubSession(): Promise<GithubSession | null> {
  if (!configuredGithubOAuth()) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw || raw.length > 6000) return null;
  const plain = unseal(raw);
  if (!plain) return null;
  try {
    const value: unknown = JSON.parse(plain);
    if (!value || typeof value !== "object") return null;
    const user = value as Partial<GithubSession>;
    if (!Number.isSafeInteger(user.userId) || Number(user.userId) < 1 ||
      typeof user.login !== "string" || !/^[a-zA-Z0-9-]{1,39}$/.test(user.login) ||
      typeof user.token !== "string" || user.token.length < 8 || user.token.length > 2000 ||
      typeof user.expires !== "number" || user.expires < Date.now()) return null;
    return user as GithubSession;
  } catch { return null; }
}
export function newSessionCookie(session: GithubSession) {
  return { name: SESSION_COOKIE, value: seal(JSON.stringify(session)),
    options: { ...secureCookie(), maxAge: TTL_SECONDS } };
}
export async function githubUserApi(path: string, token: string): Promise<Response> {
  if (!path.startsWith("/") || path.includes("://") || path.includes("..")) throw new Error("Invalid GitHub API path");
  return fetch("https://api.github.com" + path, {
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json",
      "User-Agent": "ShipSafe-RepositoryAssessment/1.0", "X-GitHub-Api-Version": "2022-11-28" },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000),
  });
}
