import { describe, expect, it } from "vitest";

import { parseExif } from "../src/metadata/exif.js";
import { redactBytes } from "../src/privacy/redact.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const encoder = new TextEncoder();

interface Fixture {
  readonly jpeg: Uint8Array;
  readonly scan: Uint8Array;
}

describe("lossless JPEG metadata redaction", () => {
  it("removes an entire EXIF APP1 segment without changing scan bytes", () => {
    const fixture = makeJpeg();
    const before = new Uint8Array(fixture.jpeg);

    const redacted = redactBytes(fixture.jpeg, { remove: ["EXIF"] }, DEFAULT_LIMITS);

    expect(redacted.warnings).toEqual([]);
    expect(redacted.removed).toEqual([{ target: "EXIF", occurrences: 1 }]);
    expect(findAscii(redacted.data, "Exif\0\0")).toBe(-1);
    expect(extractEntropyBytes(redacted.data)).toEqual(fixture.scan);
    expect(fixture.jpeg).toEqual(before);
  });

  it("selectively removes GPS, serial number, and DateTimeOriginal entries", () => {
    const fixture = makeJpeg();

    const redacted = redactBytes(
      fixture.jpeg,
      { remove: ["GPS", "SerialNumber", "DateTimeOriginal"] },
      DEFAULT_LIMITS,
    );

    expect(redacted.warnings).toEqual([]);
    expect(redacted.removed).toEqual([
      { target: "GPS", occurrences: 7 },
      { target: "SerialNumber", occurrences: 1 },
      { target: "DateTimeOriginal", occurrences: 1 },
    ]);
    expect(ifdTags(redacted.data, "IFD0")).toEqual([0x010f, 0x0132, 0x8769]);
    expect(ifdTags(redacted.data, "ExifIFD")).toEqual([]);
    expect(findAscii(redacted.data, "ABC123\0")).toBe(-1);
    expect(findAscii(redacted.data, "2025:12:31 23:59:58\0")).toBe(-1);
    expect(findAscii(redacted.data, "CameraCo\0")).toBeGreaterThan(-1);
    expect(extractEntropyBytes(redacted.data)).toEqual(fixture.scan);
  });

  it.each([
    ["Make", 0x010f],
    ["Model", 0x0110],
    ["Orientation", 0x0112],
    ["DateTime", 0x0132],
    ["DateTimeOriginal", 0x9003],
    ["ExposureTime", 0x829a],
    ["FNumber", 0x829d],
    ["ISOSpeedRatings", 0x8827],
    ["Flash", 0x9209],
    ["FocalLength", 0x920a],
    ["Copyright", 0x8298],
    ["Artist", 0x013b],
    ["Software", 0x0131],
    ["SerialNumber", 0xa435],
  ] as const)("removes the normalized %s tag selectively", (target, tag) => {
    const fixture = makeSingleTagJpeg(tag);

    const redacted = redactBytes(fixture.jpeg, { remove: [target] }, DEFAULT_LIMITS);

    expect(redacted.warnings).toEqual([]);
    expect(redacted.removed).toEqual([{ target, occurrences: 1 }]);
    expect(ifdTags(redacted.data, "IFD0")).toEqual([]);
    expect(extractEntropyBytes(redacted.data)).toEqual(fixture.scan);
  });

  it("lets preserve rules win over category and segment removal", () => {
    const fixture = makeJpeg();

    const redacted = redactBytes(
      fixture.jpeg,
      {
        remove: ["GPS", "DateTimeOriginal", "ICC"],
        preserve: ["GPSLatitude", "ICC"],
      },
      DEFAULT_LIMITS,
    );

    expect(redacted.warnings).toEqual([]);
    expect(redacted.removed).toEqual([
      { target: "GPS", occurrences: 4 },
      { target: "DateTimeOriginal", occurrences: 1 },
    ]);
    expect(ifdTags(redacted.data, "IFD0")).toContain(0x8825);
    expect(ifdTags(redacted.data, "GPSIFD")).toEqual([0x0001, 0x0002]);
    expect(findAscii(redacted.data, "ICC_PROFILE\0")).toBeGreaterThan(-1);
    expect(extractEntropyBytes(redacted.data)).toEqual(fixture.scan);
  });

  it("removes explicit XMP, IPTC, ICC, and JFIF segments", () => {
    const fixture = makeJpeg();

    const redacted = redactBytes(
      fixture.jpeg,
      { remove: ["XMP", "IPTC", "ICC", "JFIF"] },
      DEFAULT_LIMITS,
    );

    expect(redacted.warnings).toEqual([]);
    expect(redacted.removed).toEqual([
      { target: "XMP", occurrences: 1 },
      { target: "IPTC", occurrences: 1 },
      { target: "ICC", occurrences: 1 },
      { target: "JFIF", occurrences: 1 },
    ]);
    expect(findAscii(redacted.data, "Exif\0\0")).toBeGreaterThan(-1);
    expect(findAscii(redacted.data, "http://ns.adobe.com/xap/1.0/\0")).toBe(-1);
    expect(findAscii(redacted.data, "ICC_PROFILE\0")).toBe(-1);
    expect(findAscii(redacted.data, "JFIF\0")).toBe(-1);
    expect(extractEntropyBytes(redacted.data)).toEqual(fixture.scan);
  });

  it("supports AllMetadata while preserving a requested metadata class", () => {
    const fixture = makeJpeg();

    const redacted = redactBytes(
      fixture.jpeg,
      { remove: ["AllMetadata"], preserve: ["ICC"] },
      DEFAULT_LIMITS,
    );

    expect(redacted.warnings).toEqual([]);
    expect(redacted.removed).toEqual([{ target: "AllMetadata", occurrences: 5 }]);
    expect(findAscii(redacted.data, "Exif\0\0")).toBe(-1);
    expect(findAscii(redacted.data, "ICC_PROFILE\0")).toBeGreaterThan(-1);
    expect(findAscii(redacted.data, "JFIF\0")).toBe(-1);
    expect(extractEntropyBytes(redacted.data)).toEqual(fixture.scan);
  });

  it("preserves unrecognized APP13 and coding-relevant APP14 markers", () => {
    const fixture = makeJpeg();
    const sos = findMarker(fixture.jpeg, 0xda);
    const malformedIptc = Uint8Array.of(
      ...encoder.encode("Photoshop 3.0\0"),
      ...encoder.encode("8BIM"), 0x04, 0x04,
      0, 0,
      0, 0, 0, 3,
      1, 2, 3,
    );
    const extra = concat(
      makeSegment(0xed, encoder.encode("not an IPTC resource")),
      makeSegment(0xed, malformedIptc),
      makeSegment(0xee, concat(encoder.encode("Adobe"), Uint8Array.of(0, 100, 0, 0, 0, 0, 0))),
    );
    const input = concat(fixture.jpeg.subarray(0, sos), extra, fixture.jpeg.subarray(sos));

    const redacted = redactBytes(input, { remove: ["AllMetadata"] }, DEFAULT_LIMITS);

    expect(redacted.warnings).toEqual([]);
    expect(findAscii(redacted.data, "not an IPTC resource")).toBeGreaterThan(-1);
    expect(findAscii(redacted.data, "Photoshop 3.0\0")).toBeGreaterThan(-1);
    expect(findAscii(redacted.data, "Adobe")).toBeGreaterThan(-1);
    expect(extractEntropyBytes(redacted.data)).toEqual(fixture.scan);
  });

  it("keeps a preserved IFD1 field reachable during broad EXIF removal", () => {
    const tiff = new Uint8Array(64);
    tiff.set([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]);
    write16(tiff, 8, 1);
    writeInlineAscii(tiff, 10, 0x010f, "A\0");
    write32(tiff, 22, 26);
    write16(tiff, 26, 1);
    writeEntry(tiff, 28, 0x0112, 3, 1, 6);
    write32(tiff, 40, 0);
    tiff.set(encoder.encode("ORPHANED-THUMBNAIL"), 44);
    const input = concat(
      Uint8Array.of(0xff, 0xd8),
      makeSegment(0xe1, concat(encoder.encode("Exif\0\0"), tiff)),
      makeSof(),
      makeSegment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0)),
      Uint8Array.of(1, 2, 3, 0xff, 0xd9),
    );

    const redacted = redactBytes(
      input,
      { remove: ["EXIF"], preserve: ["Orientation"] },
      DEFAULT_LIMITS,
    );
    const tiffStart = findAscii(redacted.data, "Exif\0\0") + 6;
    const parsed = parseExif(redacted.data.subarray(tiffStart), DEFAULT_LIMITS);

    expect(redacted.warnings).toEqual([]);
    expect(parsed.exif?.fields).toContainEqual(
      expect.objectContaining({ ifd: "IFD1", name: "Orientation", raw: 6 }),
    );
    expect(findAscii(redacted.data, "ORPHANED-THUMBNAIL")).toBe(-1);
  });

  it("returns an untouched copy when JPEG structure is truncated", () => {
    const malformed = Uint8Array.of(0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10, 0x45, 0x78);

    const redacted = redactBytes(malformed, { remove: ["EXIF"] }, DEFAULT_LIMITS);

    expect(redacted.data).not.toBe(malformed);
    expect(redacted.data).toEqual(malformed);
    expect(redacted.removed).toEqual([]);
    expect(redacted.warnings).toHaveLength(1);
    expect(redacted.warnings[0]?.code).toBe("TRUNCATED_DATA");
  });

  it("fails atomically for a JPEG with no scan or an invalid SOS header", () => {
    const exif = makeSegment(0xe1, concat(encoder.encode("Exif\0\0"), makeTiff()));
    const noScan = concat(Uint8Array.of(0xff, 0xd8), exif, makeSof(), Uint8Array.of(0xff, 0xd9));
    const invalidScan = concat(
      Uint8Array.of(0xff, 0xd8),
      exif,
      makeSof(),
      makeSegment(0xda, new Uint8Array()),
      Uint8Array.of(0xff, 0xd9),
    );

    for (const malformed of [noScan, invalidScan]) {
      const redacted = redactBytes(malformed, { remove: ["EXIF"] }, DEFAULT_LIMITS);
      expect(redacted.data).toEqual(malformed);
      expect(redacted.removed).toEqual([]);
      expect(redacted.warnings[0]?.code).toBe("MALFORMED_JPEG");
    }
  });

  it("treats a truncated SOI prefix as a malformed JPEG rather than another format", () => {
    const malformed = Uint8Array.of(0xff, 0xd8);

    const redacted = redactBytes(malformed, { remove: ["AllMetadata"] }, DEFAULT_LIMITS);

    expect(redacted.format).toBe("jpeg");
    expect(redacted.data).toEqual(malformed);
    expect(redacted.warnings[0]?.code).toBe("TRUNCATED_DATA");
  });

  it("fails atomically when selective redaction encounters an unsafe EXIF pointer", () => {
    const fixture = makeJpeg();
    const malformed = new Uint8Array(fixture.jpeg);
    const gpsPointerValue = findTiffEntry(malformed, "IFD0", 0x8825) + 8;
    malformed.set([0xf0, 0xff, 0xff, 0xff], gpsPointerValue);
    const before = new Uint8Array(malformed);

    const redacted = redactBytes(malformed, { remove: ["GPS"] }, DEFAULT_LIMITS);

    expect(redacted.data).toEqual(before);
    expect(redacted.removed).toEqual([]);
    expect(redacted.warnings).toHaveLength(1);
    expect(["TRUNCATED_DATA", "UNSAFE_OFFSET"]).toContain(redacted.warnings[0]?.code);
  });

  it("rejects cyclic IFD links atomically", () => {
    const fixture = makeJpeg();
    const malformed = new Uint8Array(fixture.jpeg);
    const exifIdentifier = findAscii(malformed, "Exif\0\0");
    const tiffStart = exifIdentifier + 6;
    const exifOffset = read32(malformed, findTiffEntry(malformed, "IFD0", 0x8769) + 8);
    const exifCount = read16(malformed, tiffStart + exifOffset);
    const exifNextPointer = tiffStart + exifOffset + 2 + exifCount * 12;
    write32(malformed, exifNextPointer, exifOffset);
    const before = new Uint8Array(malformed);

    const redacted = redactBytes(
      malformed,
      { remove: ["DateTimeOriginal"] },
      DEFAULT_LIMITS,
    );

    expect(redacted.data).toEqual(before);
    expect(redacted.removed).toEqual([]);
    expect(redacted.warnings[0]?.code).toBe("MALFORMED_EXIF");
    expect(redacted.warnings[0]?.message).toContain("cycle");
  });

  it("skips recognized non-JPEG formats without mutating them", () => {
    const png = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

    const redacted = redactBytes(png, { remove: ["AllMetadata"] }, DEFAULT_LIMITS);

    expect(redacted.format).toBe("png");
    expect(redacted.data).not.toBe(png);
    expect(redacted.data).toEqual(png);
    expect(redacted.removed).toEqual([]);
    expect(redacted.warnings[0]?.code).toBe("REDACTION_SKIPPED");
  });
});

