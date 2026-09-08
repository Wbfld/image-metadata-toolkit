import { describe, expect, it } from "vitest";
import { parseJpeg } from "../src/parsers/jpeg.js";
import { DEFAULT_LIMITS } from "../src/security/limits.js";

const encoder = new TextEncoder();

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function segment(marker: number, payload: Uint8Array): Uint8Array {
  const length = payload.length + 2;
  return concat(Uint8Array.of(0xff, marker, length >>> 8, length & 0xff), payload);
}

function sof(width = 3, height = 2): Uint8Array {
  return segment(0xc0, Uint8Array.of(8, height >>> 8, height & 0xff, width >>> 8, width & 0xff, 1, 1, 0x11, 0));
}

function sos(): Uint8Array {
  return segment(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0));
}

function jpeg(parts: readonly Uint8Array[] = [], scan = Uint8Array.of(1, 2, 3)): Uint8Array {
  return concat(Uint8Array.of(0xff, 0xd8), ...parts, sof(), sos(), scan, Uint8Array.of(0xff, 0xd9));
}

function minimalExif(): Uint8Array {
  return Uint8Array.of(
    ...encoder.encode("Exif\0\0"),
    0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
  );
}

function iptcPayload(): Uint8Array {
  return Uint8Array.of(
    ...encoder.encode("Photoshop 3.0\0"),
    ...encoder.encode("8BIM"),
    0x04, 0x04,
    0, 0,
    0, 0, 0, 3,
    1, 2, 3, 0,
  );
}

describe("JPEG container parsing", () => {
  it("collects bounded JFIF, XMP, IPTC, and incomplete ICC metadata", () => {
    const jfif = segment(0xe0, Uint8Array.of(...encoder.encode("JFIF\0"), 1, 2, 1, 0, 72, 0, 72, 0, 0));
    const xmpPrefix = encoder.encode("http://ns.adobe.com/xap/1.0/\0");
    const input = jpeg([
      jfif,
      segment(0xe1, concat(xmpPrefix, encoder.encode("<x:xmpmeta/>"))),
      segment(0xe1, concat(xmpPrefix, Uint8Array.of(0xc3, 0x28))),
      segment(0xe2, Uint8Array.of(...encoder.encode("ICC_PROFILE\0"), 1, 2, 9, 8)),
      segment(0xed, iptcPayload()),
    ]);

    const result = parseJpeg(input, DEFAULT_LIMITS);

    expect(result.dimensions).toEqual({ width: 3, height: 2 });
    expect(result.jfif).toMatchObject({ version: "1.02", densityUnits: "dpi" });
    expect(result.xmp?.packets).toEqual(["<x:xmpmeta/>"]);
    expect(result.iptc).toEqual({ byteLength: 3 });
    expect(result.icc).toEqual({ byteLength: 2, chunks: 1, complete: false });
    expect(result.warnings.map(({ code }) => code)).toEqual(["INVALID_VALUE", "INVALID_VALUE"]);
  });

  it("parses the first EXIF segment and warns about a duplicate", () => {
    const exif = segment(0xe1, minimalExif());
    const result = parseJpeg(jpeg([exif, exif]), DEFAULT_LIMITS);
    expect(result.exif).not.toBeNull();
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "DUPLICATE_EXIF" }));
  });

  it("skips metadata beyond the aggregate limit but continues to the image", () => {
    const app0 = segment(0xe0, Uint8Array.of(...encoder.encode("JFIF\0"), 1, 2, 0, 0, 1, 0, 1, 0, 0));
    const result = parseJpeg(jpeg([app0]), { ...DEFAULT_LIMITS, maxMetadataBytes: 5 });
    expect(result.dimensions).toEqual({ width: 3, height: 2 });
    expect(result.jfif).toBeNull();
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });

  it("handles stuffed bytes, restart markers, and an in-scan DNL marker", () => {
    const scan = Uint8Array.of(
      1, 0xff, 0x00, 2, 0xff, 0xd0, 3,
      0xff, 0xdc, 0x00, 0x04, 0x00, 0x02,
      4, 5,
    );
    const result = parseJpeg(jpeg([], scan), DEFAULT_LIMITS);
    expect(result.warnings).toEqual([]);
    expect(result.dimensions).toEqual({ width: 3, height: 2 });
  });

  it("validates every frame, not only the first", () => {
    const invalidFrame = segment(0xc2, Uint8Array.of(8, 0, 2, 0, 3, 1));
    const result = parseJpeg(jpeg([sof(), invalidFrame]), DEFAULT_LIMITS);
    expect(result.dimensions).toEqual({ width: 3, height: 2 });
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JPEG" }));
  });

  it("does not silently summarize a JFIF segment with a truncated thumbnail", () => {
    const malformedJfif = segment(
      0xe0,
      Uint8Array.of(...encoder.encode("JFIF\0"), 1, 2, 0, 0, 72, 0, 72, 1, 1),
    );
    const result = parseJpeg(jpeg([malformedJfif]), DEFAULT_LIMITS);

    expect(result.jfif).toBeNull();
    expect(
      result.warnings.some(({ code, message }) => code === "TRUNCATED_DATA" && message.includes("JFIF")),
    ).toBe(true);
  });

  it("warns instead of accepting a Photoshop APP13 resource with a missing pad byte", () => {
    const malformedIptc = Uint8Array.of(
      ...encoder.encode("Photoshop 3.0\0"),
      ...encoder.encode("8BIM"), 0x04, 0x04,
      0, 0,
      0, 0, 0, 3,
      1, 2, 3,
    );
    const result = parseJpeg(jpeg([segment(0xed, malformedIptc)]), DEFAULT_LIMITS);

    expect(result.iptc).toBeNull();
    expect(
      result.warnings.some(({ code, message }) => code === "INVALID_VALUE" && message.includes("Photoshop APP13")),
    ).toBe(true);
  });
});

