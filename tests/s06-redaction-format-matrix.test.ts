import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { redactMetadata } from "../src/index.js";
import type { RedactionTarget } from "../src/types.js";

function minimalJpegWithC2pa(): Uint8Array {
  const payload = new TextEncoder().encode("C2PA urn:c2pa:manifest https://example.invalid/remote");
  const length = payload.length + 2;
  const app11 = Uint8Array.from([0xff, 0xeb, length >>> 8, length & 0xff, ...payload]);
  const sof = Uint8Array.from([0xff, 0xc0, 0, 11, 8, 0, 1, 0, 1, 1, 1, 0x11, 0]);
  const sos = Uint8Array.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0]);
  return Uint8Array.from([0xff, 0xd8, ...app11, ...sof, ...sos, 0, 0, 0xff, 0xd9]);
}

const cases = [
  ["jpeg-exif-little-endian.jpg", ["AllMetadata", "EXIF", "XMP", "IPTC", "ICC", "JFIF", "GPS", "Orientation"]],
  ["png-metadata.png", ["AllMetadata", "EXIF", "XMP", "IPTC", "ICC", "PNGText", "GPS", "Orientation"]],
  ["webp-metadata.webp", ["AllMetadata", "EXIF", "XMP", "ICC", "GPS", "Orientation"]],
] as const;

describe("S06 redaction format and preflight matrix", () => {
  it("routes every supported legacy target through each lossless container without throwing", async () => {
    for (const [name, targets] of cases) {
      const input = new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));
      const before = input.slice();
      for (const target of targets) {
        const result = await redactMetadata(input, { remove: [target] });
        expect(result.format).toMatch(/^(jpeg|png|webp)$/u);
        expect(result.warnings).toBeInstanceOf(Array);
        expect(result.operations).toBeInstanceOf(Array);
        expect(typeof result.outcome.successful).toBe("boolean");
        expect(typeof result.outcome.complete).toBe("boolean");
        expect(result.outcome.unapplied).toBeInstanceOf(Array);
        expect(input).toEqual(before);
        expect(result.data).toBeInstanceOf(Uint8Array);
      }
    }
  }, 120000);

  it("covers explicit preserve, scoped, duplicate, unknown, unsupported-format, and C2PA refusal paths", async () => {
    const jpeg = new Uint8Array(await readFile(new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url)));
    const variants: readonly { readonly remove: readonly RedactionTarget[]; readonly preserve?: readonly RedactionTarget[] }[] = [
      { remove: ["AllMetadata"], preserve: ["ICC", "Orientation"] },
      { remove: ["EXIF"], preserve: ["GPSLatitude"] },
      { remove: ["EXIF", "EXIF"], preserve: ["AllMetadata"] },
      { remove: ["unknown-target" as RedactionTarget] },
      { remove: [{ kind: "selector", selector: { kind: "family", family: "EXIF" } }] },
      { remove: [{ kind: "selector", selector: { kind: "sensitivity", sensitivity: "low" } }] },
      { remove: [{ kind: "selector", selector: { kind: "associated-image", imageId: "missing" } }] },
      { remove: [{ kind: "selector", selector: { kind: "block", blockId: "missing" } }] },
      { remove: [{ kind: "selector", selector: { kind: "field-id", fieldId: "missing" } }] },
    ];
    for (const options of variants) {
      const result = await redactMetadata(jpeg, options);
      expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect((result.operations ?? []).every(({ operationId }) => operationId.length > 0)).toBe(true);
    }

    const unknown = await redactMetadata(Uint8Array.of(1, 2, 3), { remove: ["AllMetadata", "unknown-target" as RedactionTarget] });
    expect(unknown.data).toEqual(Uint8Array.of(1, 2, 3));
    expect(unknown.warnings.some(({ code }) => code === "UNSUPPORTED_FORMAT" || code === "REDACTION_SKIPPED")).toBe(true);
    const c2paInput = minimalJpegWithC2pa();
    const c2pa = await redactMetadata(c2paInput, { remove: ["EXIF"], c2pa: "refuse" });
    expect(c2pa.data).toEqual(c2paInput);
    expect(c2pa.warnings).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_STRUCTURE" }));
  }, 120000);
});
