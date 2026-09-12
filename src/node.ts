import { open } from "node:fs/promises";
import { parseMetadata as parseLocalMetadata } from "./index.js";
import { throwIfAborted } from "./security/abort.js";
import { resolveLimits } from "./security/limits.js";
import { MetadataError, type MetadataInput, type MetadataResult, type ParseOptions, type SecurityLimits } from "./types.js";

/** A structurally typed Node file handle accepted by the explicit Node entry. */
export interface NodeFileHandle {
  readonly stat: () => Promise<{ readonly size: number }>;
  readonly read: (buffer: Uint8Array, offset: number, length: number, position: number) => Promise<{ readonly bytesRead: number; readonly buffer: Uint8Array }>;
  readonly close: () => Promise<void>;
}

/** A caller-provided source that can return bounded half-open byte ranges. */
export interface SeekableFileSource {
  readonly size: number;
  readonly read: (start: number, end: number, signal?: AbortSignal) => Promise<ArrayBuffer | ArrayBufferView>;
  /** The adapter takes ownership and calls this after parsing by default. */
  readonly close?: () => void | Promise<void>;
}

/** Any Node stream or async iterable yielding binary chunks. Streams are spooled fully. */
export type NodeByteStream = AsyncIterable<unknown>;

export type NodeMetadataInput = MetadataInput | string | URL | NodeFileHandle | SeekableFileSource | NodeByteStream;

export interface NodeParseOptions extends ParseOptions {
  /** Close a supplied FileHandle or seekable source after parsing. Defaults to true. */
  readonly closeSource?: boolean;
  /** Maximum number of chunks accepted from a non-seekable stream. Defaults to maxReadRequests. */
  readonly maxStreamChunks?: number;
}

interface NodeRangeBlob {
  readonly size: number;
  readonly arrayBuffer: () => Promise<ArrayBuffer>;
  readonly slice: (start?: number, end?: number) => NodeRangeBlob;
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

function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return typeof value === "object" && value !== null && ArrayBuffer.isView(value);
}

function isBlobLike(value: unknown): value is Blob {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { readonly size?: unknown; readonly arrayBuffer?: unknown };
  return typeof candidate.size === "number" && typeof candidate.arrayBuffer === "function";
}

function isCoreInput(value: unknown): value is MetadataInput {
  return isArrayBuffer(value) || isArrayBufferView(value) || isBlobLike(value);
}

function isPath(value: unknown): value is string | URL {
  return typeof value === "string" || value instanceof URL;
}

function isFileHandle(value: unknown): value is NodeFileHandle {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<NodeFileHandle>;
  return typeof candidate.stat === "function" && typeof candidate.read === "function" && typeof candidate.close === "function";
}

function isSeekableFileSource(value: unknown): value is SeekableFileSource {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<SeekableFileSource>;
  return typeof candidate.size === "number" && typeof candidate.read === "function";
}

