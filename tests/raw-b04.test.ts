import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { auditPrivacy, classifyRawTiff, detectFormat, editMetadata, getImageDetails, parseMetadata, rewriteTiff, toJsonSafeResult, TiffSerializationError } from "../src/index.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

type Variant = "dng" | "cr2" | "nef" | "arw" | "orf" | "rw2" | "iiq";

interface EntryInput {
  readonly tag: number;
  readonly type: 1 | 2 | 3 | 4;
  readonly value: number | string | readonly number[];
}

interface BuiltTiff {
  readonly bytes: Uint8Array;
  readonly stripOffsetEntry: number;
}

function writeNumber(view: DataView, offset: number, value: number, type: EntryInput["type"]): void {
  if (type === 3) view.setUint16(offset, value, true);
  else view.setUint32(offset, value, true);
}

function encodeEntryValue(entry: EntryInput): Uint8Array {
  if (entry.type === 2) {
    const bytes = new TextEncoder().encode(`${entry.value as string}\0`);
    return bytes;
  }
  const values = Array.isArray(entry.value) ? entry.value : [entry.value];
  const bytes = new Uint8Array(values.length * (entry.type === 1 ? 1 : entry.type === 3 ? 2 : 4));
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => {
    const number = typeof value === "number" ? value : Number(value);
    if (entry.type === 1) bytes[index] = number;
    else writeNumber(view, index * (entry.type === 3 ? 2 : 4), number, entry.type);
  });
  return bytes;
}

function makeClassicVariant(kind: Variant, outOfBounds = false): BuiltTiff {
  const firstIfd = kind === "cr2" || kind === "iiq" ? 16 : 8;
  const entries: EntryInput[] = [
    { tag: 256, type: 4, value: 64 },
    { tag: 257, type: 4, value: 48 },
    { tag: 259, type: 3, value: 1 },
    { tag: 262, type: 3, value: kind === "dng" || kind === "nef" || kind === "arw" ? 32803 : 1 },
    { tag: 271, type: 2, value: kind === "nef" ? "Nikon" : kind === "arw" ? "Sony" : "Test camera" },
    { tag: 273, type: 4, value: outOfBounds ? [4096, 4096] : [512, 528] },
    { tag: 279, type: 4, value: outOfBounds ? [64, 64] : [16, 16] },
  ];
  if (kind === "dng") entries.push({ tag: 50706, type: 1, value: [1, 4, 0, 0] });
  if (kind === "rw2") entries.push({ tag: 280, type: 4, value: 512 });
  entries.sort((left, right) => left.tag - right.tag);
  const tableLength = 2 + entries.length * 12 + 4;
  const output = new Uint8Array(512 + 64);
  output.set([0x49, 0x49, 0x2a, 0x00], 0);
  new DataView(output.buffer).setUint32(4, firstIfd, true);
  if (kind === "orf") output.set([0x49, 0x49, 0x52, 0x4f], 0);
  if (kind === "rw2") output.set([0x49, 0x49, 0x55, 0x00], 0);
  if (kind === "cr2") output.set([0x43, 0x52, 0x02, 0x00], 8);
  if (kind === "iiq") output.set([0x49, 0x49, 0x49, 0x49, 0x43, 0x77, 0x61, 0x52], 8);
  const view = new DataView(output.buffer);
  view.setUint16(firstIfd, entries.length, true);
  let dataOffset = firstIfd + tableLength;
  let stripOffsetEntry = -1;
  for (const [index, entry] of entries.entries()) {
    const entryOffset = firstIfd + 2 + index * 12;
    view.setUint16(entryOffset, entry.tag, true);
    view.setUint16(entryOffset + 2, entry.type, true);
    const values = Array.isArray(entry.value) ? entry.value : [entry.value];
    const count = entry.type === 2 ? encodeEntryValue(entry).length : values.length;
    view.setUint32(entryOffset + 4, count, true);
    const encoded = encodeEntryValue(entry);
    if (entry.tag === 273) stripOffsetEntry = entryOffset;
    if (encoded.length <= 4) output.set(encoded, entryOffset + 8);
    else {
      view.setUint32(entryOffset + 8, dataOffset, true);
      output.set(encoded, dataOffset);
      dataOffset += encoded.length;
    }
  }
  view.setUint32(firstIfd + 2 + entries.length * 12, 0, true);
  output.fill(0x5a, 512, 528);
  return { bytes: output, stripOffsetEntry };
}

