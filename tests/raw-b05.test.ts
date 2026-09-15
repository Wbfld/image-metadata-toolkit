import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { auditPrivacy, detectFormat, getImageDetails, parseMetadata, toJsonSafeResult } from "../src/index.js";
import { parseMetadata as parseNodeMetadata } from "../src/node.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const text = (value: string): Uint8Array => new TextEncoder().encode(value);
const blob = (bytes: Uint8Array): Blob => {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy]);
};

function u32(value: number, littleEndian = false): Uint8Array {
  const output = new Uint8Array(4);
  new DataView(output.buffer).setUint32(0, value, littleEndian);
  return output;
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function box(type: string, ...parts: readonly Uint8Array[]): Uint8Array {
  const payload = concat(...parts);
  return concat(u32(8 + payload.length), text(type), payload);
}

function uuidBox(uuid: string, payload: Uint8Array): Uint8Array {
  const identifier = Uint8Array.from(uuid.match(/../gu)?.map((value) => Number.parseInt(value, 16)) ?? []);
  return box("uuid", identifier, payload);
}

function validJpeg(width = 4, height = 3): Uint8Array {
  const sof = Uint8Array.from([0xff, 0xc0, 0, 11, 8, height >> 8, height & 0xff, width >> 8, width & 0xff, 1, 1, 0x11, 0]);
  const sos = Uint8Array.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0]);
  return concat(Uint8Array.of(0xff, 0xd8), sof, sos, Uint8Array.of(1, 2, 3, 0xff, 0xd9));
}

function rawTiff(width = 16, height = 12): Uint8Array {
  const output = new Uint8Array(64);
  output.set([0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0], 0);
  const view = new DataView(output.buffer);
  view.setUint16(8, 2, true);
  view.setUint16(10, 256, true); view.setUint16(12, 4, true); view.setUint32(14, 1, true); view.setUint32(18, width, true);
  view.setUint16(22, 257, true); view.setUint16(24, 4, true); view.setUint32(26, 1, true); view.setUint32(30, height, true);
  view.setUint32(34, 0, true);
  return output;
}

function rafFixture(overrides: { readonly preview?: Uint8Array; readonly previewOffset?: number; readonly previewLength?: number; readonly metadataOffset?: number; readonly metadataLength?: number; readonly rawOffset?: number } = {}): Uint8Array {
  const preview = overrides.preview ?? validJpeg();
  const metadata = text("FUJI-PROPRIETARY-METADATA");
  const raw = rawTiff();
  const previewOffset = overrides.previewOffset ?? 148;
  const previewLength = overrides.previewLength ?? preview.length;
  const metadataOffset = overrides.metadataOffset ?? previewOffset + preview.length + 4;
  const metadataLength = overrides.metadataLength ?? metadata.length;
  const rawOffset = overrides.rawOffset ?? metadataOffset + metadata.length + 4;
  const output = new Uint8Array(Math.max(512, rawOffset + raw.length));
  output.set(text("FUJIFILMCCD-RAW "), 0);
  output.set(text("0201"), 16);
  output.set(text("X-T3"), 24);
  output.set(text("0101"), 60);
  const view = new DataView(output.buffer);
  view.setUint32(84, previewOffset, false);
  view.setUint32(88, previewLength, false);
  view.setUint32(92, metadataOffset, false);
  view.setUint32(96, metadataLength, false);
  view.setUint32(100, rawOffset, false);
  view.setUint32(104, raw.length, false);
  output.set(preview, previewOffset);
  output.set(metadata, metadataOffset);
  output.set(raw, rawOffset);
  return output;
}

function extendedBox(type: string, ...parts: readonly Uint8Array[]): Uint8Array {
  const payload = concat(...parts);
  return concat(u32(1), text(type), u32(0), u32(16 + payload.length), payload);
}

