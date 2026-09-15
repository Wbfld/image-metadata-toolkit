import { describe, expect, it } from "vitest";

import { safeTarget, validateSourceUrl } from "../scripts/prepare-r05-corpora.mjs";

describe("R05 temporary corpus preparation", () => {
  it("allows only pinned HTTPS fixture hosts", () => {
    expect(validateSourceUrl("https://raw.pixls.us/data/example.bin").hostname).toBe("raw.pixls.us");
    expect(validateSourceUrl("https://www.w3.org/Graphics/SVG/example.tar.gz").hostname).toBe("www.w3.org");
    expect(() => validateSourceUrl("http://raw.pixls.us/data/example.bin")).toThrow(/HTTPS/iu);
    expect(() => validateSourceUrl("https://example.test/data/example.bin")).toThrow(/allowlisted/iu);
  });

  it("rejects temporary fixture paths that escape their root", () => {
    expect(safeTarget("/private/tmp/r05-corpora", "raw/file.bin")).toBe("/private/tmp/r05-corpora/raw/file.bin");
    expect(() => safeTarget("/private/tmp/r05-corpora", "../outside.bin")).toThrow(/escaped/iu);
    expect(() => safeTarget("/private/tmp/r05-corpora", "/outside.bin")).toThrow(/repository-relative/iu);
    expect(() => safeTarget("/private/tmp/r05-corpora", "raw\\file.bin")).toThrow(/repository-relative/iu);
  });
});
