import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { fetchMetadata } from "../src/http.js";
import { MetadataError } from "../src/types.js";

const fixtureUrl = new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url);

function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function fixture(): Promise<Uint8Array> {
  return new Uint8Array(await readFile(fixtureUrl));
}

function response(bytes: Uint8Array, status: number, headers: Record<string, string>, url = "http://example.test/photo.jpg"): Response {
  const result = new Response(arrayBuffer(bytes), { status, headers: { "content-type": "image/jpeg", ...headers } });
  Object.defineProperty(result, "url", { configurable: true, value: url });
  return result;
}

function nullBodyResponse(bytes: Uint8Array, status: number, headers: Record<string, string>): Response {
  return {
    body: null,
    headers: new Headers({ "content-type": "image/jpeg", ...headers }),
    status,
    redirected: false,
    url: "http://example.test/photo.jpg",
    arrayBuffer: () => Promise.resolve(bytes.slice().buffer),
  } as Response;
}

function rangeFetch(bytes: Uint8Array, options: { readonly etag?: string; readonly lastModified?: string; readonly bodyNull?: boolean } = {}): typeof globalThis.fetch {
  return (_input, init) => {
    const headers = new Headers(init?.headers);
    const range = /^bytes=(\d+)-(\d+)$/u.exec(headers.get("range") ?? "");
    const validators = {
      ...(options.etag === undefined ? {} : { etag: options.etag }),
      ...(options.lastModified === undefined ? {} : { "last-modified": options.lastModified }),
    };
    if (range === null) return Promise.resolve(options.bodyNull ? nullBodyResponse(bytes, 200, { "content-length": String(bytes.length), ...validators }) : response(bytes, 200, { "content-length": String(bytes.length), ...validators }));
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (start >= bytes.length || end < start) return Promise.resolve(response(new Uint8Array(), 416, { "content-range": `bytes */${bytes.length}`, ...validators }));
    const body = bytes.subarray(start, Math.min(end + 1, bytes.length));
    return Promise.resolve(options.bodyNull
      ? nullBodyResponse(body, 206, { "content-range": `bytes ${start}-${start + body.length - 1}/${bytes.length}`, "content-length": String(body.length), ...validators })
      : response(body, 206, { "content-range": `bytes ${start}-${start + body.length - 1}/${bytes.length}`, "content-length": String(body.length), ...validators }));
  };
}

function throwingFetch(error: unknown): typeof globalThis.fetch {
  return () => Promise.reject(error instanceof Error ? error : new Error(String(error)));
}

