import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { parseMetadata } from "../src/index.js";
import { completeMetadataResult, completeRedactionResult } from "../src/result.js";
import type {
  ImageFormat,
  MetadataBlock,
  MetadataBlockStatus,
  MetadataResult,
  ParsedMetadataResult,
  RedactionTarget,
  SurgeryResult,
} from "../src/types.js";

const fixture = new URL("./fixtures/jpeg-exif-little-endian.jpg", import.meta.url);

function parserInput(result: MetadataResult, overrides: Partial<ParsedMetadataResult> = {}): ParsedMetadataResult {
  const parsed: Record<string, unknown> = { ...result };
  for (const key of ["blocks", "completeness", "container", "coverage", "fileKind", "raw"]) Reflect.deleteProperty(parsed, key);
  return { ...(parsed as ParsedMetadataResult), ...overrides };
}

function block(id: string, status: MetadataBlockStatus): MetadataBlock {
  return {
    id,
    family: "EXIF",
    container: `fixture-${id}`,
    status,
    offset: 0,
    length: 1,
    associatedImage: null,
    sensitivity: "none",
    warningCodes: [],
  };
}

function surgery(overrides: Partial<SurgeryResult> = {}): SurgeryResult {
  return {
    data: Uint8Array.of(0xff, 0xd8, 0xff, 0xd9),
    format: "jpeg",
    removed: [],
    warnings: [],
    ...overrides,
  };
}

