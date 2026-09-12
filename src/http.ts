import { parseMetadata } from "./index.js";
import { throwIfAborted } from "./security/abort.js";
import { resolveLimits } from "./security/limits.js";
import { MetadataError, type HttpFallbackReason, type HttpReadTelemetry, type MetadataResult, type ParseOptions, type ReadTelemetry, type SecurityLimits } from "./types.js";

/**
 * Options for the explicit HTTP range entry point. The core parser never
 * creates a Request or performs network I/O.
 */
export interface HttpMetadataOptions extends ParseOptions {
  /** A supplied fetch implementation, useful for tests and restricted runtimes. */
  readonly fetch?: typeof globalThis.fetch;
  /** Request options forwarded to fetch. Range and validator headers are managed by this adapter. */
  readonly init?: RequestInit;
  /** Permit a complete response when range negotiation cannot be trusted. */
  readonly allowFullResponseFallback?: boolean;
  /** Upper bound for a complete response, never greater than maxInputBytes. */
  readonly maxFullResponseBytes?: number;
  /** Require an HTTP validator before using multiple byte-range requests. Defaults to true. */
  readonly requireValidator?: boolean;
  /** Restrict the final response URL to these exact origins. Omitted means no origin allowlist is imposed. */
  readonly allowedOrigins?: readonly string[];
}

type HttpMode = "range" | "full" | "fallback";

interface ParsedContentRange {
  readonly start: number;
  readonly end: number;
  readonly total: number;
}

interface ParsedUnsatisfiedRange {
  readonly total: number;
}

interface ResponseBody {
  readonly bytes: Uint8Array;
  readonly contentEncoding: string | null;
}

interface CombinedSignal {
  readonly signal: AbortSignal | undefined;
  readonly cleanup: () => void;
}

const EMPTY_CLEANUP: CombinedSignal = { signal: undefined, cleanup: () => undefined };

function combineSignals(first: AbortSignal | undefined, second: AbortSignal | undefined): CombinedSignal {
  if (first === undefined) return second === undefined ? EMPTY_CLEANUP : { signal: second, cleanup: () => undefined };
  if (second === undefined || first === second) return { signal: first, cleanup: () => undefined };
  const controller = new AbortController();
  const abort = (event: Event): void => {
    const source = event.target as AbortSignal;
    controller.abort(source.reason);
  };
  if (first.aborted) controller.abort(first.reason);
  else if (second.aborted) controller.abort(second.reason);
  else {
    first.addEventListener("abort", abort, { once: true });
    second.addEventListener("abort", abort, { once: true });
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      first.removeEventListener("abort", abort);
      second.removeEventListener("abort", abort);
    },
  };
}

function safeHeaderInteger(headers: Headers, name: string): number | null {
  const raw = headers.get(name);
  if (raw === null) return null;
  const value = raw.trim();
  if (!/^(?:0|[1-9]\d*)$/u.test(value)) throw new MetadataError("INVALID_VALUE", `HTTP ${name} header is not a safe decimal integer.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new MetadataError("LIMIT_EXCEEDED", `HTTP ${name} header exceeds the safe integer range.`);
  return parsed;
}

function parseContentRange(headers: Headers): ParsedContentRange | null {
  const raw = headers.get("content-range");
  if (raw === null) return null;
  const match = /^bytes\s+(\d+)-(\d+)\/(\d+)$/u.exec(raw.trim());
  if (match === null) throw new MetadataError("INVALID_VALUE", "HTTP Content-Range header is malformed.");
  const start = Number(match[1]);
  const end = Number(match[2]);
  const total = Number(match[3]);
  if (![start, end, total].every(Number.isSafeInteger) || start < 0 || end < start || total < 1 || end >= total) {
    throw new MetadataError("INVALID_VALUE", "HTTP Content-Range header contains an invalid range.");
  }
  return { start, end, total };
}

function parseUnsatisfiedContentRange(headers: Headers): ParsedUnsatisfiedRange | null {
  const raw = headers.get("content-range");
  if (raw === null) return null;
  const match = /^bytes\s+\*\/(\d+)$/u.exec(raw.trim());
  if (match === null) throw new MetadataError("INVALID_VALUE", "HTTP 416 Content-Range header is malformed.");
  const total = Number(match[1]);
  if (!Number.isSafeInteger(total) || total < 0) throw new MetadataError("INVALID_VALUE", "HTTP 416 Content-Range total is invalid.");
  return { total };
}

function contentEncoding(headers: Headers): string | null {
  const raw = headers.get("content-encoding");
  if (raw === null || raw.trim() === "") return null;
  const value = raw.trim().toLowerCase();
  if (value === "identity") return null;
  if (!/^[a-z0-9!#$%&'*+.^_`|~-]+(?:\s*,\s*[a-z0-9!#$%&'*+.^_`|~-]+)*$/u.test(value)) {
    throw new MetadataError("INVALID_VALUE", "HTTP Content-Encoding header is malformed.");
  }
  return value;
}

function strongEtag(raw: string | null): string | null {
  if (raw === null) return null;
  const value = raw.trim();
  if (value === "" || value.includes(",") || value.startsWith("W/")) return null;
  if (!/^"(?:[^"\\]|\\.)*"$/u.test(value)) throw new MetadataError("INVALID_VALUE", "HTTP ETag header is malformed.");
  return value;
}

