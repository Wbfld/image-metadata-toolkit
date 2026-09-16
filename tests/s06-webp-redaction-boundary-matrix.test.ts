import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { DEFAULT_LIMITS } from "../src/security/limits.js";
import { redactWebp } from "../src/privacy/webp-surgery.js";
import type { LegacyRedactionTarget } from "../src/types.js";

function warningCodes(bytes: Uint8Array, options: Parameters<typeof redactWebp>[1], limits = DEFAULT_LIMITS): string[] {
  return redactWebp(bytes, options, limits).warnings.map(({ code }) => code);
}

describe("S06 WebP redaction boundary matrix", () => {
  it("covers valid chunk removal, preservation, scopes, duplicate requests, and unsupported targets", async () => {
    const input = new Uint8Array(await readFile(new URL("./fixtures/webp-metadata.webp", import.meta.url)));
    const removed = redactWebp(input, { remove: ["EXIF", "XMP", "ICC"] }, DEFAULT_LIMITS);
    expect(removed.warnings).toEqual([]);
    expect(removed.removed).toEqual([
      { target: "EXIF", occurrences: 1 },
      { target: "XMP", occurrences: 1 },
      { target: "ICC", occurrences: 1 },
    ]);
    expect(removed.data.length).toBeLessThan(input.length);
    expect(input.slice(0, 4)).toEqual(removed.data.slice(0, 4));
    expect(input.slice(8, 12)).toEqual(removed.data.slice(8, 12));

    const preserved = redactWebp(input, { remove: ["AllMetadata"], preserve: ["ICC"] }, DEFAULT_LIMITS);
    expect(preserved.removed).toEqual([
      { target: "EXIF", occurrences: 1 },
      { target: "XMP", occurrences: 1 },
    ]);
    expect(preserved.warnings).toEqual([]);

    const scoped = redactWebp(input, {
      remove: ["EXIF"],
      scopes: [{ target: "EXIF", blockIds: ["webp:EXIF:64"] }],
    }, DEFAULT_LIMITS);
    expect(scoped.removed).toEqual([{ target: "EXIF", occurrences: 1 }]);
    const outOfScope = redactWebp(input, {
      remove: ["EXIF"],
      scopes: [{ target: "EXIF", blockIds: ["webp:EXIF:999999"] }],
    }, DEFAULT_LIMITS);
    expect(outOfScope.removed).toEqual([]);
    expect(outOfScope.data).toEqual(input);

    expect(redactWebp(input, { remove: [] }, DEFAULT_LIMITS).data).toEqual(input);
    expect(redactWebp(input, { remove: ["EXIF"], preserve: ["AllMetadata"] }, DEFAULT_LIMITS).data).toEqual(input);
    const child = redactWebp(input, { remove: ["EXIF", "GPS", "NoSuchTarget" as LegacyRedactionTarget] }, DEFAULT_LIMITS);
    expect(child.warnings.map(({ code }) => code)).toEqual(["REDACTION_SKIPPED", "REDACTION_SKIPPED"]);
    expect(child.removed).toEqual([{ target: "EXIF", occurrences: 1 }]);
  });

  it("rejects malformed RIFF and every bounded chunk/metadata limit without modifying source bytes", async () => {
    const input = new Uint8Array(await readFile(new URL("./fixtures/webp-metadata.webp", import.meta.url)));
    const cases = [
      input.subarray(0, 11),
      Uint8Array.from(input, (value, index) => index === 4 ? value ^ 0xff : value),
      input.subarray(0, input.length - 1),
    ];
    for (const candidate of cases) {
      const before = candidate.slice();
      const result = redactWebp(candidate, { remove: ["EXIF"] }, DEFAULT_LIMITS);
      expect(result.data).toEqual(before);
      expect(result.removed).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
    }
    expect(warningCodes(input, { remove: ["AllMetadata"] }, { ...DEFAULT_LIMITS, maxSegments: 1 })).toContain("LIMIT_EXCEEDED");
    expect(warningCodes(input, { remove: ["AllMetadata"] }, { ...DEFAULT_LIMITS, maxSegmentBytes: 1 })).toContain("LIMIT_EXCEEDED");
    expect(warningCodes(input, { remove: ["AllMetadata"] }, { ...DEFAULT_LIMITS, maxMetadataBytes: 1 })).toContain("LIMIT_EXCEEDED");
  });
});
