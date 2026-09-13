import type { ImageFormat, MetadataInput } from "../types.js";

export type C2paAdapterStatus =
  | "official:valid"
  | "official:invalid"
  | "official:trusted"
  | "official:no-manifest"
  | "adapter:unsupported"
  | "adapter:sdk-unavailable"
  | "adapter:configuration"
  | "adapter:trust-list"
  | "adapter:network"
  | "adapter:wasm"
  | "adapter:native-runtime"
  | "adapter:runtime-error";

export interface C2paVerificationOptions {
  readonly verifyTrust?: boolean;
  readonly remoteManifestFetch?: boolean;
}

export interface C2paVerificationResult {
  readonly adapter: "browser" | "node";
  readonly status: C2paAdapterStatus;
  readonly format: ImageFormat;
  readonly detected: boolean;
  readonly verifiedBy: "official-sdk" | "none";
  /** Complete SDK manifest store or official error/result object. */
  readonly officialResult: unknown;
  readonly officialStatus: unknown;
  readonly sdk: {
    readonly package: "@contentauth/c2pa-web" | "@contentauth/c2pa-node";
    readonly version: string;
    readonly license: "MIT";
    readonly provenance: string;
  };
  readonly diagnostics: readonly string[];
}

export type C2paVerificationInput = MetadataInput;
