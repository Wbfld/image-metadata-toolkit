import type { SecurityLimits } from "../types.js";
import type { detectFormat } from "../detect-format.js";
import { C2PA_WEB_SDK_PROVENANCE, C2PA_WEB_SDK_VERSION, classifyOfficialError, materializeAdapterInput, normalizeOfficialResult, unavailableResult } from "./c2pa-adapter.js";
import type { C2paVerificationInput, C2paVerificationResult, C2paVerificationOptions } from "./c2pa-types.js";

export interface C2paBrowserVerificationOptions extends C2paVerificationOptions {
  readonly limits?: Partial<SecurityLimits>;
  /** URL or Request-compatible value for the official WASM module. */
  readonly wasmSrc?: string | URL | WebAssembly.Module;
}

type RecordValue = Readonly<Record<string, unknown>>;

function record(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function unavailable(format: ReturnType<typeof detectFormat>, status: Parameters<typeof unavailableResult>[0]["status"], message: string, officialResult?: unknown): C2paVerificationResult {
  return unavailableResult({ adapter: "browser", package: "@contentauth/c2pa-web", format, status, sdkVersion: C2PA_WEB_SDK_VERSION, sdkProvenance: C2PA_WEB_SDK_PROVENANCE, diagnostics: [message], ...(officialResult === undefined ? {} : { officialResult }) });
}

/** Verify C2PA through the official browser SDK. The core inventory API is not
 * used as a verification substitute and no remote manifest is fetched unless
 * the caller explicitly enables it in the official SDK settings. */
export async function verifyC2paInBrowser(input: C2paVerificationInput, options: C2paBrowserVerificationOptions = {}): Promise<C2paVerificationResult> {
  const materialized = await materializeAdapterInput(input, options.limits);
  const packageName = "@contentauth/c2pa-web";
  let sdk: RecordValue;
  try {
    sdk = await import(packageName) as RecordValue;
  } catch (error) {
    const code = record(error)?.code;
    return unavailable(materialized.format, "adapter:sdk-unavailable", code === "ERR_MODULE_NOT_FOUND" ? "The optional official browser C2PA SDK is not installed." : "The official browser C2PA SDK could not be loaded.");
  }
  const create = sdk.createC2pa;
  if (typeof create !== "function") return unavailable(materialized.format, "adapter:runtime-error", "The installed official browser C2PA SDK has no createC2pa entry point.");
  if (options.wasmSrc === undefined) return unavailable(materialized.format, "adapter:configuration", "A version-matched official C2PA WASM source is required for browser verification.");
  const mimeType = materialized.format.mimeType;
  const blob = new Blob([materialized.bytes as unknown as BlobPart], { type: mimeType });
  try {
    const config = { wasmSrc: options.wasmSrc };
    const c2pa = await (create as (config: unknown) => Promise<unknown>)(config);
    const c2paRecord = record(c2pa);
    const c2paReaderApi = record(c2paRecord?.reader);
    const fromBlob = c2paReaderApi?.fromBlob;
    if (typeof fromBlob !== "function") return unavailable(materialized.format, "adapter:runtime-error", "The installed official browser C2PA SDK has no reader.fromBlob entry point.");
    const reader = await (fromBlob as (this: unknown, mime: string, value: Blob) => Promise<unknown>).call(c2paReaderApi, mimeType, blob);
    const readerRecord = record(reader);
    if (readerRecord === null) return normalizeOfficialResult({ adapter: "browser", package: "@contentauth/c2pa-web", sdkVersion: C2PA_WEB_SDK_VERSION, sdkProvenance: C2PA_WEB_SDK_PROVENANCE, format: materialized.format, result: null, diagnostics: ["The official SDK reported no embedded manifest store."] });
    if (typeof readerRecord.manifestStore !== "function") {
      if (typeof readerRecord.free === "function") await (readerRecord.free as (this: unknown) => Promise<void>).call(readerRecord);
      return unavailable(materialized.format, "adapter:runtime-error", "The installed official browser C2PA SDK returned a reader without manifestStore.");
    }
    let manifestStore: unknown;
    try {
      manifestStore = await (readerRecord.manifestStore as (this: unknown) => Promise<unknown>).call(readerRecord);
    } finally {
      if (typeof readerRecord.free === "function") await (readerRecord.free as (this: unknown) => Promise<void>).call(readerRecord);
    }
    return normalizeOfficialResult({ adapter: "browser", package: "@contentauth/c2pa-web", sdkVersion: C2PA_WEB_SDK_VERSION, sdkProvenance: C2PA_WEB_SDK_PROVENANCE, format: materialized.format, result: manifestStore, diagnostics: [] });
  } catch (error) {
    return unavailable(materialized.format, classifyOfficialError(error), "The official browser C2PA SDK returned a typed runtime or format result.", error);
  }
}

export const C2PA_BROWSER_SDK = Object.freeze({ package: "@contentauth/c2pa-web" as const, version: C2PA_WEB_SDK_VERSION, license: "MIT" as const, provenance: C2PA_WEB_SDK_PROVENANCE });

export type { C2paVerificationInput, C2paVerificationOptions, C2paVerificationResult, C2paAdapterStatus } from "./c2pa-types.js";