function httpDate(raw: string | null): string | null {
  if (raw === null) return null;
  const value = raw.trim();
  if (value === "" || value.includes(",,")) throw new MetadataError("INVALID_VALUE", "HTTP Last-Modified header is malformed.");
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new MetadataError("INVALID_VALUE", "HTTP Last-Modified header is not a valid HTTP date.");
  return value;
}

function selectValidator(headers: Headers): string | null {
  const etag = strongEtag(headers.get("etag"));
  if (etag !== null) return `etag:${etag}`;
  const modified = httpDate(headers.get("last-modified"));
  return modified === null ? null : `last-modified:${modified}`;
}

function validatorHeaderValue(validator: string | null): string | null {
  if (validator === null) return null;
  const separator = validator.indexOf(":");
  return separator < 0 ? null : validator.slice(separator + 1);
}

function validatePositiveLimit(name: string, value: number): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new MetadataError("INVALID_VALUE", `${name} must be a positive safe integer.`);
  return value;
}

function requestUrl(input: RequestInfo | URL): URL {
  const raw = input instanceof URL
    ? input.toString()
    : typeof input === "string"
      ? input
    : typeof input === "object" && typeof input.url === "string"
        ? input.url
        : null;
  if (raw === null) throw new MetadataError("INVALID_VALUE", "HTTP input must be a URL, string URL, or Request.");
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new MetadataError("INVALID_VALUE", "HTTP input URL is invalid.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new MetadataError("INVALID_VALUE", "HTTP input URL must use http or https.");
  return parsed;
}

function validateAllowedOrigins(origins: readonly string[] | undefined): ReadonlySet<string> | null {
  if (origins === undefined) return null;
  const values = new Set<string>();
  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new MetadataError("INVALID_VALUE", `HTTP allowed origin is invalid: ${origin}`);
    }
    if (parsed.origin === "null" || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) throw new MetadataError("INVALID_VALUE", `HTTP allowed origin must be an http or https origin: ${origin}`);
    values.add(parsed.origin);
  }
  return values;
}

async function cancelResponse(response: Response): Promise<void> {
  if (response.body !== null) {
    try {
      await response.body.cancel();
    } catch {
      // The response may already have been closed by the user agent.
    }
  }
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  if (typeof value !== "object" || value === null) return false;
  try {
    ArrayBuffer.prototype.slice.call(value, 0, 0);
    return true;
  } catch {
    return false;
  }
}

class HttpRangeTransport {
  private readonly fetchImplementation: typeof globalThis.fetch;
  private readonly input: RequestInfo | URL;
  private readonly baseInit: RequestInit;
  private readonly baseHeaders: Headers;
  private readonly limits: SecurityLimits;
  private readonly signal: AbortSignal | undefined;
  private readonly allowFullResponseFallback: boolean;
  private readonly maxFullResponseBytes: number;
  private readonly requireValidator: boolean;
  private readonly allowedOrigins: ReadonlySet<string> | null;
  private readonly initialUrl: URL;
  private totalBytes = 0;
  private validator: string | null = null;
  private mode: HttpMode = "range";
  private rangeSupported = false;
  private fallbackReason: HttpFallbackReason | null = null;
  private fullBytes: Uint8Array | null = null;
  private probeByte: Uint8Array | null = null;
  private requestCount = 0;
  private rangeRequestCount = 0;
  private fullResponseRequestCount = 0;
  private responseBytes = 0;
  private decodedBytes = 0;
  private redirected = false;
  private finalUrl: URL;
  private warnings: string[] = [];

