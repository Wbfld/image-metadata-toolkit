import { describe, expect, it, vi } from "vitest";

const nodeState = vi.hoisted(() => ({ mode: "valid" }));
const browserState = vi.hoisted(() => ({ mode: "valid" }));

const virtualMock = vi.mock.bind(vi) as unknown as (path: string, factory: () => unknown, options: { readonly virtual: true }) => void;

virtualMock("@contentauth/c2pa-node", () => ({
  Reader: {
    fromAsset: () => {
      if (nodeState.mode.startsWith("error:")) {
        const error = new Error(nodeState.mode.slice(6));
        error.name = nodeState.mode.slice(6);
        return Promise.reject(error);
      }
      if (nodeState.mode === "null-reader") return Promise.resolve(null);
      if (nodeState.mode === "no-json") return Promise.resolve({ free: () => Promise.resolve() });
      return Promise.resolve({
        json: () => nodeState.mode === "valid" ? { validation_state: "valid", manifests: { one: {} } } : null,
        free: () => Promise.resolve(),
      });
    },
  },
}), { virtual: true });

virtualMock("@contentauth/c2pa-web", () => ({
  createC2pa: () => {
    if (browserState.mode.startsWith("error:")) return Promise.reject(Object.assign(new Error(browserState.mode.slice(6)), { code: browserState.mode.slice(6) }));
    return Promise.resolve({
      reader: {
        fromBlob: () => {
          if (browserState.mode === "null-reader") return Promise.resolve(null);
          if (browserState.mode === "no-manifest-store") return Promise.resolve({ free: () => Promise.resolve() });
          return Promise.resolve({
            manifestStore: () => Promise.resolve(browserState.mode === "valid" ? { validation_state: "trusted", manifests: { one: {} } } : null),
            free: () => Promise.resolve(),
          });
        },
      },
    });
  },
}), { virtual: true });

import { verifyC2paInBrowser } from "../src/trust/c2pa-browser.js";
import { verifyC2paInNode } from "../src/trust/c2pa-node.js";

describe("S06 optional C2PA adapter branch contracts", () => {
  it("keeps every Node SDK boundary typed and fail-closed", async () => {
    nodeState.mode = "valid";
    expect((await verifyC2paInNode(new Uint8Array([1, 2, 3]))).status).toBe("official:valid");
    nodeState.mode = "null-reader";
    expect((await verifyC2paInNode(new Uint8Array([1, 2, 3]))).status).toBe("official:no-manifest");
    nodeState.mode = "no-json";
    expect((await verifyC2paInNode(new Uint8Array([1, 2, 3]))).status).toBe("adapter:runtime-error");
    nodeState.mode = "error:NoManifestFound";
    expect((await verifyC2paInNode(new Uint8Array([1, 2, 3]))).status).toBe("official:no-manifest");
    for (const [name, expected] of [
      ["UnsupportedFormatError", "adapter:unsupported"],
      ["ConfigurationError", "adapter:configuration"],
      ["TrustListError", "adapter:trust-list"],
      ["NetworkError", "adapter:network"],
      ["WasmError", "adapter:wasm"],
      ["NativeError", "adapter:native-runtime"],
      ["OtherError", "adapter:runtime-error"],
    ] as const) {
      nodeState.mode = `error:${name}`;
      const result = await verifyC2paInNode(new Uint8Array([1, 2, 3]));
      expect(result.status).toBe(expected);
      expect(result.officialResult).toMatchObject({ name });
      expect(result.verifiedBy).toBe("none");
    }
  });

  it("keeps every browser SDK, WASM, reader, and typed-error boundary fail-closed", async () => {
    browserState.mode = "valid";
    expect((await verifyC2paInBrowser(new Uint8Array([1, 2, 3]), { wasmSrc: "c2pa.wasm" })).status).toBe("official:trusted");
    expect((await verifyC2paInBrowser(new Uint8Array([1, 2, 3]))).status).toBe("adapter:configuration");
    browserState.mode = "null-reader";
    expect((await verifyC2paInBrowser(new Uint8Array([1, 2, 3]), { wasmSrc: "c2pa.wasm" })).status).toBe("official:no-manifest");
    browserState.mode = "no-manifest-store";
    expect((await verifyC2paInBrowser(new Uint8Array([1, 2, 3]), { wasmSrc: "c2pa.wasm" })).status).toBe("adapter:runtime-error");
    for (const [code, expected] of [
      ["UNSUPPORTED_FORMAT", "adapter:unsupported"],
      ["CONFIGURATION_ERROR", "adapter:configuration"],
      ["TRUST_LIST_ERROR", "adapter:trust-list"],
      ["NETWORK_ERROR", "adapter:network"],
      ["WASM_ERROR", "adapter:wasm"],
      ["NATIVE_ERROR", "adapter:native-runtime"],
      ["OTHER_ERROR", "adapter:runtime-error"],
    ] as const) {
      browserState.mode = `error:${code}`;
      const result = await verifyC2paInBrowser(new Uint8Array([1, 2, 3]), { wasmSrc: "c2pa.wasm" });
      expect(result.status).toBe(expected);
      expect(result.officialResult).toMatchObject({ code });
      expect(result.verifiedBy).toBe("none");
    }
  });
});
