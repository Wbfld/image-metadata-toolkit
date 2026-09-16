import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

import { inventoryC2pa, inventoryJumbfC2pa, redactMetadata, rewritePngMetadata, rewriteWebpMetadata } from "../src/index.js";
import { JpegWriterError, rewriteJpegMetadata } from "../src/jpeg-writer.js";
import { WebpWriterError } from "../src/webp-writer.js";
import { c2paMutationFailure, hasC2paInventoryCandidate } from "../src/trust/jumbf.js";
import { resolveLimits } from "../src/security/limits.js";

const pngSignature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function u32(value: number): number[] {
  return [value >>> 24, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function pngChunk(type: string, payload: Uint8Array): Uint8Array {
  const body = Uint8Array.from([...type.split("").map((value) => value.charCodeAt(0)), ...payload]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  return Uint8Array.from([...u32(payload.length), ...body, ...u32(crc)]);
}

function minimalPngWithC2pa(): Uint8Array {
  const ihdr = Uint8Array.from([...u32(1), ...u32(1), 8, 2, 0, 0, 0]);
  return Uint8Array.from([...pngSignature, ...pngChunk("IHDR", ihdr), ...pngChunk("caBX", new TextEncoder().encode("c2pa urn:c2pa:manifest https://example.invalid/remote")), ...pngChunk("IEND", new Uint8Array())]);
}

function minimalJpegWithC2pa(): Uint8Array {
  const payload = new TextEncoder().encode("C2PA urn:c2pa:manifest https://example.invalid/remote");
  const length = payload.length + 2;
  const app11 = Uint8Array.from([0xff, 0xeb, length >>> 8, length & 0xff, ...payload]);
  const sof = Uint8Array.from([0xff, 0xc0, 0, 11, 8, 0, 1, 0, 1, 1, 1, 0x11, 0]);
  const sos = Uint8Array.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0]);
  return Uint8Array.from([0xff, 0xd8, ...app11, ...sof, ...sos, 0, 0, 0xff, 0xd9]);
}

function minimalWebpWithC2pa(): Uint8Array {
  const payload = new TextEncoder().encode("c2pa urn:c2pa:manifest https://example.invalid/remote");
  const chunk = Uint8Array.from([...new TextEncoder().encode("C2PA"), ...u32(payload.length).reverse(), ...payload, ...(payload.length % 2 === 0 ? [] : [0])]);
  return Uint8Array.from([...new TextEncoder().encode("RIFF"), ...u32(4 + chunk.length).reverse(), ...new TextEncoder().encode("WEBP"), ...chunk]);
}

function appendWebpC2pa(input: Uint8Array): Uint8Array {
  const payload = new TextEncoder().encode("c2pa urn:c2pa:manifest");
  const chunk = Uint8Array.from([...new TextEncoder().encode("C2PA"), payload.length & 0xff, (payload.length >>> 8) & 0xff, (payload.length >>> 16) & 0xff, (payload.length >>> 24) & 0xff, ...payload, ...(payload.length % 2 === 0 ? [] : [0])]);
  const output = Uint8Array.from([...input, ...chunk]);
  const size = output.length - 8;
  output[4] = size & 0xff;
  output[5] = (size >>> 8) & 0xff;
  output[6] = (size >>> 16) & 0xff;
  output[7] = (size >>> 24) & 0xff;
  return output;
}

function webpChunk(type: string, payload: Uint8Array): Uint8Array {
  return Uint8Array.from([...new TextEncoder().encode(type), payload.length & 0xff, (payload.length >>> 8) & 0xff, (payload.length >>> 16) & 0xff, (payload.length >>> 24) & 0xff, ...payload, ...(payload.length % 2 === 0 ? [] : [0])]);
}

function bmffBox(type: string, payload: Uint8Array): Uint8Array {
  return Uint8Array.from([...u32(payload.length + 8), ...new TextEncoder().encode(type), ...payload]);
}

function heifWithBoxes(...boxes: Uint8Array[]): Uint8Array {
  const ftyp = Uint8Array.from([...u32(20), ...new TextEncoder().encode("ftyp"), ...new TextEncoder().encode("mif1"), 0, 0, 0, 0, ...new TextEncoder().encode("mif1")]);
  return Uint8Array.from([...ftyp, ...boxes.flatMap((box) => [...box])]);
}

async function fixtureWithC2paPng(): Promise<Uint8Array> {
  const input = new Uint8Array(await readFile(new URL("./fixtures/base.png", import.meta.url)));
  const c2pa = pngChunk("caBX", new TextEncoder().encode("c2pa urn:c2pa:manifest"));
  const iend = input.length - 12;
  return Uint8Array.from([...input.subarray(0, iend), ...c2pa, ...input.subarray(iend)]);
}

async function fixtureWithC2paWebp(): Promise<Uint8Array> {
  return appendWebpC2pa(new Uint8Array(await readFile(new URL("./fixtures/base.webp", import.meta.url))));
}

describe("T03 bounded JUMBF/C2PA inventory", () => {
  it("inventories JPEG, PNG, and WebP carriers with ranges and no fetch", async () => {
    for (const input of [minimalJpegWithC2pa(), minimalPngWithC2pa(), minimalWebpWithC2pa()]) {
      const report = await inventoryC2pa(input);
      expect(report.detected, `${report.format}: ${report.status} ${JSON.stringify(report.diagnostics)}`).toBe(true);
      expect(report.stores[0]).toMatchObject({ mutationRisk: "high", structuralStatus: "inventoried" });
      expect(report.remoteReferencesFetched).toBe(false);
      expect(report.stores[0]?.offset).toBeGreaterThanOrEqual(0);
      expect(report.stores[0]?.length).toBeGreaterThan(0);
      expect(report.diagnostics.some((diagnostic) => diagnostic.code === "REMOTE_REFERENCE")).toBe(true);
    }
  });

  it("inventories an ISO-BMFF JUMBF box but does not classify ordinary UUID boxes", () => {
    const ftyp = Uint8Array.from([...u32(20), ...new TextEncoder().encode("ftyp"), ...new TextEncoder().encode("mif1"), 0, 0, 0, 0, ...new TextEncoder().encode("mif1")]);
    const jumbPayload = new TextEncoder().encode("c2pa");
    const jumb = Uint8Array.from([...u32(jumbPayload.length + 8), ...new TextEncoder().encode("jumb"), ...jumbPayload]);
    const input = Uint8Array.from([...ftyp, ...jumb]);
    const report = inventoryJumbfC2pa(input);
    expect(report.format).toBe("heif");
    expect(report.detected).toBe(true);
    expect(report.stores[0]?.container).toBe("iso-bmff-box");

    const uuid = Uint8Array.from([...u32(24), ...new TextEncoder().encode("uuid"), ...new Uint8Array(16)]);
    const ordinary = inventoryJumbfC2pa(Uint8Array.from([...ftyp, ...uuid]));
    expect(ordinary.detected).toBe(false);
  });

  it("reports malformed and bounded structures without throwing", () => {
    const malformed = Uint8Array.from([...pngSignature, 0, 0, 0, 50, 0x63, 0x61, 0x42, 0x58]);
    const report = inventoryJumbfC2pa(malformed);
    expect(report.status).toBe("malformed");
    expect(report.complete).toBe(false);
    expect(report.diagnostics).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));

    const countLimited = inventoryJumbfC2pa(minimalPngWithC2pa(), { limits: { maxPngChunks: 1 } });
    expect(countLimited.status).toBe("limited");
    expect(countLimited.complete).toBe(false);

    const malformedBox = inventoryJumbfC2pa(heifWithBoxes(Uint8Array.from([...u32(4), ...new TextEncoder().encode("jumb")])));
    expect(malformedBox.status).toBe("malformed");
    expect(malformedBox.complete).toBe(false);

    const overflowBox = Uint8Array.from([...u32(1), ...new TextEncoder().encode("jumb"), 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    const overflow = inventoryJumbfC2pa(heifWithBoxes(overflowBox));
    expect(overflow.status).toBe("limited");
    expect(overflow.diagnostics).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });

  it("retains bounded duplicate, parent, unknown, and truncation evidence", () => {
    const original = minimalPngWithC2pa();
    const duplicate = pngChunk("caBX", new TextEncoder().encode("c2pa urn:c2pa:manifest https://example.invalid/remote"));
    const iend = original.length - 12;
    const duplicated = Uint8Array.from([...original.subarray(0, iend), ...duplicate, ...original.subarray(iend)]);
    const duplicateReport = inventoryJumbfC2pa(duplicated);
    expect(duplicateReport.relationships.some((relationship) => relationship.kind === "duplicate")).toBe(true);
    expect(duplicateReport.diagnostics.some((diagnostic) => diagnostic.code === "DUPLICATE_STORE")).toBe(true);

    const nested = heifWithBoxes(bmffBox("jumb", bmffBox("jumb", new TextEncoder().encode("c2pa"))));
    const nestedReport = inventoryJumbfC2pa(nested);
    expect(nestedReport.stores.length).toBeGreaterThanOrEqual(2);
    expect(nestedReport.stores.some((store) => store.parentId !== null)).toBe(true);
    expect(nestedReport.diagnostics.some((diagnostic) => diagnostic.code === "MALFORMED_STRUCTURE")).toBe(false);

    const deep = nested;
    const tooDeep = inventoryJumbfC2pa(deep, { limits: { maxIfdDepth: 1 } });
    expect(tooDeep.status).toBe("limited");
    expect(tooDeep.complete).toBe(false);

    const unknown = inventoryJumbfC2pa(heifWithBoxes(bmffBox("c2xx", new TextEncoder().encode("opaque"))));
    expect(unknown.status).toBe("unsupported");
    expect(unknown.stores[0]?.structuralStatus).toBe("opaque");
    expect(unknown.diagnostics).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_STRUCTURE" }));

    for (let end = 8; end < original.length - 1; end += Math.max(1, Math.floor((original.length - 9) / 3))) {
      const truncated = inventoryJumbfC2pa(original.subarray(0, end));
      expect(truncated.complete, `truncation at ${end}`).toBe(false);
      expect(truncated.diagnostics.length, `truncation diagnostics at ${end}`).toBeGreaterThan(0);
    }
  });

  it("refuses C2PA-bearing mutation by default and accepts only explicit preservation", async () => {
    const png = await fixtureWithC2paPng();
    await expect(rewritePngMetadata(png, { blocks: [{ op: "add", kind: "text", keyword: "Comment", data: "x" }] })).rejects.toMatchObject({ code: "UNSUPPORTED_STRUCTURE" });
    const webp = await fixtureWithC2paWebp();
    try {
      rewriteWebpMetadata(webp, { blocks: [{ op: "add", kind: "xmp", data: "x" }] });
      throw new Error("WebP mutation unexpectedly succeeded.");
    } catch (error) {
      expect(error).toBeInstanceOf(WebpWriterError);
      expect((error as WebpWriterError).code).toBe("UNSUPPORTED_STRUCTURE");
    }
    expect(() => rewriteJpegMetadata(minimalJpegWithC2pa(), { blocks: [{ op: "add", kind: "standard-xmp", data: "x" }] })).toThrow(JpegWriterError);
    const redacted = await redactMetadata(png, { remove: ["PNGText"], c2pa: "refuse" });
    expect(redacted.outcome.successful).toBe(false);
    const preserved = await rewritePngMetadata(png, { blocks: [{ op: "add", kind: "text", keyword: "Comment", data: "x" }], c2pa: "preserve" });
    expect(preserved.data.length).toBeGreaterThan(png.length);
    const preservedWebp = rewriteWebpMetadata(webp, { blocks: [{ op: "add", kind: "xmp", data: "x" }], c2pa: "preserve" });
    expect(preservedWebp.data.length).toBeGreaterThan(webp.length);
    await expect(rewritePngMetadata(png, { blocks: [{ op: "add", kind: "text", keyword: "Comment", data: "x" }], c2pa: "invalidate" })).rejects.toThrow(/unavailable/u);
  });

  it("covers carrier boundary variants and conservative candidate decisions", () => {
    expect(inventoryJumbfC2pa(pngSignature.subarray(0, 4)).status).toBe("unsupported");
    const noKeyword = Uint8Array.from([...pngSignature, ...pngChunk("iTXt", new TextEncoder().encode("payload")), ...pngChunk("IEND", new Uint8Array())]);
    expect(inventoryJumbfC2pa(noKeyword).detected).toBe(false);
    const unknownPngType = Uint8Array.from([...pngSignature, ...pngChunk("zzzz", new TextEncoder().encode("c2pa opaque")), ...pngChunk("IEND", new Uint8Array())]);
    expect(inventoryJumbfC2pa(unknownPngType).detected).toBe(true);
    const crcBroken = minimalPngWithC2pa();
    crcBroken[crcBroken.length - 13] = (crcBroken[crcBroken.length - 13] ?? 0) ^ 0xff;
    expect(inventoryJumbfC2pa(crcBroken).diagnostics.some(({ code }) => code === "MALFORMED_STRUCTURE")).toBe(true);
    expect(inventoryJumbfC2pa(Uint8Array.from([...minimalPngWithC2pa(), 0])).complete).toBe(false);

    expect(inventoryJumbfC2pa(Uint8Array.of(0xff, 0xd8, 0xff, 0x01, 0xff, 0xd0, 0xff, 0xd9)).complete).toBe(true);
    expect(inventoryJumbfC2pa(Uint8Array.of(0xff, 0xd8, 0x01, 0x02)).complete).toBe(false);
    expect(inventoryJumbfC2pa(Uint8Array.of(0xff, 0xd8, 0xff)).complete).toBe(false);
    expect(inventoryJumbfC2pa(Uint8Array.of(0xff, 0xd8, 0xff, 0xff)).complete).toBe(false);
    expect(inventoryJumbfC2pa(Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0)).status).toBe("malformed");
    expect(inventoryJumbfC2pa(Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0, 1)).status).toBe("malformed");
    expect(inventoryJumbfC2pa(Uint8Array.of(0xff, 0xd8, 0xff, 0xeb, 0, 1)).status).toBe("malformed");

    const emptyWebp = Uint8Array.from([...new TextEncoder().encode("RIFF"), ...u32(4).reverse(), ...new TextEncoder().encode("WEBP")]);
    expect(inventoryJumbfC2pa(emptyWebp).complete).toBe(true);
    expect(inventoryJumbfC2pa(emptyWebp.subarray(0, 8)).status).toBe("unsupported");
    const webpUnknown = Uint8Array.from([...new TextEncoder().encode("RIFF"), ...u32(4 + webpChunk("TEST", Uint8Array.of(1)).length).reverse(), ...new TextEncoder().encode("WEBP"), ...webpChunk("TEST", Uint8Array.of(1))]);
    expect(inventoryJumbfC2pa(webpUnknown).detected).toBe(false);
    const webpTruncated = Uint8Array.from([...new TextEncoder().encode("RIFF"), ...u32(12).reverse(), ...new TextEncoder().encode("WEBP"), ...new TextEncoder().encode("TEST"), 0xff, 0xff, 0xff, 0xff]);
    expect(inventoryJumbfC2pa(webpTruncated).status).toBe("malformed");
    expect(hasC2paInventoryCandidate(webpTruncated, resolveLimits({ maxPngChunks: 1 }))).toBe(true);
    const webpTwoUnknown = Uint8Array.from([...new TextEncoder().encode("RIFF"), ...u32(webpChunk("TEST", Uint8Array.of(1)).length + webpChunk("MORE", Uint8Array.of(2)).length).reverse(), ...new TextEncoder().encode("WEBP"), ...webpChunk("TEST", Uint8Array.of(1)), ...webpChunk("MORE", Uint8Array.of(2))]);
    expect(hasC2paInventoryCandidate(webpTwoUnknown, resolveLimits({ maxPngChunks: 1 }))).toBe(true);
    const pngTruncated = Uint8Array.from([...pngSignature, 0, 0, 0, 50, 0x7a, 0x7a, 0x7a, 0x7a, 0, 0, 0, 0]);
    expect(hasC2paInventoryCandidate(pngTruncated, resolveLimits({ maxPngChunks: 1 }))).toBe(true);
    const jpegManyMarkers = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0, 2, 0xff, 0xe0, 0, 2, 0xff, 0xd9);
    expect(hasC2paInventoryCandidate(jpegManyMarkers, resolveLimits({ maxSegments: 1 }))).toBe(true);
    expect(inventoryJumbfC2pa(appendWebpC2pa(minimalWebpWithC2pa()), { limits: { maxPngChunks: 1 } }).status).toBe("limited");

    const uuid = Uint8Array.from([...u32(8 + 16 + 4), ...new TextEncoder().encode("uuid"), 0x63, 0x32, 0x70, 0x61, 0, 0x11, 0, 0x10, 0x80, 0, 0, 0xaa, 0, 0x38, 0x9b, 0x71, 0x63, 0x32, 0x70, 0x61]);
    expect(inventoryJumbfC2pa(heifWithBoxes(uuid)).stores[0]?.kind).toBe("c2pa");
    const extendedPayload = new TextEncoder().encode("jumbf c2pa");
    const extended = Uint8Array.from([0, 0, 0, 1, 0x6a, 0x75, 0x6d, 0x62, ...new Uint8Array([0, 0, 0, 0, 0, 0, 0, 16 + extendedPayload.length]), ...extendedPayload]);
    expect(inventoryJumbfC2pa(heifWithBoxes(extended)).detected).toBe(true);
    const shortExtended = Uint8Array.from([0, 0, 0, 1, 0x6a, 0x75, 0x6d, 0x62, 0, 0, 0, 0]);
    expect(inventoryJumbfC2pa(heifWithBoxes(shortExtended)).status).toBe("limited");
    const sizeZero = Uint8Array.from([0, 0, 0, 0, 0x6a, 0x75, 0x6d, 0x62, ...new TextEncoder().encode("c2pa")]);
    expect(inventoryJumbfC2pa(heifWithBoxes(sizeZero)).detected).toBe(true);
    expect(inventoryJumbfC2pa(minimalPngWithC2pa(), { limits: { maxAdapterItems: 1 } }).diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);

    expect(hasC2paInventoryCandidate(new Uint8Array(20), resolveLimits({ maxInputBytes: 10 }))).toBe(true);
    expect(hasC2paInventoryCandidate(new TextEncoder().encode("ordinary metadata"))).toBe(false);
    expect(hasC2paInventoryCandidate(minimalJpegWithC2pa())).toBe(true);
    expect(hasC2paInventoryCandidate(emptyWebp)).toBe(false);
    expect(hasC2paInventoryCandidate(webpTruncated)).toBe(false);
    expect(hasC2paInventoryCandidate(noKeyword)).toBe(false);
    expect(c2paMutationFailure(new TextEncoder().encode("c2pa"), undefined)).toContain("explicit preserve");
    expect(c2paMutationFailure(new TextEncoder().encode("c2pa"), "preserve")).toBeNull();
    expect(c2paMutationFailure(new TextEncoder().encode("c2pa"), "invalidate")).toContain("unavailable");
  });
});