function makeJpeg(): Fixture {
  const scan = Uint8Array.of(0x11, 0x22, 0xff, 0x00, 0x33, 0xff, 0xd0, 0x44, 0x55);
  const segments = [
    makeSegment(0xe0, concat(encoder.encode("JFIF\0"), Uint8Array.of(1, 2, 0, 0, 1, 0, 1, 0, 0))),
    makeSegment(0xe1, concat(encoder.encode("Exif\0\0"), makeTiff())),
    makeSegment(
      0xe1,
      concat(encoder.encode("http://ns.adobe.com/xap/1.0/\0"), encoder.encode("<x:xmpmeta/>") ),
    ),
    makeSegment(0xe2, concat(encoder.encode("ICC_PROFILE\0"), Uint8Array.of(1, 1, 9, 8, 7))),
    makeSegment(
      0xed,
      concat(
        encoder.encode("Photoshop 3.0\0"),
        encoder.encode("8BIM"),
        Uint8Array.of(0x04, 0x04, 0, 0, 0, 0, 0, 3, 1, 2, 3, 0),
      ),
    ),
    makeSegment(0xfe, encoder.encode("private comment")),
    makeSegment(0xdb, Uint8Array.of(0, 1, 2, 3)),
    makeSof(),
    makeSegment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0)),
  ];
  return {
    jpeg: concat(Uint8Array.of(0xff, 0xd8), ...segments, scan, Uint8Array.of(0xff, 0xd9)),
    scan,
  };
}

