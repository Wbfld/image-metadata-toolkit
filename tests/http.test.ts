import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
import { fetchMetadata } from "../src/http.js";
import type { HttpReadTelemetry } from "../src/types.js";

const jpegFixtureUrl = new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url);
const tiffFixtureUrl = new URL("./fixtures/tiff-metadata.tif", import.meta.url);
const heifFixtureUrl = new URL("./fixtures/heif-tail-idat-item-metadata.heic", import.meta.url);

interface RequestLog {
  readonly method: string;
  readonly path: string;
  readonly range: string | undefined;
  readonly ifRange: string | undefined;
  readonly credentialsHeader: string | undefined;
}

interface TestServer {
  readonly url: (path?: string) => string;
  readonly requests: RequestLog[];
  readonly close: () => Promise<void>;
}

type ResponsePlan = (request: IncomingMessage, response: ServerResponse, bytes: Uint8Array, requestIndex: number) => void;

function headerValue(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(",") : value;
}

function writeRangeResponse(response: ServerResponse, bytes: Uint8Array, request: IncomingMessage, options: { readonly etag?: string; readonly includeLength?: boolean; readonly encoding?: string } = {}): void {
  const range = headerValue(request, "range");
  const parsed = /^bytes=(\d+)-(\d*)$/u.exec(range ?? "");
  if (parsed === null) {
    const body = options.encoding === "gzip" ? gzipSync(bytes) : bytes;
    response.writeHead(200, {
      "content-type": "image/jpeg",
      ...(options.includeLength === false ? {} : { "content-length": String(body.byteLength) }),
      ...(options.encoding === undefined ? {} : { "content-encoding": options.encoding }),
      ...(options.etag === undefined ? {} : { etag: options.etag }),
    });
    response.end(body);
    return;
  }
  const start = Number(parsed[1]);
  const requestedEnd = parsed[2] === "" ? bytes.byteLength - 1 : Number(parsed[2]);
  if (start >= bytes.byteLength || requestedEnd < start) {
    response.writeHead(416, {
      "content-range": `bytes */${bytes.byteLength}`,
      ...(options.etag === undefined ? {} : { etag: options.etag }),
    });
    response.end();
    return;
  }
  const end = Math.min(requestedEnd, bytes.byteLength - 1);
  const body = bytes.subarray(start, end + 1);
  response.writeHead(206, {
    "content-range": `bytes ${start}-${end}/${bytes.byteLength}`,
    ...(options.includeLength === false ? {} : { "content-length": String(body.byteLength) }),
    ...(options.encoding === undefined ? {} : { "content-encoding": options.encoding }),
    ...(options.etag === undefined ? {} : { etag: options.etag }),
  });
  response.end(body);
}

async function startTestServer(bytes: Uint8Array, plan: ResponsePlan = (_request, response, body) => writeRangeResponse(response, body, _request, { etag: '"stable"' })): Promise<TestServer> {
  const requests: RequestLog[] = [];
  let requestIndex = 0;
  const server: Server = createServer((request, response) => {
    requests.push({
      method: request.method ?? "",
      path: request.url ?? "",
      range: headerValue(request, "range"),
      ifRange: headerValue(request, "if-range"),
      credentialsHeader: headerValue(request, "cookie"),
    });
    const index = requestIndex;
    requestIndex += 1;
    plan(request, response, bytes, index);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Test server did not expose a TCP address.");
  return {
    url: (path = "/photo.jpg") => `http://127.0.0.1:${address.port}${path}`,
    requests,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error === undefined ? resolve() : reject(error))),
  };
}

const openServers: TestServer[] = [];
afterEach(async () => {
  await Promise.all(openServers.splice(0).map((server) => server.close()));
});

function http(result: Awaited<ReturnType<typeof fetchMetadata>>): HttpReadTelemetry {
  const telemetry = result.telemetry?.http;
  if (telemetry === undefined) throw new Error("HTTP telemetry was not attached to the result.");
  return telemetry;
}