describe("public result completion contracts", () => {
  it("retains every block coverage state and emits stable partial-scope reasons", async () => {
    const parsed = await parseMetadata(new Uint8Array(await readFile(fixture)));
    const completed = completeMetadataResult(parserInput(parsed, {
      blocks: [
        block("decoded", "decoded"),
        block("skipped", "skipped"),
        block("partial", "partial"),
        block("malformed", "malformed"),
        block("opaque", "opaque"),
      ],
    }), "partial");

    expect(completed.blocks.map(({ coverage }) => coverage)).toEqual([
      "complete",
      "skipped-by-selection",
      "partial",
      "malformed",
      "opaque",
    ]);
    expect(completed.coverage).toMatchObject({
      requested: "malformed",
      wholeFile: "malformed",
      unclassifiedBlockIds: ["skipped", "partial", "malformed", "opaque"],
    });
    expect(completed.coverage.reasons.map(({ code }) => code)).toEqual([
      "REQUEST_SCOPE_LIMITED",
      "BLOCK_SKIPPED_BY_SELECTION",
      "BLOCK_PARTIAL",
      "BLOCK_MALFORMED",
      "BLOCK_OPAQUE",
    ]);
    expect(completed.coverage.reasons[0]?.message).toBe("The requested operation inspected a bounded scope.");
  });

  it.each([
    { format: "heif", expectedContainer: "iso-bmff", expectedFileKind: "heif" },
    { format: "avif", expectedContainer: "iso-bmff", expectedFileKind: "avif" },
    { format: "cr3", expectedContainer: "iso-bmff", expectedFileKind: "cr3" },
    { format: "raf", expectedContainer: "raf", expectedFileKind: "raf" },
    { format: "png", expectedContainer: "png", expectedFileKind: "png" },
  ] as const)("infers $expectedContainer container identity for $format", async ({ format, expectedContainer, expectedFileKind }) => {
    const parsed = await parseMetadata(new Uint8Array(await readFile(fixture)));
    const completed = completeMetadataResult(parserInput(parsed, {
      format: format as ImageFormat,
      blocks: [],
      warnings: [],
    }));

    expect(completed.container).toBe(expectedContainer);
    expect(completed.fileKind).toBe(expectedFileKind);
    expect(completed.coverage).toMatchObject({ requested: "complete", wholeFile: "complete" });
  });

  it("preserves explicit BigTIFF identity, range counters, telemetry, and complete coverage", async () => {
    const parsed = await parseMetadata(new Uint8Array(await readFile(fixture)));
    const telemetry = { readRequests: 1, bytesRead: 8, cacheHits: 0, coalescedReads: 0, cacheBytes: 8 } as const;
    const completed = completeMetadataResult(parserInput(parsed, {
      format: "tiff",
      container: "bigtiff",
      blocks: [block("decoded", "decoded")],
      warnings: [],
    }), "full", [], { bytesRead: 8, inputBytes: 16 }, telemetry);

    expect(completed.container).toBe("bigtiff");
    expect(completed.fileKind).toBe("bigtiff");
    expect(completed.completeness).toMatchObject({ complete: true, bytesRead: 8, inputBytes: 16 });
    expect(completed.telemetry).toBe(telemetry);
  });

  it.each([
    { status: "opaque", expected: "opaque" },
    { status: "partial", expected: "partial" },
    { status: "skipped", expected: "skipped-by-selection" },
  ] as const)("derives $expected whole-file coverage from a $status block", async ({ status, expected }) => {
    const parsed = await parseMetadata(new Uint8Array(await readFile(fixture)));
    const completed = completeMetadataResult(parserInput(parsed, {
      blocks: [block(status, status)],
      warnings: [],
    }));

    expect(completed.coverage.wholeFile).toBe(expected);
    expect(completed.coverage.requested).toBe(status === "skipped" ? "complete" : expected);
  });

  it("keeps unsupported parser outcomes distinct from malformed data", async () => {
    const parsed = await parseMetadata(new Uint8Array(await readFile(fixture)));
    const completed = completeMetadataResult(parserInput(parsed, {
      format: "unknown",
      blocks: [],
      warnings: [{ code: "UNSUPPORTED_FORMAT", severity: "warning", message: "Unsupported fixture." }],
    }));

    expect(completed.completeness).toMatchObject({ complete: false, reasons: ["UNSUPPORTED_FORMAT"] });
    expect(completed.coverage).toMatchObject({ requested: "unsupported", wholeFile: "unsupported" });
  });

  it("labels every typed redaction target without widening its identity", () => {
    const targets: readonly RedactionTarget[] = [
      "GPS",
      { kind: "field", fieldId: "EXIF:GPS:0x0002" },
      { kind: "selector", selector: { kind: "family", family: "XMP" } },
      { kind: "selector", selector: { kind: "namespace-property", namespaceUri: "urn:test", localName: "property" } },
      { kind: "selector", selector: { kind: "sensitivity", sensitivity: "high" } },
      { kind: "selector", selector: { kind: "field-id", fieldId: "EXIF:IFD0:0x010f" } },
      { kind: "selector", selector: { kind: "block", blockId: "block-1" } },
      { kind: "selector", selector: { kind: "associated-image", imageId: "preview-1" } },
      { kind: "selector", selector: { kind: "photoshop-resource", resourceId: "8bim-1" } },
    ];
    const completed = completeRedactionResult(surgery({
      removed: targets.map((target) => ({ target, occurrences: 1 })),
    }), { remove: targets });

    expect(completed.outcome).toEqual({ successful: true, complete: true, unapplied: [], reasons: [] });
  });

  it("uses exact selector mappings to report only genuinely unapplied requests", () => {
    const mapped = { kind: "selector", selector: { kind: "field-id", fieldId: "EXIF:GPS:0x0002" } } as const;
    const missing = { kind: "selector", selector: { kind: "block", blockId: "missing" } } as const;
    const completed = completeRedactionResult(surgery({
      removed: [{ target: "GPS", occurrences: 1 }],
      warnings: [{ code: "REDACTION_SKIPPED", severity: "error", message: "One exact target was not applied." }],
    }), { remove: [mapped, missing, missing] }, [
      { request: mapped, legacyTargets: ["GPS"] },
      { request: missing, legacyTargets: ["EXIF"] },
    ]);

    expect(completed.outcome).toEqual({
      successful: false,
      complete: false,
      unapplied: [missing],
      reasons: ["One exact target was not applied."],
    });
  });

  it("derives typed operation outcomes without warning-text interpretation", () => {
    const target = { kind: "selector", selector: { kind: "block", blockId: "block-1" } } as const;
    const completed = completeRedactionResult(surgery({
      warnings: [{ code: "INVALID_VALUE", severity: "error", message: "Diagnostic wording is not state." }],
      operations: [
        {
          operationId: "remove-block",
          target,
          status: "rejected",
          candidateCount: 1,
          appliedCount: 0,
          matchedFieldIds: [],
          matchedBlockIds: ["block-1"],
          failureCode: "INVALID_VALUE",
        },
      ],
    }), { remove: [target] });

    expect(completed.outcome).toEqual({
      successful: false,
      complete: false,
      unapplied: [target],
      reasons: ["Diagnostic wording is not state."],
    });
  });
});