function makeSingleTagJpeg(tag: number): Fixture {
  const tiff = new Uint8Array(26);
  tiff.set([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]);
  write16(tiff, 8, 1);
  writeEntry(tiff, 10, tag, 1, 1, 42);
  write32(tiff, 22, 0);
  const scan = Uint8Array.of(1, 2, 3, 0xff, 0x00, 4);
  return {
    jpeg: concat(
      Uint8Array.of(0xff, 0xd8),
      makeSegment(0xe1, concat(encoder.encode("Exif\0\0"), tiff)),
      makeSof(),
      makeSegment(0xda, Uint8Array.of(1, 1, 0, 0, 0x3f, 0)),
      scan,
      Uint8Array.of(0xff, 0xd9),
    ),
    scan,
  };
}

function makeTiff(): Uint8Array {
  const ifd0Offset = 8;
  const exifOffset = 62;
  const gpsOffset = 92;
  const makeOffset = 170;
  const dateTimeOffset = 179;
  const originalDateOffset = 199;
  const serialOffset = 219;
  const latitudeOffset = 226;
  const longitudeOffset = 250;
  const altitudeOffset = 274;
  const bytes = new Uint8Array(282);

  bytes.set([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]);
  write16(bytes, ifd0Offset, 4);
  writeEntry(bytes, ifd0Offset + 2, 0x010f, 2, 9, makeOffset);
  writeEntry(bytes, ifd0Offset + 14, 0x0132, 2, 20, dateTimeOffset);
  writeEntry(bytes, ifd0Offset + 26, 0x8769, 4, 1, exifOffset);
  writeEntry(bytes, ifd0Offset + 38, 0x8825, 4, 1, gpsOffset);
  write32(bytes, ifd0Offset + 50, 0);

  write16(bytes, exifOffset, 2);
  writeEntry(bytes, exifOffset + 2, 0x9003, 2, 20, originalDateOffset);
  writeEntry(bytes, exifOffset + 14, 0xa431, 2, 7, serialOffset);
  write32(bytes, exifOffset + 26, 0);

  write16(bytes, gpsOffset, 6);
  writeInlineAscii(bytes, gpsOffset + 2, 0x0001, "N\0");
  writeEntry(bytes, gpsOffset + 14, 0x0002, 5, 3, latitudeOffset);
  writeInlineAscii(bytes, gpsOffset + 26, 0x0003, "W\0");
  writeEntry(bytes, gpsOffset + 38, 0x0004, 5, 3, longitudeOffset);
  writeEntry(bytes, gpsOffset + 50, 0x0005, 1, 1, 1);
  writeEntry(bytes, gpsOffset + 62, 0x0006, 5, 1, altitudeOffset);
  write32(bytes, gpsOffset + 74, 0);

  bytes.set(encoder.encode("CameraCo\0"), makeOffset);
  bytes.set(encoder.encode("2026:01:02 03:04:05\0"), dateTimeOffset);
  bytes.set(encoder.encode("2025:12:31 23:59:58\0"), originalDateOffset);
  bytes.set(encoder.encode("ABC123\0"), serialOffset);
  writeRationals(bytes, latitudeOffset, [[51, 1], [30, 1], [0, 1]]);
  writeRationals(bytes, longitudeOffset, [[0, 1], [7, 1], [30, 1]]);
  writeRationals(bytes, altitudeOffset, [[123, 10]]);
  return bytes;
}