function cr3Fixture(preview = validJpeg(8, 6)): Uint8Array {
  const xmp = text("<?xpacket begin=\"\"?><x:xmpmeta xmlns:x=\"adobe:ns:meta/\"><rdf:RDF/></x:xmpmeta>\0");
  const ftyp = box("ftyp", text("crx "), u32(1), text("crx "), text("isom"));
  const moov = box("moov", box("free", Uint8Array.of(0)));
  const canon = uuidBox("85c0b687820f11e08111f4ce462b6a48", text("CMT1\0opaque Canon data"));
  const xmpBox = uuidBox("be7acfcb97a942e89c71999491e3afac", xmp);
  const previewBox = uuidBox("eaf42b5e1c984b88b9fbb7dc406e4d16", concat(u32(1), text("PRVW"), preview));
  return concat(ftyp, moov, canon, xmpBox, previewBox, extendedBox("free"), box("mdat", Uint8Array.of(0, 1, 2)));
}

describe("B05 CR3 and RAF phase-two RAW conformance", () => {
  it("detects and inventories CR3 without decoding RAW payloads", async () => {
    const bytes = cr3Fixture();
    expect(detectFormat(bytes)).toEqual({ format: "cr3", mimeType: "image/x-canon-cr3" });
    const result = await parseMetadata(bytes);
    expect(result).toMatchObject({ format: "cr3", container: "iso-bmff", fileKind: "cr3", cr3: { kind: "cr3", signature: "crx" } });
    expect(result.cr3?.boxes.some(({ uuid }) => uuid === "85c0b687820f11e08111f4ce462b6a48")).toBe(true);
    expect(result.cr3?.opaqueStructures.length).toBe(1);
    expect(result.cr3?.previewRanges.some(({ format, status }) => format === "jpeg" && status === "valid")).toBe(true);
    expect(result.cr3?.rawRanges).toBeDefined();
    expect(result.cr3?.boxes.some(({ type, length }) => type === "free" && length === 16)).toBe(true);
    expect(result.warnings.some(({ code }) => code === "MALFORMED_CR3")).toBe(false);
  });

  it("detects RAF through its fixed identity and preserves exact preview, metadata, and CFA ranges", async () => {
    const bytes = rafFixture();
    expect(detectFormat(bytes)).toEqual({ format: "raf", mimeType: "image/x-fuji-raf" });
    const result = await parseMetadata(bytes);
    expect(result).toMatchObject({ format: "raf", container: "raf", fileKind: "raf", raf: { kind: "raf", signature: "FUJIFILMCCD-RAW " } });
    expect(result.dimensions).toEqual({ width: 4, height: 3 });
    expect(result.raf?.directory).toMatchObject({ offset: 80, byteLength: 28, complete: true });
    expect(result.raf?.previewRanges[0]).toMatchObject({ offset: 148, format: "jpeg", status: "valid" });
    expect(result.raf?.metadataRanges[0]).toMatchObject({ role: "metadata", status: "valid" });
    expect(result.raf?.rawRanges[0]).toMatchObject({ role: "cfa", format: "tiff", status: "valid" });
    expect(result.raf?.opaqueStructures).toHaveLength(1);
    expect(result.exif?.fields.some(({ name }) => name === "ImageWidth")).toBe(true);

    const iptcJpeg = new Uint8Array(await readFile(new URL("./fixtures/jpeg-iptc.jpg", import.meta.url)));
    const withIptc = await parseMetadata(rafFixture({ preview: iptcJpeg }));
    expect(withIptc.iptc?.fields?.some(({ source }) => source?.blockId.startsWith("raf:preview:"))).toBe(true);
    const withCr3Iptc = await parseMetadata(cr3Fixture(iptcJpeg));
    expect(withCr3Iptc.iptc?.fields?.some(({ source }) => source?.blockId.startsWith("cr3:preview:"))).toBe(true);
  });

  it("keeps malformed offsets, overlaps, truncation, limits, cancellation, and Blob scope fail-closed", async () => {
    const malformed = rafFixture({ previewOffset: 5000, previewLength: 100 });
    const result = await parseMetadata(malformed);
    expect(result.format).toBe("raf");
    expect(result.completeness.complete).toBe(false);
    expect(result.raf?.diagnostics.some(({ code }) => code === "UNSAFE_RANGE")).toBe(true);
    const overlapping = await parseMetadata(rafFixture({ metadataOffset: 150 }));
    expect(overlapping.completeness.complete).toBe(false);
    expect(overlapping.raf?.diagnostics.some(({ code }) => code === "OVERLAPPING_RANGE")).toBe(true);
    const duplicate = await parseMetadata(rafFixture({ metadataOffset: 148, metadataLength: validJpeg().length }));
    expect(duplicate.completeness.complete).toBe(false);
    expect(duplicate.raf?.diagnostics.some(({ code }) => code === "DUPLICATE_RANGE")).toBe(true);
    const malformedCr3 = cr3Fixture();
    malformedCr3[24] = 0;
    malformedCr3[25] = 0;
    malformedCr3[26] = 0;
    malformedCr3[27] = 3;
    const malformedCr3Result = await parseMetadata(malformedCr3);
    expect(malformedCr3Result.format).toBe("cr3");
    expect(malformedCr3Result.completeness.complete).toBe(false);
    expect(malformedCr3Result.cr3?.diagnostics.some(({ code }) => code === "UNSAFE_RANGE")).toBe(true);
    const truncated = await parseMetadata(rafFixture().subarray(0, 120));
    expect(truncated.format).toBe("raf");
    expect(truncated.warnings.some(({ code }) => code === "MALFORMED_RAF")).toBe(true);
    const limited = await parseMetadata(cr3Fixture(), { limits: { ...DEFAULT_LIMITS, maxSegments: 1 } });
    expect(limited.cr3?.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    const controller = new AbortController(); controller.abort();
    await expect(parseMetadata(blob(rafFixture()), { signal: controller.signal })).rejects.toMatchObject({ code: "ABORTED" });
    const ranged = await parseMetadata(blob(rafFixture()), { scope: "metadata" });
    expect(ranged.format).toBe("raf");
    expect(ranged.completeness.inputBytes).toBe(512);
    expect(ranged.telemetry?.bytesRead).toBe(512);
  });

  it("keeps public result serialization bounded and retains both distinct inventories", async () => {
    const cr3 = await parseMetadata(cr3Fixture());
    const raf = await parseMetadata(rafFixture());
    const cr3Json = JSON.stringify(toJsonSafeResult(cr3));
    const rafJson = JSON.stringify(toJsonSafeResult(raf));
    expect(cr3Json).toContain('"cr3"');
    expect(rafJson).toContain('"raf"');
    expect(cr3Json).not.toContain('"data"');
    expect(rafJson).not.toContain('"data"');
  });

  it("keeps privacy fail-closed, exposes format-specific details, and never performs network I/O", async () => {
    const originalFetch = globalThis.fetch;
    let fetchCalls = 0;
    globalThis.fetch = () => { fetchCalls += 1; return Promise.reject(new Error("B05 parser must not fetch network resources.")); };
    try {
      const cr3 = await parseMetadata(cr3Fixture());
      const raf = await parseMetadata(rafFixture());
      expect(fetchCalls).toBe(0);
      expect(getImageDetails(cr3).formatSpecific).toMatchObject({ cr3: { primarySelection: "none" } });
      expect(getImageDetails(raf).formatSpecific).toMatchObject({ raf: { rangeCount: 3, complete: true } });
      const cr3Audit = await auditPrivacy(cr3Fixture());
      const rafAudit = await auditPrivacy(rafFixture());
      expect(cr3Audit.safe).toBe(false);
      expect(rafAudit.safe).toBe(false);
      expect(cr3Audit.findings.some(({ category, state }) => category === "opaque-block" && state === "opaque-risk")).toBe(true);
      expect(rafAudit.findings.some(({ category, state }) => category === "embedded-preview" && state === "decoded-finding")).toBe(true);
      expect(rafAudit.coverage.wholeFile).toBe("opaque");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("is available through the Node adapter without changing the CR3/RAF result model", async () => {
    const result = await parseNodeMetadata(blob(rafFixture()), { scope: "metadata" });
    expect(result.fileKind).toBe("raf");
    expect(result.raf?.directory?.preview.status).toBe("valid");
  });
});