  private constructor(input: RequestInfo | URL, options: HttpMetadataOptions, limits: SecurityLimits, signal: AbortSignal | undefined) {
    this.input = input;
    this.initialUrl = requestUrl(input);
    this.finalUrl = this.initialUrl;
    this.fetchImplementation = options.fetch ?? globalThis.fetch;
    if (typeof this.fetchImplementation !== "function") throw new MetadataError("UNSUPPORTED_FORMAT", "No fetch implementation is available; provide HttpMetadataOptions.fetch or use a runtime with fetch.");
    const init = options.init ?? {};
    if (init.method !== undefined && init.method.toUpperCase() !== "GET") throw new MetadataError("INVALID_VALUE", "HTTP metadata reads require GET; use init only for transport policy.");
    if (init.body !== undefined && init.body !== null) throw new MetadataError("INVALID_VALUE", "HTTP metadata reads do not accept a request body.");
    this.baseInit = { ...init, method: "GET", ...(signal === undefined ? {} : { signal }) };
    this.baseHeaders = new Headers(init.headers);
    this.limits = limits;
    this.signal = signal;
    this.allowFullResponseFallback = options.allowFullResponseFallback === true;
    this.maxFullResponseBytes = validatePositiveLimit("maxFullResponseBytes", Math.min(options.maxFullResponseBytes ?? limits.maxInputBytes, limits.maxInputBytes, limits.maxReadBytes));
    this.requireValidator = options.requireValidator !== false;
    this.allowedOrigins = validateAllowedOrigins(options.allowedOrigins);
    this.validateUrl(this.initialUrl);
  }

  public static async create(input: RequestInfo | URL, options: HttpMetadataOptions, limits: SecurityLimits, signal: AbortSignal | undefined): Promise<HttpRangeTransport> {
    const transport = new HttpRangeTransport(input, options, limits, signal);
    await transport.probe(options.scope !== "full");
    if (options.scope === "full" && transport.fullBytes === null) await transport.fetchFull("full-response");
    return transport;
  }

  private validateUrl(url: URL): void {
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new MetadataError("INVALID_VALUE", "HTTP response URL must use http or https.");
    if (this.allowedOrigins !== null && !this.allowedOrigins.has(url.origin)) throw new MetadataError("INVALID_VALUE", `HTTP response origin ${url.origin} is not in the allowed origin list.`);
  }