function isNodeByteStream(value: unknown): value is NodeByteStream {
  return typeof value === "object" && value !== null && typeof (value as { readonly [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === "function";
}

function validateSize(size: number, label: string): void {
  if (!Number.isSafeInteger(size) || size < 0) throw new MetadataError("INVALID_VALUE", `${label} size must be a non-negative safe integer.`);
}

function validateRange(size: number, start: number, end: number): void {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end > size) {
    throw new MetadataError("UNSAFE_OFFSET", "Node source range is outside the input.");
  }
}

function toBytes(value: unknown, label: string): Uint8Array {
  if (isArrayBuffer(value)) return new Uint8Array(value).slice();
  if (isArrayBufferView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
  throw new MetadataError("INVALID_VALUE", `${label} must yield an ArrayBuffer or ArrayBufferView.`);
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

function asError(value: unknown, fallback: string): Error {
  return value instanceof Error ? value : new Error(`${fallback}: ${String(value)}`);
}

async function awaitWithAbort<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
  throwIfAborted(signal);
  if (signal === undefined) return operation;
  let abortReject: ((reason: unknown) => void) | undefined;
  const abortPromise = new Promise<never>((_resolve, reject) => { abortReject = reject; });
  const abortHandler = (): void => { abortReject?.(new MetadataError("ABORTED", "Metadata operation was aborted.")); };
  signal.addEventListener("abort", abortHandler, { once: true });
  operation.catch(() => undefined);
  try {
    return await Promise.race([operation, abortPromise]);
  } finally {
    signal.removeEventListener("abort", abortHandler);
  }
}

async function readSeekable(source: SeekableFileSource, start: number, end: number, signal?: AbortSignal): Promise<Uint8Array> {
  validateRange(source.size, start, end);
  throwIfAborted(signal);
  const value = await awaitWithAbort(Promise.resolve().then(() => source.read(start, end, signal)), signal);
  throwIfAborted(signal);
  const bytes = toBytes(value, "Seekable source result");
  if (bytes.byteLength !== end - start) throw new MetadataError("INVALID_VALUE", "Seekable source returned an unexpected range length.");
  return bytes;
}

function rangeBlob(source: SeekableFileSource, signal: AbortSignal | undefined, baseStart = 0, baseEnd = source.size): NodeRangeBlob {
  const size = baseEnd - baseStart;
  return {
    size,
    arrayBuffer: async () => asArrayBuffer(await readSeekable(source, baseStart, baseEnd, signal)),
    slice: (requestedStart = 0, requestedEnd = size) => {
      validateRange(size, requestedStart, requestedEnd);
      return rangeBlob(source, signal, baseStart + requestedStart, baseStart + requestedEnd);
    },
  };
}

async function fileHandleSource(handle: NodeFileHandle): Promise<SeekableFileSource> {
  const stats = await handle.stat();
  validateSize(stats.size, "FileHandle");
  return {
    size: stats.size,
    read: async (start, end, signal) => {
      validateRange(stats.size, start, end);
      const bytes = new Uint8Array(end - start);
      let offset = 0;
      while (offset < bytes.byteLength) {
        throwIfAborted(signal);
        const result = await handle.read(bytes, offset, bytes.byteLength - offset, start + offset);
        throwIfAborted(signal);
        if (!Number.isSafeInteger(result.bytesRead) || result.bytesRead < 0 || result.bytesRead > bytes.byteLength - offset) {
          throw new MetadataError("INVALID_VALUE", "FileHandle returned an invalid byte count.");
        }
        if (result.bytesRead === 0) break;
        offset += result.bytesRead;
      }
      if (offset !== bytes.byteLength) throw new MetadataError("TRUNCATED_DATA", "FileHandle ended before the requested range was read.");
      return bytes;
    },
    close: () => handle.close(),
  };
}

async function closeWithPrimaryError(close: (() => void | Promise<void>) | undefined, operation: () => Promise<MetadataResult>): Promise<MetadataResult> {
  if (close === undefined) return operation();
  let failed = false;
  let failure: unknown;
  let result: MetadataResult | undefined;
  let closeError: unknown;
  try {
    result = await operation();
  } catch (error) {
    failed = true;
    failure = error;
  }
  try {
    await close();
  } catch (error) {
    closeError = error;
  }
  if (failed) {
    if (closeError !== undefined) throw new AggregateError([asError(failure, "Node metadata source failed"), asError(closeError, "Node metadata source close failed")], "Node metadata source failed and could not be closed cleanly.");
    throw asError(failure, "Node metadata source failed");
  }
  if (closeError !== undefined) throw asError(closeError, "Node metadata source close failed");
  return result as MetadataResult;
}

async function spoolStream(stream: NodeByteStream, limits: SecurityLimits, signal: AbortSignal | undefined, maxChunks: number): Promise<Uint8Array> {
  const iterator = stream[Symbol.asyncIterator]();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let count = 0;
  let completed = false;
  let abortReject: ((reason: unknown) => void) | undefined;
  const abortPromise = new Promise<never>((_resolve, reject) => { abortReject = reject; });
  const abortHandler = (): void => {
    const error = new MetadataError("ABORTED", "Metadata operation was aborted.");
    const destroy = (stream as { readonly destroy?: unknown }).destroy;
    if (typeof destroy === "function") {
      try { (destroy as () => void).call(stream); } catch { /* The stable abort error is reported below. */ }
    }
    abortReject?.(error);
  };
  if (signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
  signal?.addEventListener("abort", abortHandler, { once: true });
  try {
    for (;;) {
      throwIfAborted(signal);
      const nextPromise = Promise.resolve(iterator.next());
      nextPromise.catch(() => undefined);
      const next = await Promise.race([nextPromise, abortPromise]);
      if (next.done) {
        completed = true;
        break;
      }
      count += 1;
      if (count > maxChunks) throw new MetadataError("LIMIT_EXCEEDED", `Node stream chunk limit of ${maxChunks} was exceeded.`);
      const bytes = toBytes(next.value, "Node stream chunk");
      if (bytes.byteLength > limits.maxInputBytes - total) throw new MetadataError("LIMIT_EXCEEDED", `Node stream exceeds the configured input limit of ${limits.maxInputBytes} bytes.`);
      chunks.push(bytes);
      total += bytes.byteLength;
    }
  } finally {
    signal?.removeEventListener("abort", abortHandler);
    if (!completed) {
      const destroy = (stream as { readonly destroy?: unknown }).destroy;
      if (typeof destroy === "function") {
        try { (destroy as () => void).call(stream); } catch { /* Preserve the original stream diagnostic. */ }
      }
      try {
        const cleanup = iterator.return?.();
        if (cleanup !== undefined) void Promise.resolve(cleanup).catch(() => undefined);
      } catch { /* Preserve the original stream diagnostic. */ }
    }
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function parseOptions(options: NodeParseOptions): ParseOptions {
  const localOptions = { ...options };
  Reflect.deleteProperty(localOptions, "closeSource");
  Reflect.deleteProperty(localOptions, "maxStreamChunks");
  return localOptions;
}

function validateOptions(options: NodeParseOptions): void {
  if (options.closeSource !== undefined && typeof options.closeSource !== "boolean") throw new MetadataError("INVALID_VALUE", "Node closeSource must be a boolean.");
  if (options.maxStreamChunks !== undefined && (!Number.isSafeInteger(options.maxStreamChunks) || options.maxStreamChunks < 1)) throw new MetadataError("INVALID_VALUE", "Node maxStreamChunks must be a positive safe integer.");
}

async function parseSeekable(source: SeekableFileSource, options: NodeParseOptions, limits?: SecurityLimits): Promise<MetadataResult> {
  const close = options.closeSource === false || source.close === undefined ? undefined : () => source.close?.();
  return closeWithPrimaryError(close, async () => {
    validateOptions(options);
    const resolvedLimits = limits ?? resolveLimits(options.limits);
    validateSize(source.size, "Seekable source");
    if (source.size > resolvedLimits.maxInputBytes) throw new MetadataError("LIMIT_EXCEEDED", `Input is ${source.size} bytes; the configured limit is ${resolvedLimits.maxInputBytes} bytes.`);
    return parseLocalMetadata(rangeBlob(source, options.signal) as unknown as Blob, parseOptions(options));
  });
}

async function parseHandle(handle: NodeFileHandle, options: NodeParseOptions, limits: SecurityLimits | undefined, alwaysClose: boolean): Promise<MetadataResult> {
  const close = alwaysClose || options.closeSource !== false ? () => handle.close() : undefined;
  return closeWithPrimaryError(close, async () => {
    validateOptions(options);
    const resolvedLimits = limits ?? resolveLimits(options.limits);
    const source = await fileHandleSource(handle);
    return parseSeekable({ size: source.size, read: source.read }, options, resolvedLimits);
  });
}

/** Parse a local Node path, FileHandle, seekable source, or binary stream. */
export async function parseMetadata(input: NodeMetadataInput, options: NodeParseOptions = {}): Promise<MetadataResult> {
  const localOptions = parseOptions(options);
  if (isCoreInput(input)) {
    validateOptions(options);
    resolveLimits(options.limits);
    throwIfAborted(options.signal);
    return parseLocalMetadata(input, localOptions);
  }
  if (isPath(input)) {
    validateOptions(options);
    const limits = resolveLimits(options.limits);
    throwIfAborted(options.signal);
    const handle = await open(input, "r");
    return parseHandle(handle, options, limits, true);
  }
  if (isFileHandle(input)) {
    return parseHandle(input, options, undefined, false);
  }
  if (isSeekableFileSource(input)) {
    return parseSeekable(input, options);
  }
  if (isNodeByteStream(input)) {
    validateOptions(options);
    const limits = resolveLimits(options.limits);
    const maxChunks = options.maxStreamChunks ?? limits.maxReadRequests;
    const bytes = await spoolStream(input, limits, options.signal, maxChunks);
    return parseLocalMetadata(bytes, localOptions);
  }
  validateOptions(options);
  resolveLimits(options.limits);
  throw new MetadataError("INVALID_VALUE", "Node input must be a path, FileHandle, seekable file source, binary stream, ArrayBuffer, ArrayBufferView, Blob, or File.");
}

/** Descriptive alias for callers that want to distinguish this from the core parser. */
export const parseNodeMetadata = parseMetadata;

/** Alias for applications whose primary input is a local file. */
export const parseFileMetadata = parseMetadata;

export type { MetadataResult, ParseOptions, SecurityLimits } from "./types.js";
