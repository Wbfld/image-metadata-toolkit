import type { SecurityLimits } from "../types.js";
import type { detectFormat } from "../detect-format.js";
import { C2PA_NODE_SDK_PROVENANCE, C2PA_NODE_SDK_VERSION, classifyOfficialError, materializeAdapterInput, normalizeOfficialResult, unavailableResult } from "./c2pa-adapter.js";
import type { C2paVerificationInput, C2paVerificationResult, C2paVerificationOptions } from "./c2pa-types.js";

export interface C2paNodeVerificationOptions extends C2paVerificationOptions {
  readonly limits?: Partial<SecurityLimits>;
}

type RecordValue = Readonly<Record<string, unknown>>;

function record(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function unavailable(format: ReturnType<typeof detectFormat>, status: Parameters<typeof unavailableResult>[0]["status"], message: string, officialResult?: unknown): C2paVerificationResult {
  return unavailableResult({ adapter: "node", package: "@contentauth/c2pa-node", format, status, sdkVersion: C2PA_NODE_SDK_VERSION, sdkProvenance: C2PA_NODE_SDK_PROVENANCE, diagnostics: [message], ...(officialResult === undefined ? {} : { officialResult }) });
}

function missingManifest(error: unknown): boolean {
  const value = record(error);
  const name = typeof value?.name === "string" ? value.name.toLowerCase() : "";
  const code = typeof value?.code === "string" ? value.code.toLowerCase() : "";
  return name.includes("nomanifest") || name.includes("manifestnotfound") || code.includes("nomanifest") || code.includes("manifest_not_found");
}

/** Verify C2PA through the official Node SDK. Native loading, trust settings,
 * and all cryptographic work remain inside that SDK. */
export async function verifyC2paInNode(input: C2paVerificationInput, options: C2paNodeVerificationOptions = {}): Promise<C2paVerificationResult> {
  const materialized = await materializeAdapterInput(input, options.limits);
  const packageName = "@contentauth/c2pa-node";
  let sdk: RecordValue;
  try {
    sdk = await import(packageName) as RecordValue;
  } catch (error) {
    const code = record(error)?.code;
    return unavailable(materialized.format, "adapter:sdk-unavailable", code === "ERR_MODULE_NOT_FOUND" ? "The optional official Node C2PA SDK is not installed." : "The official Node C2PA SDK could not be loaded.");
  }
  const Reader = sdk.Reader;
  const readerFactory = (typeof Reader === "function" || typeof Reader === "object") && Reader !== null ? (Reader as { readonly fromAsset?: unknown }).fromAsset : undefined;
  if (typeof readerFactory !== "function") return unavailable(materialized.format, "adapter:runtime-error", "The installed official Node C2PA SDK has no Reader.fromAsset entry point.");
  const asset = { buffer: Buffer.from(materialized.bytes), mimeType: materialized.format.mimeType };
  const settings = { verify: { verify_after_reading: true, verify_trust: options.verifyTrust !== false, remote_manifest_fetch: options.remoteManifestFetch === true } };
  try {
    const reader = await (readerFactory as (asset: unknown, settings: unknown) => Promise<unknown>).call(Reader, asset, settings);
    const readerRecord = record(reader);
    if (readerRecord === null) return normalizeOfficialResult({ adapter: "node", package: "@contentauth/c2pa-node", sdkVersion: C2PA_NODE_SDK_VERSION, sdkProvenance: C2PA_NODE_SDK_PROVENANCE, format: materialized.format, result: null, diagnostics: ["The official SDK reported no embedded manifest store."] });
    if (typeof readerRecord.json !== "function") return unavailable(materialized.format, "adapter:runtime-error", "The installed official Node C2PA SDK returned a reader without json.");
    let officialResult: unknown;
    try {
      officialResult = (readerRecord.json as (this: unknown) => unknown).call(readerRecord);
    } finally {
      if (typeof readerRecord.free === "function") await (readerRecord.free as (this: unknown) => Promise<void>).call(readerRecord);
    }
    return normalizeOfficialResult({ adapter: "node", package: "@contentauth/c2pa-node", sdkVersion: C2PA_NODE_SDK_VERSION, sdkProvenance: C2PA_NODE_SDK_PROVENANCE, format: materialized.format, result: officialResult, diagnostics: [] });
  } catch (error) {
    if (missingManifest(error)) return normalizeOfficialResult({ adapter: "node", package: "@contentauth/c2pa-node", sdkVersion: C2PA_NODE_SDK_VERSION, sdkProvenance: C2PA_NODE_SDK_PROVENANCE, format: materialized.format, result: null, diagnostics: ["The official SDK reported no embedded manifest store."] });
    return unavailable(materialized.format, classifyOfficialError(error), "The official Node C2PA SDK returned a typed runtime or format result.", error);
  }
}

export const C2PA_NODE_SDK = Object.freeze({ package: "@contentauth/c2pa-node" as const, version: C2PA_NODE_SDK_VERSION, license: "MIT" as const, provenance: C2PA_NODE_SDK_PROVENANCE });

export type { C2paVerificationInput, C2paVerificationOptions, C2paVerificationResult, C2paAdapterStatus } from "./c2pa-types.js";