function makeSegment(marker: number, payload: Uint8Array): Uint8Array {
  const length = payload.length + 2;
  return concat(
    Uint8Array.of(0xff, marker, (length >>> 8) & 0xff, length & 0xff),
    payload,
  );
}

function makeSof(): Uint8Array {
  return makeSegment(0xc0, Uint8Array.of(8, 0, 2, 0, 2, 1, 1, 0x11, 0));
}

function writeEntry(
  bytes: Uint8Array,
  offset: number,
  tag: number,
  type: number,
  count: number,
  value: number,
): void {
  write16(bytes, offset, tag);
  write16(bytes, offset + 2, type);
  write32(bytes, offset + 4, count);
  write32(bytes, offset + 8, value);
}

function writeInlineAscii(bytes: Uint8Array, offset: number, tag: number, value: string): void {
  writeEntry(bytes, offset, tag, 2, value.length, 0);
  bytes.set(encoder.encode(value), offset + 8);
}

function writeRationals(
  bytes: Uint8Array,
  offset: number,
  values: readonly (readonly [number, number])[],
): void {
  for (let index = 0; index < values.length; index += 1) {
    const pair = values[index];
    if (pair === undefined) throw new Error("missing rational fixture value");
    write32(bytes, offset + index * 8, pair[0]);
    write32(bytes, offset + index * 8 + 4, pair[1]);
  }
}