describe("B04 TIFF-derived RAW phase one", () => {
  it("recognizes every B04 RAW file kind through a structural signature or directory marker", async () => {
    const expected: readonly Variant[] = ["dng", "cr2", "nef", "arw", "orf", "rw2", "iiq"];
    for (const kind of expected) {
      const { bytes } = makeClassicVariant(kind);
      const result = await parseMetadata(bytes, { scope: "metadata" });
      expect(detectFormat(bytes).format, kind).toBe("tiff");
      expect(result).toMatchObject({ format: "tiff", container: "tiff", fileKind: kind });
      expect(classifyRawTiff(bytes, result.exif), kind).toBe(kind);
      expect(result.raw, kind).not.toBeNull();
    }
  });

  it("keeps generic TIFF distinct and inventories raw ranges without retaining payload bytes", async () => {
    const generic = await parseMetadata(makeClassicVariant("dng").bytes);
    const ordinaryBytes = makeClassicVariant("orf").bytes.slice();
    ordinaryBytes.set([0x2a, 0x00], 2);
    const ordinary = await parseMetadata(ordinaryBytes);
    expect(generic.fileKind).toBe("dng");
    expect(ordinary.fileKind).toBe("tiff");
    expect(ordinary.raw).toBeNull();
    const payload = generic.raw?.rawPayloads[0];
    expect(payload).toMatchObject({ role: "raw", format: "raw", offset: 512, length: 16, status: "valid" });
    expect((generic.raw as unknown as Record<string, unknown>).bytes).toBeUndefined();
    expect(toJsonSafeResult(generic)).toMatchObject({ container: "tiff", fileKind: "dng", raw: { kind: "dng" } });
  });

  it("retains RAW identity and payload provenance for Blob metadata scope", async () => {
    const { bytes } = makeClassicVariant("rw2");
    const result = await parseMetadata(new Blob([bytes.buffer as ArrayBuffer]), { scope: "metadata", select: { groups: ["Dimensions"] } });
    expect(result.fileKind).toBe("rw2");
    expect(result.raw?.rawPayloads.some(({ offset, length }) => offset !== null && length !== null)).toBe(true);
    expect(result.telemetry?.bytesRead).toBeLessThan(bytes.byteLength);
    expect(result.details?.formatSpecific.raw).toBeDefined();
  });

  it("keeps malformed and out-of-bounds RAW payload references fail-closed", async () => {
    const malformed = await parseMetadata(makeClassicVariant("dng", true).bytes);
    expect(malformed.raw?.complete).toBe(false);
    expect(malformed.raw?.diagnostics.map(({ code }) => code)).toContain("UNSAFE_RANGE");
    const limited = await parseMetadata(makeClassicVariant("dng").bytes, { limits: { maxSegments: 1 } });
    expect(limited.raw?.complete).toBe(false);
    expect(limited.raw?.diagnostics.map(({ code }) => code)).toContain("LIMIT_EXCEEDED");
    expect(limited.raw?.rawPayloads).toHaveLength(1);
  });

  it("refuses RAW mutation before allocating output and preserves direct TIFF-writer refusal", async () => {
    const { bytes } = makeClassicVariant("dng");
    const result = await editMetadata(bytes, { operations: [{ op: "set", operationId: "raw-edit", target: { kind: "field", fieldId: "normalized:Make" }, value: "Refused" }] });
    expect(result).toMatchObject({ successful: false, status: "unsupported", data: null, output: null });
    expect(result.diagnostics.some(({ detail }) => detail.includes("RAW DNG writing is intentionally unsupported"))).toBe(true);
    expect(() => rewriteTiff(bytes, { edits: [] })).toThrow(TiffSerializationError);
    expect(() => rewriteTiff(bytes, { edits: [] })).toThrow(/RAW DNG writing is intentionally unsupported/u);
  });

  it("bounds cancellation and exposes RAW inventory through image details", async () => {
    const { bytes } = makeClassicVariant("orf");
    const controller = new AbortController();
    controller.abort();
    await expect(parseMetadata(bytes, { signal: controller.signal })).rejects.toMatchObject({ code: "ABORTED" });
    const result = await parseMetadata(bytes);
    expect(getImageDetails(result).formatSpecific).toMatchObject({ raw: { kind: "orf", complete: true } });
    expect(DEFAULT_LIMITS.maxInputBytes).toBeGreaterThan(bytes.byteLength);
  });

  it("keeps RAW payloads and embedded-image ranges fail-closed in privacy inspection", async () => {
    const { bytes } = makeClassicVariant("dng");
    const audit = await auditPrivacy(bytes);
    expect(audit.safe).toBe(false);
    expect(audit.findings.some(({ category, state }) => category === "opaque-block" && state === "opaque-risk")).toBe(true);
    expect(audit.findings.some(({ target }) => target.includes("RAW:dng:raw"))).toBe(true);
    expect(audit.coverage.wholeFile).toBe("opaque");
    expect(JSON.stringify(audit)).not.toContain("ZZZZ");
  });

  it("participates in the public runtime type model with all seven structural variants", async () => {
    for (const kind of ["dng", "cr2", "nef", "arw", "orf", "rw2", "iiq"] as const) {
      const result = await parseMetadata(makeClassicVariant(kind).bytes);
      expect(result.container).toBe("tiff");
      expect(result.fileKind).toBe(kind);
      expect(result.raw?.kind).toBe(kind);
    }
  });

  it("retains the existing real generic TIFF fixture as ordinary TIFF", async () => {
    const fixture = new Uint8Array(await readFile(new URL("./fixtures/tiff-exif-little-endian.tif", import.meta.url)));
    const result = await parseMetadata(fixture);
    expect(result).toMatchObject({ format: "tiff", container: "tiff", fileKind: "tiff", raw: null });
  });
});
