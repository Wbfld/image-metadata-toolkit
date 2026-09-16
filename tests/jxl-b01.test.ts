import { brotliCompressSync, brotliDecompressSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { parseMetadata, type JxlBrotliDecompressor } from "../src/index.js";

const SIGNATURE = Uint8Array.of(0, 0, 0, 12, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a);

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function appendBits(output: number[], value: number, count: number): void {
  for (let index = 0; index < count; index += 1) output.push((value >>> index) & 1);
}

function sizeValue(value: number): [number, number, number, number] {
  if (value <= 512) return [0, 0, value - 1, 9];
  if (value <= 8192) return [1, 1, value - 1, 13];
  if (value <= 262144) return [2, 2, value - 1, 18];
  return [3, 3, value - 1, 30];
}

function codestream(width: number, height: number): Uint8Array {
  const bits: number[] = [];
  const small = width <= 256 && height <= 256 && width % 8 === 0 && height % 8 === 0;
  bits.push(small ? 1 : 0);
  if (small) appendBits(bits, height / 8 - 1, 5);
  else {
    const [, selector, value, count] = sizeValue(height);
    appendBits(bits, selector, 2);
    appendBits(bits, value, count);
  }
  appendBits(bits, 0, 3);
  if (small) appendBits(bits, width / 8 - 1, 5);
  else {
    const [, selector, value, count] = sizeValue(width);
    appendBits(bits, selector, 2);
    appendBits(bits, value, count);
  }
  const output = new Uint8Array(2 + Math.ceil(bits.length / 8));
  output.set([0xff, 0x0a]);
  bits.forEach((bit, index) => {
    const offset = 2 + Math.floor(index / 8);
    output[offset] = (output[offset] ?? 0) | (bit << (index % 8));
  });
  return output;
}

function codestreamLayout(height: number, ratio: number, width?: number): Uint8Array {
  const bits: number[] = [];
  const small = width !== undefined && width <= 256 && height <= 256 && width % 8 === 0 && height % 8 === 0;
  bits.push(small ? 1 : 0);
  if (small) appendBits(bits, height / 8 - 1, 5);
  else {
    const [, selector, value, count] = sizeValue(height);
    appendBits(bits, selector, 2);
    appendBits(bits, value, count);
  }
  appendBits(bits, ratio, 3);
  if (ratio === 0) {
    if (small) {
      appendBits(bits, width / 8 - 1, 5);
    }
    else {
      const [, selector, value, count] = sizeValue(width ?? 8);
      appendBits(bits, selector, 2);
      appendBits(bits, value, count);
    }
  }
  const output = new Uint8Array(2 + Math.ceil(bits.length / 8));
  output.set([0xff, 0x0a]);
  bits.forEach((bit, index) => {
    const offset = 2 + Math.floor(index / 8);
    output[offset] = (output[offset] ?? 0) | (bit << (index % 8));
  });
  return output;
}

function box(type: string, payload: Uint8Array, extended = false): Uint8Array {
  const headerLength = extended ? 16 : 8;
  const output = new Uint8Array(headerLength + payload.length);
  const view = new DataView(output.buffer);
  if (extended) {
    view.setUint32(0, 1);
    view.setBigUint64(8, BigInt(output.length));
  } else view.setUint32(0, output.length);
  output.set(new TextEncoder().encode(type), 4);
  output.set(payload, headerLength);
  return output;
}

function zeroSizedBox(type: string, payload: Uint8Array): Uint8Array {
  const output = box(type, payload);
  new DataView(output.buffer).setUint32(0, 0);
  return output;
}

function container(...boxes: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(SIGNATURE.length + boxes.reduce((total, item) => total + item.length, 0));
  output.set(SIGNATURE);
  let offset = SIGNATURE.length;
  for (const item of boxes) {
    output.set(item, offset);
    offset += item.length;
  }
  return output;
}

function tiffWithMake(): Uint8Array {
  const output = new Uint8Array(31);
  const view = new DataView(output.buffer);
  output.set([0x49, 0x49, 0x2a, 0x00], 0);
  view.setUint32(4, 8, true);
  view.setUint16(8, 1, true);
  view.setUint16(10, 0x010f, true);
  view.setUint16(12, 2, true);
  view.setUint32(14, 5, true);
  view.setUint32(18, 26, true);
  view.setUint32(22, 0, true);
  output.set([0x54, 0x65, 0x73, 0x74, 0x00], 26);
  return output;
}

function compressedBox(type: string, payload: Uint8Array): Uint8Array {
  const compressed = new Uint8Array(brotliCompressSync(payload));
  const wrapped = new Uint8Array(4 + compressed.length);
  wrapped.set(new TextEncoder().encode(type));
  wrapped.set(compressed, 4);
  return box("brob", wrapped);
}

describe("B01 JPEG XL dimensions and compressed metadata", () => {
  it("reads raw codestream dimensions without inventing container metadata", async () => {
    const raw = new Uint8Array([...codestream(800, 600), ...new TextEncoder().encode("<x:xmpmeta/>")]);
    const result = await parseMetadata(raw);
    expect(result.dimensions).toEqual({ width: 800, height: 600 });
    expect(result.xmp).toBeNull();
    expect(result.blocks).toEqual([]);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_STRUCTURE" }));
  });

  it("reads small and non-small codestream dimensions in complete and partial container boxes", async () => {
    const complete = await parseMetadata(container(box("jxlc", codestream(1600, 900))));
    expect(complete.dimensions).toEqual({ width: 1600, height: 900 });
    expect(complete.warnings).toEqual([]);

    const small = await parseMetadata(container(box("jxlc", codestream(16, 8))));
    expect(small.dimensions).toEqual({ width: 16, height: 8 });

    const stream = codestream(640, 480);
    const first = new Uint8Array(4 + 3);
    new DataView(first.buffer).setUint32(0, 0);
    first.set(stream.subarray(0, 3), 4);
    const second = new Uint8Array(4 + stream.length - 3);
    new DataView(second.buffer).setUint32(0, 0x80000001);
    second.set(stream.subarray(3), 4);
    const partial = await parseMetadata(container(box("jxlp", second), box("jxlp", first)));
    expect(partial.dimensions).toEqual({ width: 640, height: 480 });
    expect(partial.warnings).toEqual([]);
  });

  it("covers every codestream ratio and non-small size selector", async () => {
    for (const ratio of [1, 2, 3, 4, 5, 6, 7]) {
      const result = await parseMetadata(codestreamLayout(16, ratio, 16));
      expect(result.dimensions).toEqual({ width: Math.floor(16 * ([1, 1.2, 4 / 3, 1.5, 16 / 9, 1.25, 2][ratio - 1] ?? 1)), height: 16 });
      expect(result.warnings).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_STRUCTURE" }));
    }

    for (const size of [512, 8192, 262144, 262145]) {
      const result = await parseMetadata(codestreamLayout(size, 0, size));
      expect(result.dimensions).toEqual({ width: size, height: size });
    }

    for (const truncated of [
      Uint8Array.of(0xff, 0x0a, 0x00),
      Uint8Array.of(0xff, 0x0a, 0x01),
      Uint8Array.of(0xff, 0x0a, 0x02, 0x00),
      codestreamLayout(16, 0, 16).slice(0, 3),
    ]) {
      const result = await parseMetadata(truncated);
      expect(result.dimensions).toBeNull();
      expect(result.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));
    }
  });

  it("decodes Brotli-compressed XMP and Exif through the injected implementation", async () => {
    const calls: Uint8Array[] = [];
    const decoder: JxlBrotliDecompressor = (compressed) => {
      calls.push(compressed);
      return new Uint8Array(brotliDecompressSync(compressed));
    };
    const packet = new TextEncoder().encode("<x:xmpmeta xmlns:x=\"adobe:ns:meta/\"/>");
    const exifPayload = new Uint8Array(4 + tiffWithMake().length);
    exifPayload.set(tiffWithMake(), 4);
    const result = await parseMetadata(container(compressedBox("xml ", packet), compressedBox("Exif", exifPayload)), { jxlBrotliDecompressor: decoder });
    expect(calls).toHaveLength(2);
    expect(result.xmp?.packets).toEqual([new TextDecoder().decode(packet)]);
    expect(result.exif?.fields).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Make", value: "Test" })]));
    expect(result.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ container: "Brotli-compressed xml  box", status: "decoded" }),
      expect.objectContaining({ container: "Brotli-compressed Exif box", status: "decoded" }),
    ]));
    expect(result.exif?.fields.every((field) => field.source?.blockId.startsWith("jxl:brob:"))).toBe(true);
    expect(result.exif?.fields.every((field) => field.source?.entryOffset === null && field.source.valueOffset === null)).toBe(true);
  });

  it("makes unsupported platform Brotli explicit and accepts an asynchronous custom decoder", async () => {
    const packet = new TextEncoder().encode("<x:xmpmeta/>");
    const input = container(compressedBox("xml ", packet));
    const platform = await parseMetadata(input);
    if (platform.xmp === null) expect(platform.warnings).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_COMPRESSION" }));
    else expect(platform.warnings).not.toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_COMPRESSION" }));

    const custom = await parseMetadata(input, { jxlBrotliDecompressor: (compressed) => new Uint8Array(brotliDecompressSync(compressed)) });
    expect(custom.xmp?.packets).toEqual([new TextDecoder().decode(packet)]);
    expect(custom.warnings).toEqual([]);
  });

  it("fails closed for malformed Brotli boxes, invalid output, and decompressed limits", async () => {
    const malformed = await parseMetadata(container(box("brob", Uint8Array.of(1, 2, 3, 4))));
    expect(malformed.warnings).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_STRUCTURE" }));
    expect(malformed.blocks).toContainEqual(expect.objectContaining({ family: "Unknown", status: "opaque" }));

    const packet = new TextEncoder().encode("<x:xmpmeta/>");
    const input = container(compressedBox("xml ", packet));
    const invalid = await parseMetadata(input, { limits: { maxDecompressedBytes: 4 }, jxlBrotliDecompressor: () => new Uint8Array(packet.length + 1) });
    expect(invalid.xmp).toBeNull();
    expect(invalid.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const bad = await parseMetadata(input, { jxlBrotliDecompressor: () => Uint8Array.of(0xff, 0xfe) });
    expect(bad.xmp).toBeNull();
    expect(bad.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
  });

  it("does not invoke a Brotli decoder for an unselected metadata family", async () => {
    const packet = new TextEncoder().encode("<x:xmpmeta/>");
    let called = false;
    const result = await parseMetadata(container(compressedBox("xml ", packet)), {
      select: { groups: ["EXIF"] },
      jxlBrotliDecompressor: () => { called = true; return packet; },
    });
    expect(called).toBe(false);
    expect(result.xmp).toBeNull();
    expect(result.blocks).toContainEqual(expect.objectContaining({ status: "skipped", family: "XMP" }));
  });

  it("enforces aggregate metadata, XML string, and packet-count limits", async () => {
    const first = new TextEncoder().encode("<x:xmpmeta>a</x:xmpmeta>");
    const second = new TextEncoder().encode("<x:xmpmeta>b</x:xmpmeta>");
    const aggregate = await parseMetadata(container(box("xml ", first), box("xml ", second)), { limits: { maxMetadataBytes: first.length + second.length - 1 } });
    expect(aggregate.xmp?.packets).toEqual([new TextDecoder().decode(first)]);
    expect(aggregate.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
    expect(aggregate.blocks).toContainEqual(expect.objectContaining({ status: "partial", warningCodes: ["LIMIT_EXCEEDED"] }));

    const stringLimited = await parseMetadata(container(box("xml ", first)), { limits: { maxStringBytes: first.length - 1 } });
    expect(stringLimited.xmp).toBeNull();
    expect(stringLimited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const packetsLimited = await parseMetadata(container(box("xml ", first), box("xml ", second)), { limits: { maxXmpPackets: 1 } });
    expect(packetsLimited.xmp?.packets).toEqual([new TextDecoder().decode(first)]);
    expect(packetsLimited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });

  it("reports truncated and contradictory codestream containers without guessing dimensions", async () => {
    const truncated = await parseMetadata(container(box("jxlc", Uint8Array.of(0xff, 0x0a, 0x00))));
    expect(truncated.dimensions).toBeNull();
    expect(truncated.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA" }));

    const fragment = new Uint8Array(4 + 3);
    new DataView(fragment.buffer).setUint32(0, 0);
    fragment.set(codestream(100, 100).subarray(0, 3), 4);
    const contradictory = await parseMetadata(container(box("jxlc", codestream(100, 100)), box("jxlp", fragment)));
    expect(contradictory.dimensions).toBeNull();
    expect(contradictory.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JXL" }));
  });

  it("covers extended and zero-sized boxes plus every partial-stream topology failure", async () => {
    const stream = codestream(320, 240);
    expect((await parseMetadata(container(zeroSizedBox("jxlc", stream)))).dimensions).toEqual({ width: 320, height: 240 });
    expect((await parseMetadata(container(box("jxlc", stream, true)))).dimensions).toEqual({ width: 320, height: 240 });

    const oversized = new Uint8Array(SIGNATURE.length + 16);
    oversized.set(SIGNATURE);
    const oversizedView = new DataView(oversized.buffer);
    oversizedView.setUint32(SIGNATURE.length, 1);
    oversized.set(new TextEncoder().encode("jxlc"), SIGNATURE.length + 4);
    oversizedView.setBigUint64(SIGNATURE.length + 8, 0xffffffffffffffffn);
    const oversizedResult = await parseMetadata(oversized);
    expect(oversizedResult.warnings).toContainEqual(expect.objectContaining({ code: "UNSAFE_OFFSET" }));

    const shortExtended = new Uint8Array(SIGNATURE.length + 12);
    shortExtended.set(SIGNATURE);
    new DataView(shortExtended.buffer).setUint32(SIGNATURE.length, 1);
    shortExtended.set(new TextEncoder().encode("jxlc"), SIGNATURE.length + 4);
    expect((await parseMetadata(shortExtended)).warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JXL" }));

    const fragment = (sequence: number, last: boolean, payload: Uint8Array): Uint8Array => {
      const word = (last ? 0x80000000 : 0) | sequence;
      const sequenceBytes = new Uint8Array(4);
      new DataView(sequenceBytes.buffer).setUint32(0, word >>> 0);
      return box("jxlp", concat(sequenceBytes, payload));
    };
    const missingSequence = await parseMetadata(container(box("jxlp", Uint8Array.of(1, 2, 3))));
    expect(missingSequence.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JXL" }));
    const gap = await parseMetadata(container(fragment(1, true, stream)));
    expect(gap.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JXL" }));
    const twoFinal = await parseMetadata(container(fragment(0, true, stream.subarray(0, 4)), fragment(1, true, stream.subarray(4))));
    expect(twoFinal.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JXL" }));
    const tooMany = await parseMetadata(container(fragment(0, false, stream.subarray(0, 4)), fragment(1, true, stream.subarray(4))), { limits: { maxSegments: 1 } });
    expect(tooMany.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JXL" }));
  });

  it("rejects custom decompressor return shapes, thrown errors, and aborts", async () => {
    const packet = new TextEncoder().encode("<x:xmpmeta/>");
    const input = container(compressedBox("xml ", packet));
    const invalidView = await parseMetadata(input, { jxlBrotliDecompressor: () => new DataView(new ArrayBuffer(2)) as never });
    expect(invalidView.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    const thrown = await parseMetadata(input, { jxlBrotliDecompressor: () => { throw new Error("decoder failure"); } });
    expect(thrown.warnings).toContainEqual(expect.objectContaining({ code: "INVALID_VALUE" }));
    const controller = new AbortController();
    controller.abort();
    await expect(parseMetadata(input, { signal: controller.signal, jxlBrotliDecompressor: () => packet })).rejects.toMatchObject({ code: "ABORTED" });
  });
});
