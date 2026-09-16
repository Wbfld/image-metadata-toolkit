import { describe, expect, it } from "vitest";

import { c2paMutationFailure, hasC2paInventoryCandidate, inventoryC2pa, inventoryJumbfC2pa } from "../src/trust/jumbf.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();
const pngSignature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function be32(value: number): Uint8Array {
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function le32(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, payload: Uint8Array, validCrc = true): Uint8Array {
  const body = concat(encoder.encode(type), payload);
  const crc = validCrc ? crc32(body) : crc32(body) ^ 0xffffffff;
  return concat(be32(payload.length), body, be32(crc));
}

function webpChunk(type: string, payload: Uint8Array): Uint8Array {
  return concat(encoder.encode(type), le32(payload.length), payload, payload.length % 2 === 1 ? Uint8Array.of(0) : new Uint8Array());
}

function webp(chunks: readonly Uint8Array[], declaredLength = 4 + chunks.reduce((total, chunk) => total + chunk.length, 0)): Uint8Array {
  return concat(encoder.encode("RIFF"), le32(declaredLength), encoder.encode("WEBP"), ...chunks);
}

function bmffBox(type: string, payload: Uint8Array): Uint8Array {
  return concat(be32(payload.length + 8), encoder.encode(type), payload);
}

function bmffExtendedBox(type: string, payload: Uint8Array): Uint8Array {
  return concat(be32(1), encoder.encode(type), new Uint8Array([0, 0, 0, 0, 0, 0, 0, payload.length + 16]), payload);
}

function heif(...boxes: readonly Uint8Array[]): Uint8Array {
  return concat(bmffBox("ftyp", concat(encoder.encode("heic"), new Uint8Array(4), encoder.encode("mif1"))), ...boxes);
}

const remoteManifest = encoder.encode("jumbf c2pa:manifest-1 https://example.invalid/manifest");

describe("S06 C2PA/JUMBF carrier branch evidence", () => {
  it("retains JPEG marker and scan-boundary diagnostics while inventorying APP11", () => {
    const valid = concat(
      Uint8Array.of(0xff, 0xd8),
      Uint8Array.of(0xff, 0xff, 0xd0),
      Uint8Array.of(0xff, 0xeb, (remoteManifest.length + 2) >>> 8, (remoteManifest.length + 2) & 0xff),
      remoteManifest,
      Uint8Array.of(0xff, 0xda, 0, 2, 0x01, 0x02, 0x03, 0xff, 0xd9),
    );
    const detected = inventoryJumbfC2pa(valid);
    expect(detected.detected).toBe(true);
    expect(detected.stores).toHaveLength(1);
    expect(detected.relationships).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "remote", targetStoreId: null }),
      expect.objectContaining({ kind: "unresolved", targetStoreId: null }),
    ]));

    const cases = [
      Uint8Array.of(0xff, 0xd8, 0x01, 0x02),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xff),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0, 1),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xeb, 0, 1),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xda, 0, 2, 0, 0, 0),
      Uint8Array.of(0xff, 0xd8, 0xff, 0xd9),
    ];
    for (const input of cases) {
      const result = inventoryJumbfC2pa(input);
      expect(result.diagnostics.every(({ code, offset, length }) => /^[A-Z][A-Z0-9_]+$/u.test(code) && (offset === null || offset >= 0) && (length === null || length >= 0))).toBe(true);
    }
    expect(inventoryJumbfC2pa(Uint8Array.of(0xff, 0xd8, 0xff, 0x01, 0xff, 0xd0, 0xff, 0xd9)).complete).toBe(true);
  });

  it("covers PNG text-carrier forms, CRC diagnostics, tails, and bounded chunk scanning", () => {
    const keyword = concat(encoder.encode("XML:com.adobe.c2pa"), Uint8Array.of(0), Uint8Array.of(0, 0), encoder.encode("en\0English\0"), remoteManifest);
    const png = concat(pngSignature, pngChunk("iTXt", keyword), pngChunk("zzzz", encoder.encode("c2pa opaque")), pngChunk("IEND", new Uint8Array()));
    const result = inventoryJumbfC2pa(png);
    expect(result.stores.map(({ container }) => container)).toEqual(expect.arrayContaining(["png-itxt"]));
    expect(result.diagnostics.some(({ code }) => code === "REMOTE_REFERENCE")).toBe(true);

    const malformedCrc = concat(pngSignature, pngChunk("caBX", encoder.encode("c2pa"), false), pngChunk("IEND", new Uint8Array()));
    expect(inventoryJumbfC2pa(malformedCrc).diagnostics).toContainEqual(expect.objectContaining({ code: "MALFORMED_STRUCTURE" }));
    const noKeyword = concat(pngSignature, pngChunk("iTXt", encoder.encode("payload")), pngChunk("IEND", new Uint8Array()));
    expect(inventoryJumbfC2pa(noKeyword).detected).toBe(false);
    expect(inventoryJumbfC2pa(concat(pngSignature, pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array()), Uint8Array.of(1))).complete).toBe(false);
    expect(inventoryJumbfC2pa(concat(pngSignature, pngChunk("IDAT", new Uint8Array()))).complete).toBe(false);
    expect(inventoryJumbfC2pa(concat(pngSignature, pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array())), { limits: { maxPngChunks: 1 } }).status).toBe("limited");
    expect(hasC2paInventoryCandidate(concat(pngSignature, pngChunk("IDAT", new Uint8Array()), pngChunk("IEND", new Uint8Array())), resolveLimits({ maxPngChunks: 1 }))).toBe(true);
  });

  it("covers WebP chunk parity, RIFF boundaries, and conservative candidate paths", () => {
    const odd = webp([webpChunk("JUMF", remoteManifest)]);
    const result = inventoryJumbfC2pa(odd);
    expect(result.detected).toBe(true);
    expect(result.stores[0]).toMatchObject({ container: "webp-chunk", boxType: "jumf" });
    expect(result.remoteReferencesFetched).toBe(false);

    const malformed = webp([webpChunk("TEST", Uint8Array.of(1))], 4 + webpChunk("TEST", Uint8Array.of(1)).length + 1);
    expect(inventoryJumbfC2pa(malformed).diagnostics).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    const chunkHeader = concat(encoder.encode("RIFF"), le32(12), encoder.encode("WEBP"), encoder.encode("TEST"), le32(0xffffffff));
    expect(inventoryJumbfC2pa(chunkHeader).status).toBe("malformed");
    expect(inventoryJumbfC2pa(encoder.encode("RIFF")).status).toBe("unsupported");
    expect(hasC2paInventoryCandidate(webp([webpChunk("C2PA", new Uint8Array())]))).toBe(true);
    expect(hasC2paInventoryCandidate(webp([webpChunk("FREE", new Uint8Array()), webpChunk("FREE", new Uint8Array())]), resolveLimits({ maxPngChunks: 1 }))).toBe(true);
    expect(hasC2paInventoryCandidate(webp([webpChunk("FREE", Uint8Array.of(1))]))).toBe(false);
  });

  it("covers nested ISO-BMFF carrier kinds, UUID matching, and extended or zero-sized boxes", () => {
    const uuid = concat(
      new Uint8Array([0x63, 0x32, 0x70, 0x61, 0x00, 0x11, 0x00, 0x10, 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71]),
      remoteManifest,
    );
    const nested = heif(
      bmffBox("moov", bmffBox("meta", bmffBox("jumb", remoteManifest))),
      bmffBox("jp2h", bmffBox("jp2c", encoder.encode("c2pa"))),
      bmffExtendedBox("c2pa", remoteManifest),
      bmffBox("uuid", uuid),
      bmffBox("uuid", new Uint8Array(16)),
      bmffBox("c2x1", encoder.encode("opaque")),
      concat(be32(0), encoder.encode("jumb"), encoder.encode("c2pa")),
    );
    const result = inventoryJumbfC2pa(nested);
    expect(result.stores.length).toBeGreaterThanOrEqual(5);
    expect(result.stores.some(({ parentId }) => parentId !== null)).toBe(true);
    expect(result.stores.some(({ boxType }) => boxType === "uuid")).toBe(true);
    expect(result.diagnostics.some(({ code }) => code === "UNSUPPORTED_STRUCTURE")).toBe(true);
    expect(result.diagnostics.some(({ code }) => code === "REMOTE_REFERENCE")).toBe(true);
    const depthLimited = inventoryJumbfC2pa(nested, { limits: { maxIfdDepth: 1 } });
    expect(depthLimited.complete).toBe(false);
    expect(depthLimited.diagnostics).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(inventoryJumbfC2pa(heif(bmffBox("jumb", new Uint8Array())), { limits: { maxSegments: 1 } }).status).toBe("limited");
    expect(hasC2paInventoryCandidate(heif(bmffBox("jumb", remoteManifest)))).toBe(true);
  });

  it("retains duplicate and resolved relationships, bounded output behavior, and mutation policy semantics", async () => {
    const firstPayload = encoder.encode("c2pa:1:39 https://x");
    const resolved = concat(pngSignature, pngChunk("caBX", firstPayload), pngChunk("caBX", encoder.encode("c2pa")), pngChunk("IEND", new Uint8Array()));
    const resolvedResult = inventoryJumbfC2pa(resolved);
    expect(resolvedResult.relationships).toContainEqual(expect.objectContaining({ kind: "manifest", targetStoreId: "c2pa:1:39", reference: "c2pa:1:39" }));

    const duplicate = inventoryJumbfC2pa(concat(pngSignature, pngChunk("caBX", encoder.encode("c2pa")), pngChunk("caBX", encoder.encode("c2pa")), pngChunk("IEND", new Uint8Array())));
    expect(duplicate.relationships).toContainEqual(expect.objectContaining({ kind: "duplicate", targetStoreId: "c2pa:0:8" }));
    expect(duplicate.diagnostics).toContainEqual(expect.objectContaining({ code: "DUPLICATE_STORE" }));

    const relationshipLimited = inventoryJumbfC2pa(resolved, { limits: { maxAdapterItems: 1 } });
    expect(relationshipLimited.status).toBe("limited");
    expect(relationshipLimited.diagnostics).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(inventoryJumbfC2pa(resolved, { limits: { maxSegments: 1 } }).status).toBe("limited");

    const gif = Uint8Array.from([...encoder.encode("GIF89a"), 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x3b]);
    expect(inventoryJumbfC2pa(gif).complete).toBe(false);
    expect(inventoryJumbfC2pa(new Uint8Array()).status).toBe("unsupported");
    expect((await inventoryC2pa(new Blob([resolved.buffer.slice(resolved.byteOffset, resolved.byteOffset + resolved.byteLength) as ArrayBuffer]))).detected).toBe(true);

    const jpegWithApp11 = Uint8Array.of(0xff, 0xd8, 0xff, 0xeb, 0, 2, 0xff, 0xd9);
    expect(hasC2paInventoryCandidate(jpegWithApp11)).toBe(true);
    expect(hasC2paInventoryCandidate(Uint8Array.of(0xff, 0xd8, 0xff, 0x01, 0xff, 0x01, 0xff, 0xd9), resolveLimits({ maxSegments: 1 }))).toBe(true);
    expect(c2paMutationFailure(resolved, "preserve")).toBeNull();
    expect(c2paMutationFailure(resolved, "invalidate")).toContain("unavailable");
    expect(c2paMutationFailure(resolved, undefined)).toContain("explicit preserve policy");
    expect(c2paMutationFailure(new Uint8Array([1, 2, 3]), "refuse")).toBeNull();
  });

  it("keeps every carrier parser bounded at each structural truncation boundary", () => {
    const jpeg = concat(
      Uint8Array.of(0xff, 0xd8),
      Uint8Array.of(0xff, 0xeb, (remoteManifest.length + 2) >>> 8, (remoteManifest.length + 2) & 0xff),
      remoteManifest,
      Uint8Array.of(0xff, 0xda, 0, 2, 1, 2, 0xff, 0xd9),
    );
    const png = concat(pngSignature, pngChunk("caBX", remoteManifest), pngChunk("IEND", new Uint8Array()));
    const webpInput = webp([webpChunk("JUMF", remoteManifest)]);
    const bmff = heif(bmffBox("moov", bmffBox("meta", bmffBox("jumb", remoteManifest))), bmffBox("c2pa", remoteManifest));
    for (const input of [jpeg, png, webpInput, bmff]) {
      for (let length = 0; length <= input.length; length += 1) {
        const result = inventoryJumbfC2pa(input.subarray(0, length).slice());
        expect(result.stores.length).toBeLessThanOrEqual(64);
        expect(result.relationships.length).toBeLessThanOrEqual(4096);
        expect(result.diagnostics.length).toBeLessThanOrEqual(64);
        expect(result.remoteReferencesFetched).toBe(false);
      }
    }
  });
});
