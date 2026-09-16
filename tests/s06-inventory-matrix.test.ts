import { describe, expect, it } from "vitest";

import { c2paMutationFailure, hasC2paInventoryCandidate, inventoryC2pa, inventoryJumbfC2pa } from "../src/trust/jumbf.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();
const pngSignature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const concat = (...parts: readonly Uint8Array[]) => Uint8Array.from(parts.flatMap((part) => [...part]));
function be32(value: number): Uint8Array { return Uint8Array.of((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255); }
function le32(value: number): Uint8Array { return Uint8Array.of(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255); }
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typed = encoder.encode(type); const body = concat(typed, data); const crc = be32(crc32(body));
  return concat(be32(data.length), body, crc);
}
function png(type: string, data: Uint8Array): Uint8Array {
  return concat(Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), pngChunk(type, data), pngChunk("IEND", new Uint8Array()));
}
function webpChunk(type: string, data: Uint8Array): Uint8Array { return concat(encoder.encode(type), le32(data.length), data, data.length % 2 === 1 ? Uint8Array.of(0) : new Uint8Array()); }
function webp(chunks: readonly Uint8Array[]): Uint8Array {
  const body = concat(encoder.encode("WEBP"), ...chunks); return concat(encoder.encode("RIFF"), le32(body.length), body);
}
function box(type: string, payload: Uint8Array): Uint8Array { return concat(be32(payload.length + 8), encoder.encode(type), payload); }
function jpeg(app11: Uint8Array): Uint8Array { return concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xeb, (app11.length + 2) >>> 8, (app11.length + 2) & 255), app11, Uint8Array.of(0xff, 0xda, 0, 2, 1, 2, 3, 0xff, 0xd9)); }

