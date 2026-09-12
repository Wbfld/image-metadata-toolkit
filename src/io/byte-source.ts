import { MetadataError, type MetadataInput, type ReadTelemetry, type SecurityLimits } from "../types.js";
import { throwIfAborted } from "../security/abort.js";

export interface ByteSource {
  readonly size: number;
  readonly read: (start: number, end: number) => Promise<Uint8Array>;
  readonly telemetry: () => ReadTelemetry;
}

interface CacheEntry {
  readonly start: number;
  readonly end: number;
  readonly data: Uint8Array;
}

interface PendingRead {
  readonly start: number;
  readonly end: number;
  readonly resolve: (data: Uint8Array) => void;
  readonly reject: (error: unknown) => void;
}

interface ByteSourceOptions {
  readonly cacheBytes?: number;
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

function isBlobLike(value: unknown): value is Blob {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { readonly size?: unknown; readonly arrayBuffer?: unknown };
  return typeof candidate.size === "number" && typeof candidate.arrayBuffer === "function";
}

function validateSize(size: number): void {
  if (!Number.isSafeInteger(size) || size < 0) throw new MetadataError("INVALID_VALUE", "ByteSource size must be a non-negative safe integer.");
}

function validateRange(size: number, start: number, end: number): void {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end > size) {
    throw new MetadataError("UNSAFE_OFFSET", "ByteSource range is outside the input.");
  }
}

function mergeRange(reads: readonly PendingRead[]): { readonly start: number; readonly end: number } {
  return {
    start: Math.min(...reads.map(({ start }) => start)),
    end: Math.max(...reads.map(({ end }) => end)),
  };
}