describe("S06 HTTP input security boundaries", () => {
  it("accepts URL and Request inputs, full scope, null-body responses, and Last-Modified validators", async () => {
    const bytes = await fixture();
    const lastModified = "Tue, 15 Nov 1994 12:45:26 GMT";
    const fetch = rangeFetch(bytes, { lastModified, bodyNull: true });
    const result = await fetchMetadata(new URL("http://example.test/photo.jpg"), { fetch, allowedOrigins: ["http://example.test"] });
    expect(result.format).toBe("jpeg");
    expect(result.telemetry?.http?.validator).toBe(`last-modified:${lastModified}`);
    const full = await fetchMetadata(new Request("http://example.test/photo.jpg"), { fetch, scope: "full", allowedOrigins: ["http://example.test"] });
    expect(full.telemetry?.http?.mode).toBe("full");
    expect(full.telemetry?.http?.complete).toBe(true);
  });

  it("rejects invalid URL, origin, request, limit, header, and response policies with typed errors", async () => {
    const bytes = await fixture();
    const fetch = rangeFetch(bytes, { etag: '"stable"' });
    const cases: Array<Promise<unknown>> = [
      fetchMetadata("not a URL", { fetch }),
      fetchMetadata("file:///photo.jpg", { fetch }),
      fetchMetadata("http://example.test/photo.jpg", { fetch, allowedOrigins: ["not an origin"] }),
      fetchMetadata("http://example.test/photo.jpg", { fetch, allowedOrigins: ["ftp://example.test"] }),
      fetchMetadata("http://example.test/photo.jpg", { fetch, init: { method: "POST" } }),
      fetchMetadata("http://example.test/photo.jpg", { fetch, init: { body: "not allowed" } }),
      fetchMetadata("http://example.test/photo.jpg", { fetch, maxFullResponseBytes: 0 }),
    ];
    for (const operation of cases) await expect(operation).rejects.toBeInstanceOf(MetadataError);
    await expect(fetchMetadata("http://example.test/photo.jpg", { fetch, limits: { maxInputBytes: 0 } })).rejects.toThrow(/maxInputBytes/u);
  });

  it("covers malformed transport headers, unexpected statuses, redirects, and changing identities", async () => {
    const bytes = await fixture();
    const firstResponse = (headers: Record<string, string>, status = 206): typeof globalThis.fetch => () => Promise.resolve(response(bytes.subarray(0, 1), status, headers));
    const cases: Array<{ readonly fetch: typeof globalThis.fetch; readonly code: string }> = [
      { fetch: firstResponse({ "content-range": "bytes nope" }), code: "INVALID_VALUE" },
      { fetch: firstResponse({ "content-range": "bytes 0-0/1", "content-length": "01" }), code: "INVALID_VALUE" },
      { fetch: firstResponse({ "content-range": "bytes 0-0/1", "content-length": "999999999999999999999", etag: '"stable"' }), code: "LIMIT_EXCEEDED" },
      { fetch: firstResponse({ "content-range": "bytes 0-0/1", "content-encoding": "bad value" }), code: "INVALID_VALUE" },
      { fetch: firstResponse({ "content-range": "bytes 0-0/1", etag: "W/\"weak\"" }), code: "INVALID_VALUE" },
      { fetch: firstResponse({ "content-range": "bytes 0-0/1", etag: "not-an-etag" }), code: "INVALID_VALUE" },
      { fetch: firstResponse({ "content-range": "bytes 0-0/1", "last-modified": "not a date" }), code: "INVALID_VALUE" },
      { fetch: firstResponse({}, 500), code: "INVALID_VALUE" },
      { fetch: throwingFetch(new Error("transport")), code: "" },
    ];
    for (const [index, item] of cases.entries()) {
      const operation = fetchMetadata("http://example.test/photo.jpg", { fetch: item.fetch });
      const caught = await operation.then(() => null, (error: unknown) => error);
      expect(caught, `transport case ${index}`).not.toBeNull();
      if (item.code === "") {
        expect(caught, `transport case ${index}`).toBeInstanceOf(Error);
        expect((caught as Error).message).toBe("transport");
      }
      else expect(caught, `transport case ${index}`).toMatchObject({ code: item.code });
    }

    let count = 0;
    const changingUrl: typeof globalThis.fetch = (_input, init) => {
      count += 1;
      const headers = new Headers(init?.headers);
      const range = /^bytes=(\d+)-(\d+)$/u.exec(headers.get("range") ?? "");
      if (range === null) return Promise.resolve(response(bytes, 200, { "content-length": String(bytes.length) }, "http://other.test/photo.jpg"));
      const start = Number(range[1]);
      const end = Number(range[2]);
      return Promise.resolve(response(bytes.subarray(start, end + 1), 206, { "content-range": `bytes ${start}-${end}/${bytes.length}`, etag: '"stable"' }, count === 1 ? "http://example.test/photo.jpg" : "http://other.test/photo.jpg"));
    };
    await expect(fetchMetadata("http://example.test/photo.jpg", { fetch: changingUrl })).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });

  it("enforces complete-response and cumulative-byte limits and preserves abort typing", async () => {
    const bytes = await fixture();
    const ignoredRange: typeof globalThis.fetch = () => Promise.resolve(response(bytes, 200, { "content-length": String(bytes.length), etag: '"stable"' }));
    await expect(fetchMetadata("http://example.test/photo.jpg", { fetch: ignoredRange })).rejects.toMatchObject({ code: "INVALID_VALUE" });
    await expect(fetchMetadata("http://example.test/photo.jpg", { fetch: ignoredRange, allowFullResponseFallback: true, maxFullResponseBytes: bytes.length - 1 })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });

    const controller = new AbortController();
    controller.abort(new Error("caller abort"));
    await expect(fetchMetadata("http://example.test/photo.jpg", { fetch: rangeFetch(bytes, { etag: '"stable"' }), signal: controller.signal })).rejects.toMatchObject({ code: "ABORTED" });
    await expect(fetchMetadata("http://example.test/photo.jpg", { fetch: rangeFetch(bytes, { etag: '"stable"' }), limits: { maxReadBytes: 1 } })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
  });
});
