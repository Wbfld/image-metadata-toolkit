import { detectFormat } from "../detect-format.js";
import { materializeInput } from "../input.js";
import { resolveLimits } from "../security/limits.js";
import type { MetadataInput, SecurityLimits } from "../types.js";
import type { C2paAdapterStatus, C2paVerificationResult } from "./c2pa-types.js";

export const C2PA_WEB_SDK_VERSION = "0.14.6";
export const C2PA_NODE_SDK_VERSION = "0.9.5";
export const C2PA_WEB_SDK_PROVENANCE = "https://github.com/contentauth/c2pa-js/releases/tag/@contentauth%2Fc2pa-web%400.14.6";
export const C2PA_NODE_SDK_PROVENANCE = "https://github.com/contentauth/c2pa-js/releases/tag/@contentauth%2Fc2pa-node%400.9.5";

export interface AdapterContext {
  readonly adapter: "browser" | "node";
  readonly package: "@contentauth/c2pa-web" | "@contentauth/c2pa-node";
  readonly input: MetadataInput;
  readonly limits?: Partial<SecurityLimits>;
  readonly sdkVersion: string;
  readonly sdkProvenance: string;
}

export async function materializeAdapterInput(input: MetadataInput, limitsInput?: Partial<SecurityLimits>): Promise<{ readonly bytes: Uint8Array; readonly format: ReturnType<typeof detectFormat> }> {
  const limits = resolveLimits(limitsInput);
  const bytes = await materializeInput(input, limits);
  return { bytes, format: detectFormat(bytes) };
}

function objectRecord(value: unknown): Readonly<Record<string, unknown>> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : null;
}

function officialState(store: unknown): { readonly status: C2paAdapterStatus; readonly state: unknown } {
  const record = objectRecord(store);
  if (record === null) return { status: "official:no-manifest", state: null };
  const state = record.validation_state ?? record.validationState ?? null;
  if (typeof state === "string") {
    const normalized = state.toLowerCase();
    if (normalized === "trusted") return { status: "official:trusted", state };
    if (normalized === "valid") return { status: "official:valid", state };
    if (normalized === "invalid") return { status: "official:invalid", state };
  }
  const statuses = record.validation_status ?? record.validationStatus;
  if (Array.isArray(statuses)) {
    if (statuses.length === 0) return { status: "official:no-manifest", state };
    const entries = statuses.map(objectRecord);
    if (entries.some((item) => item === null || typeof item.success !== "boolean")) return { status: "adapter:runtime-error", state };
    return { status: entries.some((item) => item?.success === false) ? "official:invalid" : "official:valid", state };
  }
  const manifests = objectRecord(record.manifests);
  if (manifests === null) return { status: "adapter:runtime-error", state };
  return { status: Object.keys(manifests).length > 0 ? "adapter:runtime-error" : "official:no-manifest", state };
}

export function normalizeOfficialResult(context: Pick<AdapterContext, "adapter" | "package" | "sdkVersion" | "sdkProvenance"> & { readonly format: ReturnType<typeof detectFormat>; readonly result: unknown; readonly diagnostics?: readonly string[] }): C2paVerificationResult {
  const state = officialState(context.result);
  const official = state.status.startsWith("official:");
  return {
    adapter: context.adapter,
    status: state.status,
    format: context.format.format,
    detected: official && state.status !== "official:no-manifest",
    verifiedBy: official ? "official-sdk" : "none",
    officialResult: context.result,
    officialStatus: state.state,
    sdk: { package: context.package, version: context.sdkVersion, license: "MIT", provenance: context.sdkProvenance },
    diagnostics: context.diagnostics ?? [],
  };
}

export function unavailableResult(context: Pick<AdapterContext, "adapter" | "package" | "sdkVersion" | "sdkProvenance"> & { readonly format: ReturnType<typeof detectFormat>; readonly status: Exclude<C2paAdapterStatus, "official:valid" | "official:invalid" | "official:trusted" | "official:no-manifest">; readonly diagnostics: readonly string[]; readonly officialResult?: unknown }): C2paVerificationResult {
  return {
    adapter: context.adapter,
    status: context.status,
    format: context.format.format,
    detected: false,
    verifiedBy: "none",
    officialResult: context.officialResult ?? null,
    officialStatus: null,
    sdk: { package: context.package, version: context.sdkVersion, license: "MIT", provenance: context.sdkProvenance },
    diagnostics: context.diagnostics,
  };
}

export function classifyOfficialError(error: unknown): Exclude<C2paAdapterStatus, "official:valid" | "official:invalid" | "official:trusted" | "official:no-manifest" | "adapter:sdk-unavailable"> {
  const record = objectRecord(error);
  const name = typeof record?.name === "string" ? record.name.toLowerCase() : "";
  const code = typeof record?.code === "string" ? record.code.toLowerCase() : "";
  if (name.includes("unsupported") || code.includes("unsupported")) return "adapter:unsupported";
  if (name.includes("config") || code.includes("config")) return "adapter:configuration";
  if (name.includes("trust") || code.includes("trust")) return "adapter:trust-list";
  if (name.includes("network") || code.includes("network") || name.includes("fetch") || code.includes("fetch") || name.includes("http") || code.includes("http")) return "adapter:network";
  if (name.includes("wasm") || code.includes("wasm") || name.includes("webassembly") || code.includes("webassembly")) return "adapter:wasm";
  if (name.includes("native") || code.includes("native") || code.includes("dlopen") || code.includes("binding")) return "adapter:native-runtime";
  return "adapter:runtime-error";
}
