import { describe, expect, it } from "vitest";

import { classifyOfficialError, normalizeOfficialResult, unavailableResult } from "../src/trust/c2pa-adapter.js";
import { verifyC2paInBrowser } from "../src/trust/c2pa-browser.js";
import { verifyC2paInNode } from "../src/trust/c2pa-node.js";
import { detectFormat } from "../src/detect-format.js";

const format = detectFormat(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]));
const sdk = { adapter: "node" as const, package: "@contentauth/c2pa-node" as const, sdkVersion: "0.9.5", sdkProvenance: "https://github.com/contentauth/c2pa-js/releases/tag/@contentauth%2Fc2pa-node%400.9.5", format };

describe("T04 official adapter normalization", () => {
  it("namespaces official states and retains the exact official result object", () => {
    const official = { validation_state: "invalid", manifests: { one: { title: "fixture" } }, validation_status: [{ success: false }] };
    const normalized = normalizeOfficialResult({ ...sdk, result: official, diagnostics: [] });
    expect(normalized.status).toBe("official:invalid");
    expect(normalized.verifiedBy).toBe("official-sdk");
    expect(normalized.detected).toBe(true);
    expect(normalized.officialResult).toBe(official);
    expect(normalized.officialStatus).toBe("invalid");
    expect(normalized.sdk.version).toBe("0.9.5");
  });

  it("represents no embedded store without converting it into a success claim", () => {
    const normalized = normalizeOfficialResult({ ...sdk, result: null, diagnostics: ["no embedded store"] });
    expect(normalized).toMatchObject({ status: "official:no-manifest", detected: false, verifiedBy: "official-sdk", officialResult: null, officialStatus: null });
  });

  it("does not reinterpret an unknown official result shape as valid", () => {
    const unknown = { manifests: { one: { title: "fixture" } }, unexpected_status: "maybe" };
    const normalized = normalizeOfficialResult({ ...sdk, result: unknown, diagnostics: ["unrecognized official result shape"] });
    expect(normalized.status).toBe("adapter:runtime-error");
    expect(normalized.detected).toBe(false);
    expect(normalized.verifiedBy).toBe("none");
    expect(normalized.officialResult).toBe(unknown);
  });

  it("keeps unavailable adapter conditions typed and fail-closed", () => {
    const statuses = ["adapter:unsupported", "adapter:sdk-unavailable", "adapter:configuration", "adapter:trust-list", "adapter:network", "adapter:wasm", "adapter:native-runtime", "adapter:runtime-error"] as const;
    for (const status of statuses) {
      const result = unavailableResult({ ...sdk, status, diagnostics: [status] });
      expect(result.status).toBe(status);
      expect(result.detected).toBe(false);
      expect(result.verifiedBy).toBe("none");
      expect(result.officialResult).toBeNull();
    }
  });

  it("classifies only typed SDK error identity fields", () => {
    expect(classifyOfficialError({ name: "UnsupportedFormatError" })).toBe("adapter:unsupported");
    expect(classifyOfficialError({ code: "CONFIGURATION_ERROR" })).toBe("adapter:configuration");
    expect(classifyOfficialError({ name: "TrustListError" })).toBe("adapter:trust-list");
    expect(classifyOfficialError({ code: "NETWORK_ERROR" })).toBe("adapter:network");
    expect(classifyOfficialError({ name: "WasmInitializationError" })).toBe("adapter:wasm");
    expect(classifyOfficialError({ code: "ERR_DLOPEN_FAILED" })).toBe("adapter:native-runtime");
    expect(classifyOfficialError({ message: "unsupported network wasm trust" })).toBe("adapter:runtime-error");
  });

  it("keeps optional adapter failures typed when an unsupported asset reaches the boundary", async () => {
    const input = Uint8Array.from([1, 2, 3]);
    const node = await verifyC2paInNode(input, { remoteManifestFetch: false });
    expect(node.status).toMatch(/^adapter:(?:unsupported|sdk-unavailable|runtime-error|native-runtime)$/u);
    expect(node.verifiedBy).toBe("none");
    expect(node.officialResult).not.toBeUndefined();

    const browser = await verifyC2paInBrowser(input, { remoteManifestFetch: false });
    expect(browser.status).toMatch(/^adapter:(?:unsupported|sdk-unavailable|configuration|runtime-error|wasm)$/u);
    expect(browser.verifiedBy).toBe("none");
    expect(browser.officialResult).not.toBeUndefined();
  });
});
