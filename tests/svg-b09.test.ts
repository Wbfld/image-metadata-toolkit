import { describe, expect, it } from "vitest";

import { parseMetadata } from "../src/index.js";
import { parseSvg } from "../src/parsers/svg.js";
import { resolveLimits } from "../src/security/limits.js";

const encoder = new TextEncoder();
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const SVG = "http://www.w3.org/2000/svg";
const packet = `<rdf:RDF xmlns:rdf="${RDF}" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Description><dc:format>image/svg+xml</dc:format></rdf:Description></rdf:RDF>`;
const document = `<svg xmlns="${SVG}"><metadata>${packet}</metadata><rect width="1" height="1"/></svg>`;

describe("B09 SVG metadata inventory", () => {
  it("detects an SVG root and retains decoded RDF/XML with byte provenance", async () => {
    const result = await parseMetadata(encoder.encode(document));
    expect(result.format).toBe("svg");
    expect(result.mimeType).toBe("image/svg+xml");
    expect(result.container).toBe("svg");
    expect(result.xmp?.packets).toEqual([packet]);
    expect(result.xmp?.packetProvenance).toHaveLength(1);
    const provenance = result.blocks.find((block) => block.family === "XMP" && block.status === "decoded");
    expect(provenance).toBeDefined();
    expect(provenance?.container).toBe("SVG metadata RDF/XML");
    expect(provenance?.offset).toBeGreaterThanOrEqual(0);
    expect(provenance?.length).toBe(encoder.encode(packet).byteLength);
    expect(result.coverage.wholeFile).toBe("complete");
  });

  it("preserves metadata that is not RDF/XML as fail-closed opaque content", async () => {
    const result = await parseMetadata(encoder.encode(`<svg xmlns="${SVG}"><metadata><private:workflow xmlns:private="urn:test">secret</private:workflow></metadata></svg>`));
    expect(result.xmp).toBeNull();
    expect(result.blocks).toEqual(expect.arrayContaining([expect.objectContaining({ family: "Unknown", status: "opaque", sensitivity: "high" })]));
    expect(result.coverage.wholeFile).toBe("opaque");
  });

  it("records XMP selection skipping without inspecting an RDF packet", async () => {
    const result = await parseMetadata(encoder.encode(document), { select: { groups: ["Dimensions"] } });
    expect(result.xmp).toBeNull();
    expect(result.blocks).toEqual(expect.arrayContaining([expect.objectContaining({ family: "XMP", status: "skipped" })]));
    expect(result.coverage.wholeFile).toBe("skipped-by-selection");
  });

  it("rejects malformed XML, unsafe declarations, invalid UTF-8, and unclosed elements", async () => {
    for (const input of [
      `<svg xmlns="${SVG}"><metadata>${packet}</svg>`,
      `<!DOCTYPE svg><svg xmlns="${SVG}"/>`,
    ]) {
      const result = await parseMetadata(encoder.encode(input));
      expect(result.completeness.complete).toBe(false);
      expect(result.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_VALUE", severity: "error" })]));
    }
    const invalid = await parseMetadata(Uint8Array.from([0x3c, 0x73, 0x76, 0x67, 0xff, 0x3e]));
    expect(invalid.format).toBe("unknown");
  });

  it("enforces element, nesting, packet, and metadata byte limits", async () => {
    const deep = `<svg xmlns="${SVG}"><a><b><c/></b></a></svg>`;
    const nested = await parseMetadata(encoder.encode(deep), { limits: { maxXmpDepth: 2 } });
    expect(nested.completeness.complete).toBe(false);
    expect(nested.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_VALUE" })]));
    const limited = await parseMetadata(encoder.encode(document), { limits: { maxMetadataBytes: 8 } });
    expect(limited.xmp).toBeNull();
    expect(limited.blocks).toEqual(expect.arrayContaining([expect.objectContaining({ family: "XMP", status: "partial", warningCodes: ["LIMIT_EXCEEDED"] })]));
    expect(limited.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "LIMIT_EXCEEDED" })]));
    const opaqueLimited = await parseMetadata(encoder.encode(`<svg xmlns="${SVG}"><metadata>${"x".repeat(64)}</metadata></svg>`), { limits: { maxMetadataBytes: 16 } });
    expect(opaqueLimited.blocks).toEqual(expect.arrayContaining([expect.objectContaining({ family: "Unknown", status: "partial", warningCodes: ["LIMIT_EXCEEDED"] })]));
  });

  it("rejects multiple roots and trailing content rather than accepting an ambiguous document", async () => {
    for (const input of [`<svg xmlns="${SVG}"/><svg xmlns="${SVG}"/>`, `<svg xmlns="${SVG}"/>trailing`]) {
      const result = await parseMetadata(encoder.encode(input));
      expect(result.completeness.complete).toBe(false);
      expect(result.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_VALUE", severity: "error" })]));
    }
  });

  it("covers bounded SVG lexical constructs, namespace failures, and packet limits", () => {
    const lexical = `<svg xmlns="${SVG}"><metadata><!-- comment --><![CDATA[ignored]]><?packet value="a>b"?>${packet}</metadata></svg>`;
    const lexicalResult = parseSvg(encoder.encode(lexical), resolveLimits());
    expect(lexicalResult.xmp?.packets).toEqual([packet]);

    const selfClosing = parseSvg(encoder.encode(`<svg xmlns="${SVG}"><metadata/></svg>`), resolveLimits());
    expect(selfClosing.blocks).toEqual(expect.arrayContaining([expect.objectContaining({ family: "Unknown", status: "opaque" })]));

    const invalidDocuments = [
      `<svg xmlns="urn:not-svg"/>`,
      `<svg xmlns="${SVG}"><metadata><!-- unterminated</metadata></svg>`,
      `<svg xmlns="${SVG}"><metadata><![CDATA[unterminated</metadata></svg>`,
      `<svg xmlns="${SVG}"><metadata><?unterminated</metadata></svg>`,
      `<svg xmlns="${SVG}"><metadata><broken</metadata></svg>`,
      `<svg xmlns="${SVG}"><metadata></broken></svg>`,
      `<svg xmlns="${SVG}"><metadata><x:p xmlns:x="${SVG}">x</x:p></metadata>`,
    ];
    for (const input of invalidDocuments) {
      const result = parseSvg(encoder.encode(input), resolveLimits());
      expect(result.warnings.length, input).toBeGreaterThan(0);
      expect(result.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_VALUE" })]));
    }

    const twice = `<svg xmlns="${SVG}"><metadata>${packet}${packet}</metadata></svg>`;
    const packetLimited = parseSvg(encoder.encode(twice), resolveLimits({ maxXmpPackets: 1 }));
    expect(packetLimited.blocks).toEqual(expect.arrayContaining([expect.objectContaining({ family: "XMP", status: "partial", warningCodes: ["LIMIT_EXCEEDED"] })]));
    expect(packetLimited.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "LIMIT_EXCEEDED" })]));

    const attributeLimited = `<svg xmlns="${SVG}" ${Array.from({ length: 5 }, (_, index) => `xmlns:p${index}="urn:p${index}"`).join(" ")}/>`;
    const attributeResult = parseSvg(encoder.encode(attributeLimited), resolveLimits({ maxXmpAttributes: 2 }));
    expect(attributeResult.warnings.length).toBeGreaterThan(0);
    expect(attributeResult.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INVALID_VALUE" })]));
  });
});
