import { parseMetadata } from "./index.js";
import { throwIfAborted } from "./security/abort.js";
import { resolveLimits } from "./security/limits.js";
import { MetadataError, type MetadataResult, type ParseOptions } from "./types.js";

/** Explicit network adapter options. The core parser itself never fetches. */
export interface FetchMetadataOptions extends ParseOptions {
  /** A supplied fetch implementation, useful for tests and restricted runtimes. */
  readonly fetch?: typeof globalThis.fetch;
  /** Request options forwarded to fetch. `signal` takes precedence when supplied directly. */
  readonly init?: RequestInit;
}

async function readResponse(response: Response, maxInputBytes: number, signal?: AbortSignal): Promise<Uint8Array> {
  if (!response.ok) {
    throw new MetadataError("INVALID_VALUE", `Metadata request failed with HTTP ${response.status}.`);
  }
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null && /^\d+$/.test(contentLength) && Number(contentLength) > maxInputBytes) {
    throw new MetadataError("LIMIT_EXCEEDED", `Metadata response declares ${contentLength} bytes, exceeding the configured input limit of ${maxInputBytes}.`);
  }
  if (response.body === null) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxInputBytes) throw new MetadataError("LIMIT_EXCEEDED", `Metadata response exceeds the configured input limit of ${maxInputBytes} bytes.`);
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  let done = false;
  try {
    while (!done) {
      throwIfAborted(signal);
      const next = await reader.read();
      done = next.done;
      if (done) continue;
      const value = next.value;
      if (value === undefined || value.byteLength === 0) continue;
      if (value.byteLength > maxInputBytes - length) {
        await reader.cancel();
        throw new MetadataError("LIMIT_EXCEEDED", `Metadata response exceeds the configured input limit of ${maxInputBytes} bytes.`);
      }
      chunks.push(value);
      length += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/**
 * Fetch an image through an explicit adapter, enforce the normal input budget
 * while streaming, then parse its bytes locally. This function never follows
 * a URL unless the caller invokes it.
 */
export async function fetchMetadata(input: RequestInfo | URL, options: FetchMetadataOptions = {}): Promise<MetadataResult> {
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  if (typeof fetchImplementation !== "function") {
    throw new MetadataError("UNSUPPORTED_FORMAT", "No fetch implementation is available; provide FetchMetadataOptions.fetch or parse local bytes directly.");
  }
  throwIfAborted(options.signal);
  const response = await fetchImplementation(input, { ...options.init, ...(options.signal === undefined ? {} : { signal: options.signal }) });
  const bytes = await readResponse(response, resolveLimits(options.limits).maxInputBytes, options.signal);
  throwIfAborted(options.signal);
  return parseMetadata(bytes, options);
}