describe("JPEG malformed-input warnings", () => {
  it.each([
    ["missing SOI", Uint8Array.of(1, 2, 3), "MALFORMED_JPEG"],
    ["raw byte outside scan", Uint8Array.of(0xff, 0xd8, 1), "MALFORMED_JPEG"],
    ["incomplete marker", Uint8Array.of(0xff, 0xd8, 0xff), "TRUNCATED_DATA"],
    ["stuffed zero outside scan", Uint8Array.of(0xff, 0xd8, 0xff, 0x00), "MALFORMED_JPEG"],
    ["restart outside scan", Uint8Array.of(0xff, 0xd8, 0xff, 0xd2), "MALFORMED_JPEG"],
    ["truncated length", Uint8Array.of(0xff, 0xd8, 0xff, 0xe1, 0), "TRUNCATED_DATA"],
    ["short length", Uint8Array.of(0xff, 0xd8, 0xff, 0xe1, 0, 1), "MALFORMED_JPEG"],
    ["segment overrun", Uint8Array.of(0xff, 0xd8, 0xff, 0xe1, 0, 10), "TRUNCATED_DATA"],
    ["no scan", Uint8Array.of(0xff, 0xd8, 0xff, 0xd9), "MALFORMED_JPEG"],
  ] as const)("reports %s", (_name, input, code) => {
    expect(parseJpeg(input, DEFAULT_LIMITS).warnings).toContainEqual(expect.objectContaining({ code }));
  });

  it("reports scan data without an EOI marker", () => {
    const input = concat(Uint8Array.of(0xff, 0xd8), sof(), sos(), Uint8Array.of(1, 2, 0xff));
    const result = parseJpeg(input, DEFAULT_LIMITS);
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "TRUNCATED_DATA", severity: "error" }));
  });

  it("rejects a DNL marker outside scan data", () => {
    const result = parseJpeg(
      concat(Uint8Array.of(0xff, 0xd8), sof(), segment(0xdc, Uint8Array.of(0, 2)), sos(), Uint8Array.of(1, 0xff, 0xd9)),
      DEFAULT_LIMITS,
    );
    expect(result.warnings).toContainEqual(expect.objectContaining({ code: "MALFORMED_JPEG" }));
  });

  it("enforces segment count and payload limits", () => {
    const countLimited = parseJpeg(jpeg([Uint8Array.of(0xff, 0x01)]), { ...DEFAULT_LIMITS, maxSegments: 1 });
    expect(countLimited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));

    const payloadLimited = parseJpeg(jpeg(), { ...DEFAULT_LIMITS, maxSegmentBytes: 5 });
    expect(payloadLimited.warnings).toContainEqual(expect.objectContaining({ code: "LIMIT_EXCEEDED" }));
  });
});