function write16(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

function write32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function read16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) + (bytes[offset + 1] ?? 0) * 0x100;
}

function read32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) +
    (bytes[offset + 1] ?? 0) * 0x100 +
    (bytes[offset + 2] ?? 0) * 0x10000 +
    (bytes[offset + 3] ?? 0) * 0x1000000
  );
}

function ifdTags(bytes: Uint8Array, kind: "IFD0" | "ExifIFD" | "GPSIFD"): number[] {
  const tiffStart = findAscii(bytes, "Exif\0\0") + 6;
  if (tiffStart < 6) throw new Error("missing EXIF fixture segment");
  let relativeOffset = read32(bytes, tiffStart + 4);
  if (kind !== "IFD0") {
    const pointerTag = kind === "ExifIFD" ? 0x8769 : 0x8825;
    const entry = findEntryAt(bytes, tiffStart, relativeOffset, pointerTag);
    relativeOffset = read32(bytes, entry + 8);
  }
  const count = read16(bytes, tiffStart + relativeOffset);
  const tags: number[] = [];
  for (let index = 0; index < count; index += 1) {
    tags.push(read16(bytes, tiffStart + relativeOffset + 2 + index * 12));
  }
  return tags;
}

function findTiffEntry(
  bytes: Uint8Array,
  kind: "IFD0" | "ExifIFD" | "GPSIFD",
  tag: number,
): number {
  const tiffStart = findAscii(bytes, "Exif\0\0") + 6;
  let relativeOffset = read32(bytes, tiffStart + 4);
  if (kind !== "IFD0") {
    const pointer = findEntryAt(bytes, tiffStart, relativeOffset, kind === "ExifIFD" ? 0x8769 : 0x8825);
    relativeOffset = read32(bytes, pointer + 8);
  }
  return findEntryAt(bytes, tiffStart, relativeOffset, tag);
}

