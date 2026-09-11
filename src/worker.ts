import { MetadataError, parseMetadata, redactMetadata, sanitizeMetadata } from "./index.js";
import type {
  MetadataInput,
  MetadataResult,
  ParseOptions,
  RedactOptions,
  RedactionResult,
  SanitizationResult,
} from "./types.js";

type WorkerOperation = "parse" | "redact" | "sanitize";
type WorkerResult = MetadataResult | RedactionResult | SanitizationResult;

interface WorkerRequest {
  readonly type: "browser-image-metadata:request";
  readonly id: number;
  readonly operation: WorkerOperation;
  readonly data: ArrayBuffer;
  readonly options: ParseOptions | RedactOptions;
}

interface WorkerCancel {
  readonly type: "browser-image-metadata:cancel";
  readonly id: number;
}

interface WorkerResponse {
  readonly type: "browser-image-metadata:response";
  readonly id: number;
  readonly result?: WorkerResult;
  readonly error?: { readonly name: string; readonly code?: string; readonly message: string };
}

interface MessagePortLike {
  postMessage(message: unknown, transfer?: readonly Transferable[]): void;
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
}

export interface MetadataWorkerClientOptions {
  /** Maximum queued and running requests. Defaults to 16. */
  readonly maxPending?: number;
  /** End the worker when a caller aborts, providing immediate cancellation for synchronous parsers. */
  readonly terminateOnAbort?: boolean;
}

interface Pending {
  readonly resolve: (value: WorkerResult) => void;
  readonly reject: (reason: unknown) => void;
  readonly abort: (() => void) | undefined;
}

function ownedBuffer(input: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  const source = input instanceof ArrayBuffer
    ? new Uint8Array(input)
    : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy.buffer;
}

async function transferableInput(input: MetadataInput): Promise<ArrayBuffer> {
  if (typeof Blob !== "undefined" && input instanceof Blob) return input.arrayBuffer();
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) return ownedBuffer(input);
  throw new MetadataError("INVALID_VALUE", "Worker requests require an ArrayBuffer, view, Blob, or File.");
}

function responseTransfer(result: WorkerResult): readonly Transferable[] {
  if ("data" in result && result.data instanceof Uint8Array) return [result.data.buffer];
  return [];
}

/**
 * Create a request-ID based client for a module worker that calls
 * `installMetadataWorker()` below. Inputs are copied into owned transferable
 * buffers so callers retain their original views.
 */
