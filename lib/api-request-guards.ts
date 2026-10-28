/**
 * Security boundaries for cookie-authenticated mutation endpoints.
 *
 * Fetch Metadata is useful defense in depth, but must not be trusted in place
 * of checking Origin: some clients omit or forge Sec-Fetch-Site.
 * A configured public origin takes priority over request/forwarded Host headers.
 */
export function isAllowedMutationOrigin(request: Request, expectedOrigin?: string): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true; // e.g. same-site tools; authentication still required.
  try {
    const supplied = new URL(origin);
    const allowed = new URL(expectedOrigin || process.env.SHIPSAFE_PUBLIC_ORIGIN || request.url);
    // Origin is a serialized origin, never a URL with path/userinfo/query.
    if (origin !== supplied.origin) return false;
    if (supplied.origin !== allowed.origin) {
      // A local reverse proxy can expose 127.0.0.1 while Next.js sees localhost.
      // Permit only equivalent loopback hosts with the SAME port, and ONLY when
      // no canonical origin has been configured. Deployed origins stay strict.
      const loopback = (host: string) => host === "localhost" || host === "127.0.0.1";
      const localAlias = !expectedOrigin && !process.env.SHIPSAFE_PUBLIC_ORIGIN &&
        supplied.protocol === "http:" && allowed.protocol === "http:" &&
        loopback(supplied.hostname) && loopback(allowed.hostname) &&
        supplied.port === allowed.port;
      if (!localAlias) return false;
    }
    return supplied.protocol === "https:" ||
      (supplied.protocol === "http:" && ["localhost", "127.0.0.1"].includes(supplied.hostname));
  } catch {
    return false;
  }
}

export class RequestBodyError extends Error {
  constructor(message: string, public readonly status: 400 | 413) {
    super(message);
    this.name = "RequestBodyError";
  }
}

/** Read at most maxBytes *before* JSON parsing, even when Content-Length lies. */
export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > maxBytes)
    throw new RequestBodyError("Request too large.", 413);
  if (!request.body) throw new RequestBodyError("Missing JSON body.", 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new RequestBodyError("Request too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new RequestBodyError("Invalid JSON request.", 400);
  }
}