function concatenate(parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

/**
 * Create a bounded, seekable source over bytes or a Blob/File. Reads are
 * validated before I/O, overlapping calls queued in the same turn are merged,
 * and a small LRU cache serves repeated ranges without touching the source.
 */
export function createByteSource(
  input: MetadataInput,
  limits: SecurityLimits,
  signal?: AbortSignal,
  options: ByteSourceOptions = {},
): ByteSource {
  let size: number;
  let readUnderlying: (start: number, end: number) => Promise<Uint8Array>;
  if (isArrayBuffer(input)) {
    const bytes = new Uint8Array(input);
    size = bytes.byteLength;
    readUnderlying = (start, end) => Promise.resolve(bytes.slice(start, end));
  } else if (ArrayBuffer.isView(input)) {
    const bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    size = bytes.byteLength;
    readUnderlying = (start, end) => Promise.resolve(bytes.slice(start, end));
  } else if (isBlobLike(input)) {
    size = input.size;
    if (typeof input.slice !== "function") throw new MetadataError("INVALID_VALUE", "ByteSource Blob/File inputs must implement slice().");
    readUnderlying = async (start, end) => {
      const buffer = await input.slice(start, end).arrayBuffer();
      if (!isArrayBuffer(buffer)) throw new MetadataError("INVALID_VALUE", "ByteSource Blob slice arrayBuffer() must resolve to an ArrayBuffer.");
      return new Uint8Array(buffer);
    };
  } else {
    throw new MetadataError("INVALID_VALUE", "Input must be an ArrayBuffer, ArrayBufferView, Blob, or File.");
  }
  validateSize(size);
  if (size > limits.maxInputBytes) throw new MetadataError("LIMIT_EXCEEDED", `Input is ${size} bytes; the configured limit is ${limits.maxInputBytes} bytes.`);

  const cacheLimit = options.cacheBytes ?? limits.maxReadCacheBytes;
  const cache: CacheEntry[] = [];
  const pending: PendingRead[] = [];
  let flushScheduled = false;
  let readRequests = 0;
  let bytesRead = 0;
  let cacheHits = 0;
  let coalescedReads = 0;
  let cacheBytes = 0;

  const snapshot = (): ReadTelemetry => ({ readRequests, bytesRead, cacheHits, coalescedReads, cacheBytes });

  const touch = (entry: CacheEntry): Uint8Array => {
    const index = cache.indexOf(entry);
    if (index >= 0) cache.splice(index, 1);
    cache.push(entry);
    cacheHits += 1;
    return entry.data;
  };

  const store = (start: number, end: number, data: Uint8Array): void => {
    if (cacheLimit <= 0 || data.byteLength > cacheLimit) return;
    while (cache.length > 0 && cacheBytes + data.byteLength > cacheLimit) {
      const evicted = cache.shift();
      if (evicted !== undefined) cacheBytes -= evicted.data.byteLength;
    }
    const entry = { start, end, data: data.slice() };
    cache.push(entry);
    cacheBytes += entry.data.byteLength;
  };

  const findCached = (start: number, end: number): Uint8Array | null => {
    for (let index = cache.length - 1; index >= 0; index -= 1) {
      const entry = cache[index];
      if (entry !== undefined && entry.start <= start && entry.end >= end) {
        const data = touch(entry);
        return data.subarray(start - entry.start, end - entry.start).slice();
      }
    }
    return null;
  };

  const flush = async (): Promise<void> => {
    flushScheduled = false;
    if (pending.length === 0) return;
    const queued = pending.splice(0, pending.length).sort((left, right) => left.start - right.start || left.end - right.end);
    const batches: PendingRead[][] = [];
    for (const request of queued) {
      const batch = batches.at(-1);
      const range = batch === undefined ? undefined : mergeRange(batch);
      if (batch === undefined || range === undefined || request.start > range.end) batches.push([request]);
      else batch.push(request);
    }
    for (const batch of batches) {
      const range = mergeRange(batch);
      if (batch.length > 1) coalescedReads += batch.length - 1;
      try {
        throwIfAborted(signal);
        if (readRequests >= limits.maxReadRequests) throw new MetadataError("LIMIT_EXCEEDED", `ByteSource read request limit of ${limits.maxReadRequests} was exceeded.`);
        if (range.end - range.start > limits.maxReadBytes - bytesRead) throw new MetadataError("LIMIT_EXCEEDED", `ByteSource cumulative read limit of ${limits.maxReadBytes} bytes was exceeded.`);
        readRequests += 1;
        const data = await readUnderlying(range.start, range.end);
        throwIfAborted(signal);
        if (data.byteLength !== range.end - range.start) throw new MetadataError("INVALID_VALUE", "ByteSource adapter returned an unexpected range length.");
        bytesRead += data.byteLength;
        store(range.start, range.end, data);
        for (const request of batch) request.resolve(data.subarray(request.start - range.start, request.end - range.start).slice());
      } catch (error) {
        for (const request of batch) request.reject(error);
      }
    }
  };

  const read = async (start: number, end: number): Promise<Uint8Array> => {
    validateRange(size, start, end);
    throwIfAborted(signal);
    if (start === end) return new Uint8Array();
    const cached = findCached(start, end);
    if (cached !== null) return cached;
    const overlap = [...cache].reverse().find((entry) => entry.start < end && entry.end > start);
    if (overlap !== undefined) {
      const overlapStart = Math.max(start, overlap.start);
      const overlapEnd = Math.min(end, overlap.end);
      const data = touch(overlap);
      const middle = data.subarray(overlapStart - overlap.start, overlapEnd - overlap.start).slice();
      const before = overlapStart === start ? new Uint8Array() : await read(start, overlapStart);
      const after = overlapEnd === end ? new Uint8Array() : await read(overlapEnd, end);
      return concatenate([before, middle, after]);
    }
    return new Promise<Uint8Array>((resolve, reject) => {
      pending.push({ start, end, resolve, reject });
      if (!flushScheduled) {
        flushScheduled = true;
        queueMicrotask(() => { void flush(); });
      }
    });
  };

  return { size, read, telemetry: snapshot };
}

export type { ByteSourceOptions };