describe("S06 independent inventory boundary matrix", () => {
  it("inventories JPEG, PNG, and WebP carriers with references, duplicates, and malformed tails", async () => {
    const text = encoder.encode("jumbf c2pa:manifest-1 https://example.test/remote");
    const jpegResult = inventoryJumbfC2pa(jpeg(text));
    expect(jpegResult.status).toBe("detected");
    expect(jpegResult.stores[0]).toMatchObject({ container: "jpeg-app11", structuralStatus: "inventoried", mutationRisk: "high" });
    expect(jpegResult.relationships.some(({ kind }) => kind === "remote")).toBe(true);
    expect(jpegResult.remoteReferencesFetched).toBe(false);

    const cabx = png("caBX", text);
    const itxtPayload = concat(encoder.encode("XML:com.adobe.c2pa\0"), Uint8Array.of(0, 0), encoder.encode("en\0English\0"), text);
    const pngResult = inventoryJumbfC2pa(concat(cabx.slice(0, -12), pngChunk("iTXt", itxtPayload), pngChunk("IEND", new Uint8Array())));
    expect(pngResult.stores.map(({ container }) => container)).toContain("png-cabx");
    expect(pngResult.stores.map(({ container }) => container)).toContain("png-itxt");
    expect(inventoryJumbfC2pa(concat(cabx, Uint8Array.of(1))).diagnostics.some(({ code }) => code === "UNSUPPORTED_STRUCTURE")).toBe(true);

    const duplicate = webp([webpChunk("C2PA", text), webpChunk("C2PA", text)]);
    const webpResult = inventoryJumbfC2pa(duplicate);
    expect(webpResult.stores).toHaveLength(2);
    expect(webpResult.relationships.some(({ kind }) => kind === "duplicate")).toBe(true);
    expect(inventoryJumbfC2pa(webp([webpChunk("C2X1", text)])).diagnostics.some(({ code }) => code === "UNSUPPORTED_STRUCTURE")).toBe(true);
    expect(await inventoryC2pa(new Blob([duplicate as unknown as BlobPart]))).toMatchObject({ detected: true, remoteReferencesFetched: false });
  });

  it("covers ISO-BMFF nesting, UUID candidates, safe size handling, and overlap diagnostics", () => {
    const manifest = box("jumb", encoder.encode("c2pa:manifest"));
    const nested = concat(box("ftyp", concat(encoder.encode("heic"), new Uint8Array(8))), box("moov", concat(manifest, box("uuid", concat(Uint8Array.from([0x63, 0x32, 0x70, 0x61, 0, 0x11, 0, 0x10, 0x80, 0, 0, 0xaa, 0, 0x38, 0x9b, 0x71]), encoder.encode("manifest"))))));
    const result = inventoryJumbfC2pa(nested);
    expect(result.stores.length).toBeGreaterThanOrEqual(2);
    expect(result.stores.every(({ container }) => container === "iso-bmff-box")).toBe(true);
    expect(result.stores.some(({ parentId }) => parentId !== null)).toBe(true);
    const ftyp = box("ftyp", concat(encoder.encode("heic"), new Uint8Array(8)));
    const malformed = concat(ftyp, be32(4), encoder.encode("jumb"));
    expect(inventoryJumbfC2pa(malformed).diagnostics.some(({ code }) => code === "MALFORMED_STRUCTURE")).toBe(true);
    const extendedTooLarge = concat(ftyp, be32(1), encoder.encode("jumb"), Uint8Array.of(0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff));
    expect(inventoryJumbfC2pa(extendedTooLarge).diagnostics.length).toBeGreaterThan(0);
    expect(inventoryJumbfC2pa(nested, { limits: { maxIfdDepth: 1 } }).status).toBe("limited");
  });

  it("keeps conservative candidate and mutation policy behavior fail-closed", () => {
    const jpegBytes = jpeg(encoder.encode("not c2pa"));
    expect(hasC2paInventoryCandidate(jpegBytes)).toBe(true);
    expect(hasC2paInventoryCandidate(new Uint8Array([1, 2, 3]))).toBe(false);
    expect(hasC2paInventoryCandidate(new Uint8Array(10), resolveLimits({ maxInputBytes: 2 }))).toBe(true);
    expect(c2paMutationFailure(new Uint8Array([1, 2, 3]), undefined)).toBeNull();
    expect(c2paMutationFailure(jpegBytes, "preserve")).toBeNull();
    expect(c2paMutationFailure(jpegBytes, "invalidate")).toContain("unavailable");
    expect(c2paMutationFailure(jpegBytes, "refuse")).toContain("explicit preserve");
    expect(inventoryJumbfC2pa(new Uint8Array([0x89, 0x50])).status).toBe("unsupported");
    expect(inventoryJumbfC2pa(concat(encoder.encode("RIFF"), le32(100), encoder.encode("WEBP"))).status).toBe("malformed");
  });

  it("covers every carrier boundary and conservative candidate path without fetching remote data", () => {
    expect(inventoryJumbfC2pa(new Uint8Array()).status).toBe("unsupported");
    expect(inventoryJumbfC2pa(Uint8Array.of(0xff, 0xd8, 0xff)).diagnostics).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));

    const standaloneJpeg = concat(Uint8Array.of(0xff, 0xd8, 0xff, 0x01, 0xff, 0xd9));
    expect(inventoryJumbfC2pa(standaloneJpeg).complete).toBe(true);
    const markerTruncated = concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xeb, 0));
    expect(inventoryJumbfC2pa(markerTruncated).diagnostics).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    const badJpegLength = concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xeb, 0, 1));
    expect(inventoryJumbfC2pa(badJpegLength).diagnostics).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    const noEoi = concat(Uint8Array.of(0xff, 0xd8, 0xff, 0xda, 0, 2, 1, 2, 3));
    expect(inventoryJumbfC2pa(noEoi).complete).toBe(false);
    expect(hasC2paInventoryCandidate(Uint8Array.from([0xff, 0xd8, 0xff, 0xeb, 0, 2]))).toBe(true);

    expect(inventoryJumbfC2pa(pngSignature).diagnostics).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    const badCrcPng = concat(pngSignature, pngChunk("caBX", encoder.encode("c2pa")), pngChunk("IEND", new Uint8Array()));
    badCrcPng[badCrcPng.length - 5] = (badCrcPng[badCrcPng.length - 5] ?? 0) ^ 0xff;
    expect(inventoryJumbfC2pa(badCrcPng).diagnostics).toContainEqual(expect.objectContaining({ code: "MALFORMED_STRUCTURE" }));
    const pngAfterIend = concat(png("IDAT", new Uint8Array()), Uint8Array.of(1, 2));
    expect(inventoryJumbfC2pa(pngAfterIend).diagnostics).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_STRUCTURE" }));
    const pngNoIend = concat(pngSignature, pngChunk("IDAT", new Uint8Array()));
    expect(inventoryJumbfC2pa(pngNoIend).complete).toBe(false);
    expect(hasC2paInventoryCandidate(concat(pngSignature, pngChunk("caBX", encoder.encode("x"))))).toBe(true);

    expect(inventoryJumbfC2pa(concat(encoder.encode("RIFF"), le32(100), encoder.encode("WEBP"))).status).toBe("malformed");
    const webpTrailingHeader = webp([webpChunk("C2PA", encoder.encode("c2pa"))]).slice(0, -1);
    expect(inventoryJumbfC2pa(webpTrailingHeader).complete).toBe(false);
    const webpOdd = webp([webpChunk("JUMF", encoder.encode("jumbf"))]);
    expect(inventoryJumbfC2pa(webpOdd).stores[0]?.container).toBe("webp-chunk");
    expect(hasC2paInventoryCandidate(webpOdd)).toBe(true);

    const ftyp = box("ftyp", concat(encoder.encode("heic"), new Uint8Array(8)));
    const sizeZero = concat(ftyp, Uint8Array.from([...be32(0), ...encoder.encode("jumb"), ...encoder.encode("c2pa")]));
    expect(inventoryJumbfC2pa(sizeZero).detected).toBe(true);
    const extended = concat(ftyp, Uint8Array.from([...be32(1), ...encoder.encode("jumb"), ...be32(0), ...be32(20), ...encoder.encode("c2pa")]));
    expect(inventoryJumbfC2pa(extended).diagnostics.length).toBeGreaterThan(0);
    expect(hasC2paInventoryCandidate(concat(ftyp, box("jumb", encoder.encode("c2pa"))))).toBe(true);
    expect(hasC2paInventoryCandidate(concat(ftyp, box("free", new Uint8Array())))).toBe(false);
  });

  it("retains typed outcomes for carrier limits, non-carrier bytes, and each bounded candidate shortcut", () => {
    const jpegComment = concat(
      Uint8Array.of(0xff, 0xd8),
      Uint8Array.of(0xff, 0xfe, 0, 4, 0x6f, 0x6b),
      Uint8Array.of(0xff, 0xda, 0, 2, 1, 0xff, 0xd9),
    );
    expect(inventoryJumbfC2pa(jpegComment).detected).toBe(false);
    expect(inventoryJumbfC2pa(concat(Uint8Array.of(0xff, 0xd8), Uint8Array.of(1, 2))).complete).toBe(false);

    const text = encoder.encode("c2pa:manifest https://example.test/remote");
    const constrainedWebp = inventoryJumbfC2pa(webp([webpChunk("C2PA", text), webpChunk("JUMBF", text)]), { limits: { maxSegments: 1, maxAdapterItems: 1 } });
    expect(constrainedWebp.status).toBe("limited");
    expect(constrainedWebp.diagnostics.some(({ code }) => code === "LIMIT_EXCEEDED")).toBe(true);
    expect(constrainedWebp.relationships).toHaveLength(1);
    expect(inventoryJumbfC2pa(webp([webpChunk("C2PA", text), webpChunk("JUMBF", text)]), { limits: { maxPngChunks: 1 } }).status).toBe("limited");
    expect(inventoryJumbfC2pa(concat(encoder.encode("RIFF"), le32(12), encoder.encode("WEBP"), Uint8Array.of(1))).complete).toBe(false);

    const ftyp = box("ftyp", concat(encoder.encode("heic"), new Uint8Array(8)));
    const validExtended = concat(ftyp, Uint8Array.from([...be32(1), ...encoder.encode("c2pa"), ...be32(0), ...be32(16 + text.length), ...text]));
    expect(inventoryJumbfC2pa(validExtended).stores[0]?.boxType).toBe("c2pa");
    expect(inventoryJumbfC2pa(concat(ftyp, box("c2x1", text))).diagnostics.some(({ code }) => code === "UNSUPPORTED_STRUCTURE")).toBe(true);
    expect(inventoryJumbfC2pa(concat(ftyp, box("moov", box("jumb", text))), { limits: { maxIfdDepth: 1 } }).status).toBe("limited");

    for (const type of ["C2PA", "JUMF", "JUMBF"] as const) {
      expect(hasC2paInventoryCandidate(webp([webpChunk(type, new Uint8Array())]))).toBe(true);
    }
    expect(hasC2paInventoryCandidate(webp([webpChunk("FREE", new Uint8Array()), webpChunk("FREE", new Uint8Array())]), resolveLimits({ maxPngChunks: 1 }))).toBe(true);
    expect(hasC2paInventoryCandidate(concat(pngSignature, pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array())), resolveLimits({ maxPngChunks: 1 }))).toBe(true);
    expect(hasC2paInventoryCandidate(concat(pngSignature, pngChunk("IDAT", new Uint8Array())))).toBe(false);
  });
});