function findEntryAt(
  bytes: Uint8Array,
  tiffStart: number,
  relativeOffset: number,
  tag: number,
): number {
  const count = read16(bytes, tiffStart + relativeOffset);
  for (let index = 0; index < count; index += 1) {
    const entry = tiffStart + relativeOffset + 2 + index * 12;
    if (read16(bytes, entry) === tag) return entry;
  }
  throw new Error(`missing TIFF tag ${tag.toString(16)}`);
}

function findMarker(bytes: Uint8Array, target: number): number {
  let cursor = 2;
  while (cursor + 1 < bytes.length) {
    if (bytes[cursor] !== 0xff) throw new Error("invalid JPEG fixture marker");
    const marker = bytes[cursor + 1];
    if (marker === target) return cursor;
    if (marker === 0xd9 || marker === 0x01 || (marker !== undefined && marker >= 0xd0 && marker <= 0xd7)) {
      cursor += 2;
      continue;
    }
    const length = ((bytes[cursor + 2] ?? 0) << 8) | (bytes[cursor + 3] ?? 0);
    cursor += 2 + length;
  }
  throw new Error(`missing JPEG marker ${target.toString(16)}`);
}

function extractEntropyBytes(bytes: Uint8Array): Uint8Array {
  let cursor = 2;
  while (cursor < bytes.length) {
    if (bytes[cursor] !== 0xff) throw new Error("invalid JPEG fixture");
    const marker = bytes[cursor + 1];
    if (marker === 0xd9) return new Uint8Array();
    const length = ((bytes[cursor + 2] ?? 0) << 8) | (bytes[cursor + 3] ?? 0);
    const end = cursor + 2 + length;
    if (marker === 0xda) {
      let scanEnd = end;
      while (scanEnd + 1 < bytes.length) {
        if (bytes[scanEnd] !== 0xff) {
          scanEnd += 1;
          continue;
        }
        const code = bytes[scanEnd + 1];
        if (code === 0x00 || (code !== undefined && code >= 0xd0 && code <= 0xd7)) {
          scanEnd += 2;
          continue;
        }
        return bytes.slice(end, scanEnd);
      }
      throw new Error("unterminated JPEG fixture scan");
    }
    cursor = end;
  }
  throw new Error("missing JPEG fixture scan");
}

function findAscii(bytes: Uint8Array, value: string): number {
  const needle = encoder.encode(value);
  outer: for (let offset = 0; offset <= bytes.length - needle.length; offset += 1) {
    for (let index = 0; index < needle.length; index += 1) {
      if (bytes[offset + index] !== needle[index]) continue outer;
    }
    return offset;
  }
  return -1;
}

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
