import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";

import { sha256Hex } from "../src/security/sha256.js";

describe("bounded transaction hashing", () => {
  it("provides the standards-known SHA-256 result through the dependency-free fallback", async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    try {
      Object.defineProperty(globalThis, "crypto", { configurable: true, value: undefined });
      expect(await sha256Hex(new Uint8Array())).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
      expect(await sha256Hex(new TextEncoder().encode("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
      expect(await sha256Hex(new Uint8Array(129).fill(0xa5))).toBe("0d4df645e098e323828009a90258def0ec1a596a54fe023e76a1bc05992eba61");
    } finally {
      if (original === undefined) delete (globalThis as { crypto?: Crypto }).crypto;
      else Object.defineProperty(globalThis, "crypto", original);
    }
  });

  it("falls back when the platform digest rejects and preserves padding boundaries", async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    try {
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: { subtle: { digest: () => Promise.reject(new Error("digest unavailable")) } },
      });
      const values = [0, 1, 55, 56, 63, 64, 65, 127].map((length) => new Uint8Array(length).fill(0x61));
      for (const value of values) {
        const expected = createHash("sha256").update(value).digest("hex");
        expect(await sha256Hex(value)).toBe(expected);
      }
    } finally {
      if (original === undefined) delete (globalThis as { crypto?: Crypto }).crypto;
      else Object.defineProperty(globalThis, "crypto", original);
    }
  });
});