describe("HTTP range metadata input", () => {
  it("uses validated 206 ranges and exposes transport telemetry", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    const server = await startTestServer(bytes);
    openServers.push(server);

    const result = await fetchMetadata(server.url(), { select: { groups: ["Dimensions", "EXIF"] } });
    const telemetry = http(result);

    expect(result.format).toBe("jpeg");
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(telemetry).toMatchObject({ mode: "range", rangeSupported: true, fallbackReason: null, complete: true });
    expect(telemetry.requestCount).toBeGreaterThan(1);
    expect(telemetry.responseBytes).toBeLessThan(bytes.byteLength);
    expect(telemetry.decodedBytes).toBeGreaterThan(0);
    expect(server.requests.slice(1).every((request) => request.ifRange === '"stable"')).toBe(true);
    expect(server.requests.some((request) => request.range !== undefined)).toBe(true);
  });

  it("rejects an ignored range unless bounded full-response fallback is enabled", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    const server = await startTestServer(bytes, (_request, response, body) => {
      response.writeHead(200, { "content-length": String(body.byteLength), etag: '"stable"' });
      response.end(body);
    });
    openServers.push(server);

    await expect(fetchMetadata(server.url(), { select: { groups: ["Dimensions"] } })).rejects.toMatchObject({ code: "INVALID_VALUE" });
    const result = await fetchMetadata(server.url(), { allowFullResponseFallback: true, select: { groups: ["Dimensions"] } });
    expect(result.format).toBe("jpeg");
    expect(http(result)).toMatchObject({ mode: "fallback", rangeSupported: false, fallbackReason: "range-ignored", complete: true });
    await expect(fetchMetadata(server.url(), { allowFullResponseFallback: true, maxFullResponseBytes: bytes.byteLength - 1 })).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
  });

  it("validates 416, missing length, and malicious Content-Range responses", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    const rejected = await startTestServer(bytes, (_request, response, body) => {
      response.writeHead(416, { "content-range": `bytes */${body.byteLength}`, etag: '"stable"' });
      response.end();
    });
    openServers.push(rejected);
    await expect(fetchMetadata(rejected.url())).rejects.toMatchObject({ code: "INVALID_VALUE" });

    const noLength = await startTestServer(bytes, (_request, response, body) => writeRangeResponse(response, body, _request, { etag: '"stable"', includeLength: false }));
    openServers.push(noLength);
    const result = await fetchMetadata(noLength.url(), { select: { groups: ["Dimensions"] } });
    expect(result.format).toBe("jpeg");

    const malicious = await startTestServer(bytes, (request, response, body) => {
      if (headerValue(request, "range") !== undefined) {
        response.writeHead(206, { "content-range": `bytes 0-0/${body.byteLength + 1}`, "content-length": "1", etag: '"stable"' });
        response.end(body.subarray(0, 1));
        return;
      }
      response.writeHead(200, { "content-length": String(body.byteLength), etag: '"stable"' });
      response.end(body);
    });
    openServers.push(malicious);
    await expect(fetchMetadata(malicious.url())).rejects.toMatchObject({ code: "INVALID_VALUE" });

    const badLength = await startTestServer(bytes, (request, response, body) => {
      if (headerValue(request, "range") !== undefined) {
        response.writeHead(206, { "content-range": `bytes 0-0/${body.byteLength}`, "content-length": "2", etag: '"stable"' });
        response.end(body.subarray(0, 1));
        return;
      }
      response.writeHead(200, { "content-length": String(body.byteLength), etag: '"stable"' });
      response.end(body);
    });
    openServers.push(badLength);
    await expect(fetchMetadata(badLength.url())).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });

  it("rejects compressed range responses and permits them only through explicit full fallback", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    const server = await startTestServer(bytes, (_request, response, body) => writeRangeResponse(response, body, _request, { etag: '"stable"', encoding: "gzip" }));
    openServers.push(server);

    await expect(fetchMetadata(server.url())).rejects.toMatchObject({ code: "INVALID_VALUE" });
    const result = await fetchMetadata(server.url(), { allowFullResponseFallback: true, select: { groups: ["Dimensions"] } });
    expect(result.format).toBe("jpeg");
    expect(http(result).fallbackReason).toBe("compressed-response");
  });

  it("requires a validator for range reads unless the caller explicitly relaxes that policy", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    const server = await startTestServer(bytes, (_request, response, body) => writeRangeResponse(response, body, _request));
    openServers.push(server);

    await expect(fetchMetadata(server.url())).rejects.toMatchObject({ code: "INVALID_VALUE" });
    const result = await fetchMetadata(server.url(), { requireValidator: false, select: { groups: ["Dimensions"] } });
    expect(result.format).toBe("jpeg");
    expect(http(result).validator).toBeNull();
  });

  it("fails when a validator changes between the probe and a range read", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    const server = await startTestServer(bytes, (request, response, body, index) => writeRangeResponse(response, body, request, { etag: index === 0 ? '"v1"' : '"v2"' }));
    openServers.push(server);

    await expect(fetchMetadata(server.url())).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });

  it("honors abort signals while a range request is in flight", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    const server = await startTestServer(bytes, (_request, response, body) => {
      const timer = setTimeout(() => {
        if (!response.destroyed) writeRangeResponse(response, body, _request, { etag: '"stable"' });
      }, 200);
      response.on("close", () => clearTimeout(timer));
    });
    openServers.push(server);
    const controller = new AbortController();
    const operation = fetchMetadata(server.url(), { signal: controller.signal });
    setTimeout(() => controller.abort(), 20);
    await expect(operation).rejects.toMatchObject({ code: "ABORTED" });
  });

  it("records followed redirects and preserves caller transport policy", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    let seenCredentials: RequestCredentials | undefined;
    const server = await startTestServer(bytes, (request, response, body) => {
      if (request.url === "/redirect") {
        response.writeHead(302, { location: "/photo.jpg" });
        response.end();
        return;
      }
      writeRangeResponse(response, body, request, { etag: '"stable"' });
    });
    openServers.push(server);
    const suppliedFetch: typeof globalThis.fetch = (input, init) => {
      seenCredentials = init?.credentials;
      return globalThis.fetch(input, init);
    };

    const result = await fetchMetadata(server.url("/redirect"), {
      fetch: suppliedFetch,
      init: { credentials: "omit", redirect: "follow", mode: "cors" },
      select: { groups: ["Dimensions"] },
    });
    expect(result.format).toBe("jpeg");
    expect(http(result)).toMatchObject({ requestedUrl: server.url("/redirect"), redirected: true, finalUrl: server.url("/photo.jpg") });
    expect(seenCredentials).toBe("omit");
  });

  it("reads HEIF metadata near the end without downloading the intervening image payload", async () => {
    const source = new Uint8Array(await readFile(heifFixtureUrl));
    const trailingMedia = new Uint8Array(8 + 64 * 1024);
    new DataView(trailingMedia.buffer).setUint32(0, trailingMedia.byteLength);
    trailingMedia.set([0x6d, 0x64, 0x61, 0x74], 4);
    const bytes = new Uint8Array(source.byteLength + trailingMedia.byteLength);
    bytes.set(source);
    bytes.set(trailingMedia, source.byteLength);
    const server = await startTestServer(bytes);
    openServers.push(server);

    const result = await fetchMetadata(server.url("/photo.heic"), { select: { groups: ["Dimensions", "EXIF", "XMP", "ICC"] } });
    const telemetry = http(result);

    expect(result.format).toBe("heif");
    expect(result.dimensions).not.toBeNull();
    expect(telemetry.mode).toBe("range");
    expect(telemetry.responseBytes).toBeLessThan(bytes.byteLength);
    expect(server.requests.some((request) => request.range !== undefined && request.range.startsWith("bytes=8"))).toBe(true);
  });

  it("passes validated HTTP ranges through the TIFF metadata planner", async () => {
    const bytes = new Uint8Array(await readFile(tiffFixtureUrl));
    const server = await startTestServer(bytes);
    openServers.push(server);

    const result = await fetchMetadata(server.url("/photo.tif"), { select: { groups: ["Dimensions", "EXIF", "XMP", "IPTC", "ICC"] } });
    expect(result.format).toBe("tiff");
    expect(result.dimensions).not.toBeNull();
    expect(http(result)).toMatchObject({ mode: "range", rangeSupported: true, complete: true });
    expect(http(result).responseBytes).toBeLessThan(bytes.byteLength);
  });

  it("rejects a manually surfaced redirect instead of hiding redirect policy", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    const server = await startTestServer(bytes, (_request, response) => {
      response.writeHead(302, { location: "/photo.jpg" });
      response.end();
    });
    openServers.push(server);
    await expect(fetchMetadata(server.url("/redirect"), { init: { redirect: "manual" } })).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });

  it("enforces an explicit final-origin allowlist", async () => {
    const bytes = new Uint8Array(await readFile(jpegFixtureUrl));
    const server = await startTestServer(bytes);
    openServers.push(server);
    await expect(fetchMetadata(server.url(), { allowedOrigins: ["https://images.example"] })).rejects.toMatchObject({ code: "INVALID_VALUE" });
  });
});