  private observeResponse(response: Response): void {
    this.redirected ||= response.redirected;
    const rawUrl = response.url || this.finalUrl.toString();
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new MetadataError("INVALID_VALUE", "HTTP response URL is invalid.");
    }
    this.validateUrl(url);
    if (this.requestCount > 1 && url.toString() !== this.finalUrl.toString()) throw new MetadataError("INVALID_VALUE", "HTTP resource changed its final URL during range reads.");
    this.finalUrl = url;
  }

  private requestInit(headers: Headers): RequestInit {
    return { ...this.baseInit, headers };
  }

  private async request(headers: Headers, isRange: boolean): Promise<Response> {
    throwIfAborted(this.signal);
    this.requestCount += 1;
    if (isRange) this.rangeRequestCount += 1;
    let response: Response;
    try {
      response = await this.fetchImplementation(this.input, this.requestInit(headers));
    } catch (error) {
      if (this.signal?.aborted) throw new MetadataError("ABORTED", "HTTP metadata operation was aborted.");
      throw error;
    }
    throwIfAborted(this.signal);
    this.observeResponse(response);
    return response;
  }

  private headersForRange(start: number, end: number): Headers {
    const headers = new Headers(this.baseHeaders);
    headers.set("range", `bytes=${start}-${end - 1}`);
    const value = validatorHeaderValue(this.validator);
    if (value !== null) headers.set("if-range", value);
    return headers;
  }

  private validateContentLength(headers: Headers, expected: number | null): void {
    const length = safeHeaderInteger(headers, "content-length");
    if (length !== null && expected !== null && length !== expected) throw new MetadataError("INVALID_VALUE", "HTTP Content-Length does not match the requested identity-encoded range.");
  }

  private remainingResponseBudget(): number {
    return this.limits.maxReadBytes - this.responseBytes;
  }

  private fullResponseBodyLimit(): number {
    const remaining = this.remainingResponseBudget();
    if (remaining < 1) throw new MetadataError("LIMIT_EXCEEDED", "HTTP cumulative response limit was exhausted before the full response was requested.");
    return Math.min(this.maxFullResponseBytes, remaining);
  }

  private validateValidator(headers: Headers, expected: string | null): string | null {
    const current = selectValidator(headers);
    if (expected !== null && current !== expected) throw new MetadataError("INVALID_VALUE", "HTTP resource validator changed during metadata reads.");
    return current;
  }

  private async readBody(response: Response, maxBytes: number): Promise<ResponseBody> {
    throwIfAborted(this.signal);
    const encoding = contentEncoding(response.headers);
    const declaredLength = safeHeaderInteger(response.headers, "content-length");
    if (declaredLength !== null && declaredLength > maxBytes) {
      await cancelResponse(response);
      throw new MetadataError("LIMIT_EXCEEDED", "HTTP response exceeds the configured byte limit.");
    }
    let bytes: Uint8Array;
    if (response.body === null) {
      const buffer = await response.arrayBuffer();
      throwIfAborted(this.signal);
      if (!isArrayBuffer(buffer)) throw new MetadataError("INVALID_VALUE", "HTTP response arrayBuffer() did not return an ArrayBuffer.");
      bytes = new Uint8Array(buffer);
      if (bytes.byteLength > maxBytes) throw new MetadataError("LIMIT_EXCEEDED", "HTTP response exceeds the configured byte limit.");
    } else {
      const reader = response.body.getReader();
      const parts: Uint8Array[] = [];
      let length = 0;
      try {
        for (;;) {
          throwIfAborted(this.signal);
          const next = await reader.read();
          if (next.done) break;
          if (next.value.byteLength === 0) continue;
          if (next.value.byteLength > maxBytes - length) {
            await reader.cancel();
            throw new MetadataError("LIMIT_EXCEEDED", "HTTP response exceeds the configured byte limit.");
          }
          parts.push(next.value);
          length += next.value.byteLength;
        }
      } finally {
        reader.releaseLock();
      }
      bytes = new Uint8Array(length);
      let offset = 0;
      for (const part of parts) {
        bytes.set(part, offset);
        offset += part.byteLength;
      }
    }
    this.responseBytes += bytes.byteLength;
    this.decodedBytes += bytes.byteLength;
    return { bytes, contentEncoding: encoding };
  }

  private async probe(useRanges: boolean): Promise<void> {
    const response = await this.request(this.headersForRange(0, 1), true);
    if (response.status === 206) {
      const range = parseContentRange(response.headers);
      if (range === null || range.start !== 0 || range.end !== 0) {
        await cancelResponse(response);
        if (useRanges) { await this.fallback("invalid-range-response"); return; }
        throw new MetadataError("INVALID_VALUE", "HTTP 206 probe did not return bytes 0-0.");
      }
      this.totalBytes = range.total;
      if (this.totalBytes > this.limits.maxInputBytes) {
        await cancelResponse(response);
        throw new MetadataError("LIMIT_EXCEEDED", `HTTP resource is ${this.totalBytes} bytes; the configured input limit is ${this.limits.maxInputBytes}.`);
      }
      const encoding = contentEncoding(response.headers);
      this.validator = this.validateValidator(response.headers, null);
      if (encoding !== null && useRanges) {
        await cancelResponse(response);
        this.totalBytes = 0;
        await this.fallback("compressed-response");
        return;
      }
      if (useRanges && this.requireValidator && this.validator === null) {
        await cancelResponse(response);
        await this.fallback("missing-validator");
        return;
      }
      this.validateContentLength(response.headers, 1);
      const body = await this.readBody(response, 1);
      if (body.bytes.byteLength !== 1) throw new MetadataError("INVALID_VALUE", "HTTP 206 probe returned an unexpected body length.");
      this.probeByte = body.bytes.slice();
      this.rangeSupported = true;
      this.mode = useRanges ? "range" : "full";
      return;
    }
    if (response.status === 200) {
      if (!useRanges) {
        const encoding = contentEncoding(response.headers);
        const declaredLength = safeHeaderInteger(response.headers, "content-length");
        this.totalBytes = encoding === null ? declaredLength ?? 0 : 0;
        const current = this.validateValidator(response.headers, null);
        this.validator = current;
        const body = await this.readBody(response, this.fullResponseBodyLimit());
        if (encoding === null && declaredLength !== null && body.bytes.byteLength !== declaredLength) throw new MetadataError("INVALID_VALUE", "HTTP full response length does not match Content-Length.");
        if (this.totalBytes === 0) this.totalBytes = body.bytes.byteLength;
        if (body.contentEncoding === null && body.bytes.byteLength !== this.totalBytes) throw new MetadataError("INVALID_VALUE", "HTTP full response length does not match its declared size.");
        if (body.bytes.byteLength > this.limits.maxInputBytes) throw new MetadataError("LIMIT_EXCEEDED", "HTTP full response exceeds maxInputBytes.");
        this.fullBytes = body.bytes;
        this.fullResponseRequestCount += 1;
        this.rangeSupported = false;
        this.mode = "full";
        return;
      }
      if (!this.allowFullResponseFallback) {
        await cancelResponse(response);
        throw new MetadataError("INVALID_VALUE", "HTTP server ignored the byte-range probe; enable allowFullResponseFallback to permit a bounded full response.");
      }
      const encoding = contentEncoding(response.headers);
      const declaredLength = safeHeaderInteger(response.headers, "content-length");
      this.totalBytes = encoding === null ? declaredLength ?? 0 : 0;
      this.validator = this.validateValidator(response.headers, null);
      const body = await this.readBody(response, this.fullResponseBodyLimit());
      if (encoding === null && declaredLength !== null && body.bytes.byteLength !== declaredLength) throw new MetadataError("INVALID_VALUE", "HTTP full response length does not match Content-Length.");
      if (this.totalBytes === 0) this.totalBytes = body.bytes.byteLength;
      this.validateFullBody(body.bytes, body.contentEncoding);
      this.fullBytes = body.bytes;
      this.fullResponseRequestCount += 1;
      this.rangeSupported = false;
      this.mode = "fallback";
      this.fallbackReason = "range-ignored";
      return;
    }
    if (response.status === 416) {
      const unsatisfied = parseUnsatisfiedContentRange(response.headers);
      await cancelResponse(response);
      if (unsatisfied?.total === 0) throw new MetadataError("INVALID_VALUE", "HTTP resource is empty and cannot contain image metadata.");
      throw new MetadataError("INVALID_VALUE", "HTTP server rejected the byte-range probe.");
    }
    await cancelResponse(response);
    throw new MetadataError("INVALID_VALUE", `HTTP range probe returned unexpected status ${response.status}.`);
  }

  private validateFullBody(bytes: Uint8Array, encoding: string | null): void {
    if (bytes.byteLength > this.maxFullResponseBytes || bytes.byteLength > this.limits.maxInputBytes) throw new MetadataError("LIMIT_EXCEEDED", "HTTP full response exceeds the configured input limit.");
    if (encoding === null && this.totalBytes !== 0 && bytes.byteLength !== this.totalBytes) throw new MetadataError("INVALID_VALUE", "HTTP full response length does not match the probed resource size.");
    if (encoding !== null && this.totalBytes !== 0 && bytes.byteLength !== this.totalBytes) throw new MetadataError("INVALID_VALUE", "Decoded HTTP full response length does not match the probed resource size.");
  }

  private async fetchFull(reason: HttpFallbackReason | "full-response"): Promise<void> {
    const headers = new Headers(this.baseHeaders);
    headers.delete("range");
    headers.delete("if-range");
    const response = await this.request(headers, false);
    if (response.status !== 200) {
      await cancelResponse(response);
      throw new MetadataError("INVALID_VALUE", `HTTP full-response fallback returned unexpected status ${response.status}.`);
    }
    const current = this.validateValidator(response.headers, this.validator);
    if (this.validator === null) this.validator = current;
    const body = await this.readBody(response, this.fullResponseBodyLimit());
    if (this.totalBytes === 0) this.totalBytes = body.bytes.byteLength;
    this.validateFullBody(body.bytes, body.contentEncoding);
    this.fullBytes = body.bytes;
    this.fullResponseRequestCount += 1;
    if (reason !== "full-response") {
      this.mode = "fallback";
      this.fallbackReason = reason;
    } else {
      this.mode = "full";
    }
  }

  private async fallback(reason: HttpFallbackReason): Promise<void> {
    if (!this.allowFullResponseFallback) throw new MetadataError("INVALID_VALUE", `HTTP range read cannot continue safely (${reason}); enable allowFullResponseFallback for a bounded full response.`);
    this.fallbackReason = reason;
    await this.fetchFull(reason);
  }

  private requiredFullBytes(): Uint8Array {
    const bytes = this.fullBytes;
    if (bytes === null) throw new MetadataError("INVALID_VALUE", "HTTP fallback did not produce a complete response.");
    return bytes;
  }

  public async readRange(start: number, end: number): Promise<Uint8Array> {
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end > this.totalBytes) throw new MetadataError("UNSAFE_OFFSET", "HTTP metadata range is outside the validated resource.");
    throwIfAborted(this.signal);
    if (start === end) return new Uint8Array();
    if (this.fullBytes !== null) return this.fullBytes.subarray(start, end).slice();
    if (this.probeByte !== null && start === 0) {
      if (end === 1) return this.probeByte.slice();
      const remainder = await this.readRange(1, end);
      const output = new Uint8Array(1 + remainder.byteLength);
      output[0] = this.probeByte[0] ?? 0;
      output.set(remainder, 1);
      return output;
    }
    const response = await this.request(this.headersForRange(start, end), true);
    if (response.status === 206) {
      const range = parseContentRange(response.headers);
      if (range === null || range.start !== start || range.end !== end - 1 || range.total !== this.totalBytes) {
        await cancelResponse(response);
        await this.fallback("invalid-range-response");
        return this.requiredFullBytes().subarray(start, end).slice();
      }
      const encoding = contentEncoding(response.headers);
      if (encoding !== null) {
        await cancelResponse(response);
        await this.fallback("compressed-response");
        return this.requiredFullBytes().subarray(start, end).slice();
      }
      this.validateValidator(response.headers, this.validator);
      this.validateContentLength(response.headers, end - start);
      if (end - start > this.remainingResponseBudget()) {
        await cancelResponse(response);
        throw new MetadataError("LIMIT_EXCEEDED", "HTTP cumulative response limit was exceeded.");
      }
      const body = await this.readBody(response, end - start);
      if (body.bytes.byteLength !== end - start) throw new MetadataError("INVALID_VALUE", "HTTP 206 response body length does not match Content-Range.");
      return body.bytes;
    }
    if (response.status === 200) {
      const current = this.validateValidator(response.headers, this.validator);
      if (this.validator === null) this.validator = current;
      if (!this.allowFullResponseFallback) {
        await cancelResponse(response);
        throw new MetadataError("INVALID_VALUE", "HTTP server stopped honoring byte ranges; enable allowFullResponseFallback to permit a bounded full response.");
      }
      const body = await this.readBody(response, this.maxFullResponseBytes);
      if (this.totalBytes === 0) this.totalBytes = body.bytes.byteLength;
      this.validateFullBody(body.bytes, body.contentEncoding);
      this.fullBytes = body.bytes;
      this.fullResponseRequestCount += 1;
      this.mode = "fallback";
      this.fallbackReason = "range-ignored";
      return body.bytes.subarray(start, end).slice();
    }
    if (response.status === 416) {
      const unsatisfied = parseUnsatisfiedContentRange(response.headers);
      await cancelResponse(response);
      if (unsatisfied?.total !== this.totalBytes) throw new MetadataError("INVALID_VALUE", "HTTP resource size changed during range reads.");
      throw new MetadataError("INVALID_VALUE", "HTTP server rejected a validated byte range.");
    }
    await cancelResponse(response);
    throw new MetadataError("INVALID_VALUE", `HTTP range request returned unexpected status ${response.status}.`);
  }

  public async fullResponse(): Promise<Uint8Array> {
    if (this.fullBytes !== null) return this.fullBytes.slice();
    await this.fetchFull("full-response");
    return this.requiredFullBytes().slice();
  }

  public totalSize(): number {
    return this.totalBytes;
  }

  public telemetry(core: ReadTelemetry | undefined): HttpReadTelemetry {
    return {
      requestCount: this.requestCount,
      rangeRequestCount: this.rangeRequestCount,
      fullResponseRequestCount: this.fullResponseRequestCount,
      responseBytes: this.responseBytes,
      decodedBytes: this.decodedBytes,
      cacheHits: core?.cacheHits ?? 0,
      coalescedReads: core?.coalescedReads ?? 0,
      fallbackReason: this.fallbackReason,
      mode: this.mode,
      rangeSupported: this.rangeSupported,
      complete: this.fullBytes !== null || this.rangeSupported,
      totalBytes: this.totalBytes,
      validator: this.validator,
      requestedUrl: this.initialUrl.toString(),
      redirected: this.redirected,
      finalUrl: this.finalUrl.toString(),
      warnings: this.warnings.slice(),
    };
  }
}