export function createMetadataWorkerClient(port: MessagePortLike, options: MetadataWorkerClientOptions = {}) {
  const maxPending = options.maxPending ?? 16;
  if (!Number.isSafeInteger(maxPending) || maxPending < 1) throw new RangeError("maxPending must be a positive safe integer.");
  let closed = false;
  let nextId = 1;
  const pending = new Map<number, Pending>();

  const receive = (event: MessageEvent<unknown>): void => {
    const message = event.data as Partial<WorkerResponse>;
    if (message.type !== "browser-image-metadata:response" || typeof message.id !== "number") return;
    const request = pending.get(message.id);
    if (request === undefined) return;
    pending.delete(message.id);
    request.abort?.();
    if (message.error !== undefined) {
      request.reject(Object.assign(new Error(message.error.message), { name: message.error.name, code: message.error.code }));
    } else if (message.result !== undefined) {
      request.resolve(message.result);
    } else {
      request.reject(new MetadataError("INVALID_VALUE", "Worker response did not include a result or error."));
    }
  };
  port.addEventListener("message", receive);

  const request = async <T extends WorkerResult>(operation: WorkerOperation, input: MetadataInput, requestOptions: ParseOptions | RedactOptions = {}): Promise<T> => {
    if (closed) throw new MetadataError("ABORTED", "Metadata worker client has been closed.");
    if (pending.size >= maxPending) throw new MetadataError("LIMIT_EXCEEDED", `Metadata worker queue is limited to ${maxPending} requests.`);
    if (requestOptions.signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
    const data = await transferableInput(input);
    const id = nextId++;
    return new Promise<T>((resolve, reject) => {
      const onAbort = (): void => {
        if (!pending.delete(id)) return;
        port.postMessage({ type: "browser-image-metadata:cancel", id } satisfies WorkerCancel);
        if (options.terminateOnAbort && "terminate" in port && typeof (port as { terminate?: unknown }).terminate === "function") {
          (port as { terminate(): void }).terminate();
          closed = true;
        }
        reject(new MetadataError("ABORTED", "Metadata operation was aborted."));
      };
      requestOptions.signal?.addEventListener("abort", onAbort, { once: true });
      pending.set(id, { resolve: resolve as (value: WorkerResult) => void, reject, abort: () => requestOptions.signal?.removeEventListener("abort", onAbort) });
      const wireOptions = { ...requestOptions } as { signal?: AbortSignal };
      delete wireOptions.signal;
      const message: WorkerRequest = { type: "browser-image-metadata:request", id, operation, data, options: wireOptions };
      port.postMessage(message, [data]);
    });
  };

  return {
    parse: (input: MetadataInput, requestOptions: ParseOptions = {}) => request<MetadataResult>("parse", input, requestOptions),
    redact: (input: MetadataInput, requestOptions: RedactOptions) => request<RedactionResult>("redact", input, requestOptions),
    sanitize: (input: MetadataInput, requestOptions: ParseOptions = {}) => request<SanitizationResult>("sanitize", input, requestOptions),
    close: (): void => {
      if (closed) return;
      closed = true;
      port.removeEventListener("message", receive);
      for (const request of pending.values()) {
        request.abort?.();
        request.reject(new MetadataError("ABORTED", "Metadata worker client was closed."));
      }
      pending.clear();
    },
  };
}

/** Install the request handler in a browser module worker. */
export function installMetadataWorker(port: MessagePortLike = self as unknown as MessagePortLike): () => void {
  const controllers = new Map<number, AbortController>();
  const receive = async (event: MessageEvent<unknown>): Promise<void> => {
    const message = event.data as {
      readonly type?: string;
      readonly id?: number;
      readonly data?: unknown;
      readonly operation?: unknown;
      readonly options?: unknown;
    };
    if (message.type === "browser-image-metadata:cancel" && typeof message.id === "number") {
      controllers.get(message.id)?.abort();
      return;
    }
    if (message.type !== "browser-image-metadata:request" || typeof message.id !== "number" || !(message.data instanceof ArrayBuffer) || (message.operation !== "parse" && message.operation !== "redact" && message.operation !== "sanitize")) return;
    const controller = new AbortController();
    controllers.set(message.id, controller);
    try {
      const baseOptions = typeof message.options === "object" && message.options !== null ? message.options : {};
      const options = { ...baseOptions, signal: controller.signal };
      const result = message.operation === "parse"
        ? await parseMetadata(message.data, options)
        : message.operation === "redact"
          ? await redactMetadata(message.data, options as RedactOptions)
          : await sanitizeMetadata(message.data, options);
      port.postMessage({ type: "browser-image-metadata:response", id: message.id, result } satisfies WorkerResponse, responseTransfer(result));
    } catch (error) {
      const source = error instanceof Error ? error : new Error("Metadata worker failed.");
      port.postMessage({ type: "browser-image-metadata:response", id: message.id, error: { name: source.name, message: source.message, ...("code" in source && typeof source.code === "string" ? { code: source.code } : {}) } } satisfies WorkerResponse);
    } finally {
      controllers.delete(message.id);
    }
  };
  const listener = (event: MessageEvent<unknown>): void => { void receive(event); };
  port.addEventListener("message", listener);
  return (): void => {
    port.removeEventListener("message", listener);
    for (const controller of controllers.values()) controller.abort();
    controllers.clear();
  };
}
