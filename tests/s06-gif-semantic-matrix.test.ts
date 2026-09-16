import { describe, expect, it } from "vitest";

import { parseGif } from "../src/parsers/gif.js";
import { resolveLimits } from "../src/security/limits.js";
import { resolveSelection } from "../src/selection.js";

const encoder = new TextEncoder();

function subBlocks(bytes: Uint8Array): Uint8Array {
  return Uint8Array.from([bytes.length, ...bytes, 0]);
}

function application(identifier: string, payload: Uint8Array): Uint8Array {
  return Uint8Array.from([0x21, 0xff, 11, ...encoder.encode(identifier), ...subBlocks(payload)]);
}

function comment(payload: Uint8Array): Uint8Array {
  return Uint8Array.from([0x21, 0xfe, ...subBlocks(payload)]);
}

function image(localTable: boolean): Uint8Array {
  const descriptor = Uint8Array.from([0x2c, 0, 0, 0, 0, 2, 0, 2, 0, localTable ? 0x80 : 0]);
  const table = localTable ? Uint8Array.from([0, 0, 0, 255, 255, 255]) : new Uint8Array();
  return Uint8Array.from([...descriptor, ...table, 2, 1, 0x44, 0]);
}

function fixture(): Uint8Array {
  const header = Uint8Array.from([...encoder.encode("GIF89a"), 2, 0, 2, 0, 0x80, 0, 0, 0, 0, 0, 255, 255, 255]);
  const loop = application("NETSCAPE2.0", Uint8Array.of(1, 2, 0));
  const alternateLoop = application("ANIMEXTS1.0", Uint8Array.of(1, 3, 0));
  const xmp = application("XMP DataXMP", Uint8Array.from([...encoder.encode("<x:xmpmeta/>"), 1]));
  const gce = Uint8Array.from([0x21, 0xf9, 4, 0, 0, 0, 0, 0]);
  const generic = Uint8Array.from([0x21, 0x01, 2, 1, 2, 1, 3, 0]);
  return Uint8Array.from([...header, ...loop, ...alternateLoop, ...xmp, ...comment(encoder.encode("comment")), ...gce, ...generic, ...image(true), 0x3b]);
}

describe("S06 GIF semantic and extension matrix", () => {
  it("retains frames, local/global tables, loop metadata, comments, XMP, and extension provenance", () => {
    const result = parseGif(fixture(), resolveLimits({ maxMetadataBytes: 4096, maxSegments: 64 }), resolveSelection(undefined));
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "FrameCount", value: 1 }),
      expect.objectContaining({ name: "LoopCount", value: 3 }),
      expect.objectContaining({ name: "Comment", value: "comment" }),
    ]));
    expect(result.xmp?.packets).toEqual(["<x:xmpmeta/>"]);
    expect(result.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ family: "XMP", status: "decoded" }),
      expect.objectContaining({ family: "Unknown", status: "decoded" }),
    ]));
    expect(result.warnings).toEqual([]);
  });

  it("keeps optional comment and XMP payloads skipped when their groups are not selected", () => {
    const result = parseGif(fixture(), resolveLimits(), resolveSelection({ groups: ["Dimensions"] }));
    expect(result.dimensions).toEqual({ width: 2, height: 2 });
    expect(result.xmp).toBeNull();
    expect(result.fields.some(({ name }) => name === "Comment")).toBe(false);
    expect(result.blocks?.filter(({ status }) => status === "skipped").length).toBeGreaterThanOrEqual(2);
  });

  it("fails closed for invalid introducers, truncated tables, and malformed sub-blocks", () => {
    const base = fixture();
    const malformed = [
      base.slice(0, 12),
      Uint8Array.from([...base.slice(0, 13), 0x2c, 0]),
      Uint8Array.from([...base.slice(0, 13), 0x21, 0xff, 10]),
      Uint8Array.from([...base.slice(0, 13), 0x21, 0xfe, 4, 1]),
      Uint8Array.from([...base.slice(0, 13), 0x20]),
    ];
    for (const value of malformed) {
      const result = parseGif(value, resolveLimits({ maxSegments: 2, maxWarnings: 4 }), resolveSelection(undefined));
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeLessThanOrEqual(4);
      expect(result.warnings.every(({ code }) => /^[A-Z][A-Z0-9_]+$/u.test(code))).toBe(true);
    }
  });
});