interface RemoteBlob {
  readonly size: number;
  readonly arrayBuffer: () => Promise<ArrayBuffer>;
  readonly slice: (start?: number, end?: number) => RemoteBlob;
}

function remoteBlob(transport: HttpRangeTransport): Blob {
  const make = (start = 0, end = transport.totalSize()): RemoteBlob => ({
    size: end - start,
    arrayBuffer: async () => asArrayBuffer(start === 0 && end === transport.totalSize() ? await transport.fullResponse() : await transport.readRange(start, end)),
    slice: (nextStart = 0, nextEnd = end - start) => {
      const localStart = Math.max(0, Math.min(end - start, Math.trunc(nextStart)));
      const localEnd = Math.max(localStart, Math.min(end - start, Math.trunc(nextEnd)));
      return make(start + localStart, start + localEnd);
    },
  });
  return make() as unknown as Blob;
}

function withHttpTelemetry(result: MetadataResult, transport: HttpRangeTransport): MetadataResult {
  const core = result.telemetry ?? { readRequests: 0, bytesRead: 0, cacheHits: 0, coalescedReads: 0, cacheBytes: 0 };
  return { ...result, telemetry: { ...core, http: transport.telemetry(core) } };
}

/**
 * Fetch and parse metadata through validated HTTP byte ranges. The default
 * scope is `metadata`; callers must explicitly opt into a bounded complete
 * response fallback when a server does not provide trustworthy ranges.
 */
export async function fetchMetadata(input: RequestInfo | URL, options: HttpMetadataOptions = {}): Promise<MetadataResult> {
  const limits = resolveLimits(options.limits);
  const combined = combineSignals(options.signal, options.init?.signal ?? undefined);
  try {
    throwIfAborted(combined.signal);
    const transport = await HttpRangeTransport.create(input, options, limits, combined.signal);
    const source = remoteBlob(transport);
    const coreOptions: ParseOptions = {
      ...(options.limits === undefined ? {} : { limits: options.limits }),
      ...(options.select === undefined ? {} : { select: options.select }),
      ...(options.registry === undefined ? {} : { registry: options.registry }),
      ...(options.normalization === undefined ? {} : { normalization: options.normalization }),
      scope: options.scope ?? "metadata",
      ...(combined.signal === undefined ? {} : { signal: combined.signal }),
    };
    const result = await parseMetadata(source, coreOptions);
    return withHttpTelemetry(result, transport);
  } catch (error) {
    if (combined.signal?.aborted) throw new MetadataError("ABORTED", "HTTP metadata operation was aborted.");
    throw error;
  } finally {
    combined.cleanup();
  }
}

/** Alias naming the network operation explicitly for callers migrating from `/fetch`. */
export const fetchHttpMetadata = fetchMetadata;

export type { HttpFallbackReason, HttpReadTelemetry } from "./types.js";
