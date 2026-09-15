import { parseMetadata } from "../index.js";
import { materializeInput } from "../input.js";
import { throwIfAborted } from "../security/abort.js";
import { resolveLimits } from "../security/limits.js";
import { inspectSemanticPrivacyDetailed } from "./semantic.js";
import type { MetadataCoverage, MetadataCoverageReasonCode, MetadataInput, MetadataResult, MetadataWarning, PrivacyAuditOptions, PrivacyReasonCode, Sensitivity, PrivacyFindingCategory, PrivacyFindingState } from "../types.js";

export interface PrivacyFinding {
  readonly target: string;
  readonly sensitivity: Sensitivity;
  readonly message: string;
  readonly reasonCode: PrivacyReasonCode;
  readonly state: PrivacyFindingState;
  readonly category: PrivacyFindingCategory;
  readonly fieldId?: string;
  readonly blockId?: string | null;
  readonly namespaceUri?: string;
  readonly localName?: string;
  readonly packetIndex?: number;
  readonly occurrence?: number;
  readonly sourceOffset?: number | null;
  readonly sourceLength?: number | null;
  readonly validation?: string;
  readonly rawValue?: unknown;
}

export interface PrivacyAuditResult {
  readonly format: MetadataResult["format"];
  readonly safe: boolean;
  readonly complete: boolean;
  readonly findings: readonly PrivacyFinding[];
  readonly opaqueBlocks: readonly PrivacyOpaqueBlock[];
  readonly thumbnails: readonly string[];
  readonly trailingBytes: number;
  readonly gaps: readonly string[];
  readonly warnings: readonly MetadataWarning[];
  readonly coverage: MetadataCoverage;
  readonly reasonCodes: readonly PrivacyReasonCode[];
}

export interface PrivacyOpaqueBlock {
  readonly format: MetadataResult["format"];
  readonly label: string;
  readonly offset: number;
  readonly length: number;
}

function jpegInspection(bytes: Uint8Array): { readonly opaqueBlocks: readonly PrivacyOpaqueBlock[]; readonly trailingBytes: number; readonly malformed: boolean } {
  const opaqueBlocks: PrivacyOpaqueBlock[] = [];
  let eoi = -1;
  for (let index = 0; index + 1 < bytes.length; index += 1) if (bytes[index] === 0xff && bytes[index + 1] === 0xd9) eoi = index;
  let cursor = 2;
  let malformed = false;
  while (cursor + 1 < bytes.length && bytes[cursor] === 0xff) {
    while (bytes[cursor] === 0xff) cursor += 1;
    const marker = bytes[cursor] ?? 0;
    cursor += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (cursor + 2 > bytes.length) { malformed = true; break; }
    const length = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
    if (length < 2 || cursor + length > bytes.length) { malformed = true; break; }
    if (marker >= 0xe0 && marker <= 0xef) {
      const payload = bytes.subarray(cursor + 2, cursor + length);
      const prefix = new TextDecoder("latin1").decode(payload.subarray(0, Math.min(payload.length, 32)));
      const fullPayload = new TextDecoder("latin1").decode(payload);
      const mpf = prefix.startsWith("MPF\0");
      const gainMap = fullPayload.includes("http://ns.adobe.com/hdr-gain-map/1.0/") || fullPayload.includes("hdrgm:Version");
      const recognized = prefix.startsWith("Exif\0\0") || prefix.startsWith("http://ns.adobe.com/xap/") || prefix.startsWith("ICC_PROFILE\0") || prefix.startsWith("JFIF\0") || prefix.startsWith("JFXX\0") || prefix.startsWith("Photoshop 3.0\0") || mpf || gainMap;
      if (!recognized) opaqueBlocks.push({ format: "jpeg", label: `APP${marker - 0xe0}`, offset: cursor - 2, length: length + 2 });
      if (mpf) opaqueBlocks.push({ format: "jpeg", label: "MPF multi-picture", offset: cursor - 2, length: length + 2 });
      if (gainMap) opaqueBlocks.push({ format: "jpeg", label: "Ultra HDR gain map", offset: cursor - 2, length: length + 2 });
    }
    cursor += length;
  }
  return { opaqueBlocks, trailingBytes: eoi < 0 ? 0 : bytes.length - (eoi + 2), malformed };
}

/** Inspect recognized privacy-sensitive metadata without modifying the input. */
export async function auditPrivacy(input: MetadataInput, options: PrivacyAuditOptions = {}): Promise<PrivacyAuditResult> {
  const limits = resolveLimits(options.limits);
  throwIfAborted(options.signal);
  const bytes = await materializeInput(input, limits, options.signal);
  throwIfAborted(options.signal);
  const result = await parseMetadata(bytes, { limits, ...(options.makerNotePlugins === undefined ? {} : { makerNotePlugins: options.makerNotePlugins }), ...(options.signal === undefined ? {} : { signal: options.signal }) });
  throwIfAborted(options.signal);
  const findings: PrivacyFinding[] = [];
  const reasonCodes: PrivacyReasonCode[] = [];
  const coverageReasons = [...result.coverage.reasons];
  const unclassifiedBlockIds = [...result.coverage.unclassifiedBlockIds];
  let wholeFile = result.coverage.wholeFile;
  const addReasonCode = (code: PrivacyReasonCode): void => {
    if (!reasonCodes.includes(code)) reasonCodes.push(code);
  };
  const addCoverageReason = (code: MetadataCoverageReasonCode, message: string, blockId?: string): void => {
    coverageReasons.push({ code, message });
    addReasonCode(code);
    if (blockId !== undefined && !unclassifiedBlockIds.includes(blockId)) unclassifiedBlockIds.push(blockId);
  };
  const worsenCoverage = (state: "partial" | "malformed" | "opaque" | "unsupported"): void => {
    const rank = { complete: 0, "skipped-by-selection": 1, partial: 2, unsupported: 3, opaque: 4, malformed: 5 } as const;
    if (rank[state] > rank[wholeFile]) wholeFile = state;
  };
  const classes: Array<[string, boolean, Sensitivity, string]> = [
    ["EXIF", result.exif !== null, "moderate", "EXIF metadata is present."],
    ["XMP", result.xmp !== null, "moderate", "XMP metadata is present; bounded semantic findings and any opaque remainder are reported."],
    ["IPTC", result.iptc !== null, "moderate", "IPTC metadata is present."],
    ["ICC", result.icc !== null, "low", "An ICC color profile is present."],
    ["JFIF", result.jfif !== null, "low", "JFIF header metadata is present."],
    ["PNGText", result.pngText.length > 0, "moderate", "PNG textual metadata is present."],
    ["Photoshop", (result.photoshop?.resources.length ?? 0) > 0, "high", "Photoshop image resources are present; each resource is retained with bounded provenance and unknown resources remain opaque risks."],
    ["MakerNote", (result.makerNotes?.notes.length ?? 0) > 0, "high", "MakerNote data is present; decoded fields and any opaque remainder require explicit review."],
  ];
  for (const [target, present, sensitivity, message] of classes) {
    if (present) {
      findings.push({ target, sensitivity, message, reasonCode: target === "XMP" ? "RAW_XMP" : "SENSITIVE_METADATA_PRESENT", state: "presence", category: "metadata-presence" });
      addReasonCode(target === "XMP" ? "RAW_XMP" : "SENSITIVE_METADATA_PRESENT");
    }
  }
  for (const item of result.fields) {
    if (item.sensitivity === "high" || item.sensitivity === "moderate") {
      findings.push({ target: item.name, sensitivity: item.sensitivity, message: `${item.name} is present in ${item.ifd}.`, reasonCode: "SENSITIVE_METADATA_PRESENT", state: "presence", category: "metadata-presence", fieldId: item.id, blockId: item.source?.blockId ?? null });
      addReasonCode("SENSITIVE_METADATA_PRESENT");
    }
  }
  const gaps: string[] = [];
  const semantic = result.iptcSemantic ?? result.iptc?.semantic;
  if (semantic !== undefined) {
    for (const field of semantic.fields) {
      if (field.candidates.length === 0 || field.sensitivity === "none") continue;
      findings.push({ target: field.id, sensitivity: field.sensitivity, message: `${field.name} has ${field.candidates.length} IPTC/XMP semantic candidate${field.candidates.length === 1 ? "" : "s"}; all candidates are retained for review.`, reasonCode: "SENSITIVE_METADATA_PRESENT", state: "decoded-finding", category: "metadata-presence", fieldId: field.id });
      addReasonCode("SENSITIVE_METADATA_PRESENT");
    }
    if (!semantic.complete) {
      gaps.push("IPTC semantic inspection was incomplete; unknown or invalid IPTC/XMP values remain conservatively classified.");
      addCoverageReason("PARSER_ERROR", "IPTC semantic inspection reported diagnostics.");
      worsenCoverage("partial");
    }
    if (semantic.unknown.length > 0) {
      for (const candidate of semantic.unknown) {
        const target = candidate.source.kind === "xmp"
          ? `unknown-xmp:${candidate.source.namespaceUri ?? "unresolved"}:${candidate.source.localName ?? candidate.source.fieldId}`
          : `unknown-iim:${candidate.source.record ?? "?"}:${candidate.source.dataset ?? "?"}`;
        findings.push({ target, sensitivity: "high", message: "Unknown IPTC/XMP semantic data is retained and treated as potentially sensitive.", reasonCode: candidate.source.kind === "xmp" ? "RAW_XMP" : "SENSITIVE_METADATA_PRESENT", state: "opaque-risk", category: candidate.source.kind === "xmp" ? "unknown-xmp" : "opaque-block", fieldId: candidate.source.fieldId, blockId: candidate.source.blockId ?? null, ...(candidate.source.namespaceUri === undefined ? {} : { namespaceUri: candidate.source.namespaceUri }), ...(candidate.source.localName === undefined ? {} : { localName: candidate.source.localName }) });
      }
      gaps.push(`${semantic.unknown.length} unknown IPTC-IIM/XMP semantic value${semantic.unknown.length === 1 ? "" : "s"} remain retained and conservatively classified.`);
      addReasonCode(result.xmp === null ? "SENSITIVE_METADATA_PRESENT" : "RAW_XMP");
    }
  }
  const opaqueBlocks: PrivacyOpaqueBlock[] = [];
  const thumbnails: string[] = [];
  let trailingBytes = 0;
  if (result.format === "unknown") {
    gaps.push("The image format was not recognized, so metadata safety could not be established.");
    addCoverageReason("UNKNOWN_FORMAT", "The image format was not recognized.");
    worsenCoverage("unsupported");
  }
  if (result.xmp !== null) {
    gaps.push("XMP packets are retained as raw XML and may contain additional sensitive properties.");
    addReasonCode("RAW_XMP");
  }
  const semanticInspection = inspectSemanticPrivacyDetailed(result, limits, options.includeRawValues === true);
  for (const semanticFinding of semanticInspection.findings) {
    findings.push({
      target: semanticFinding.target,
      sensitivity: semanticFinding.sensitivity,
      message: semanticFinding.reason,
      reasonCode: semanticFinding.category === "unknown-xmp" ? "RAW_XMP" : "SENSITIVE_METADATA_PRESENT",
      state: semanticFinding.state,
      category: semanticFinding.category,
      fieldId: semanticFinding.fieldId,
      blockId: semanticFinding.blockId,
      ...(semanticFinding.namespaceUri === undefined ? {} : { namespaceUri: semanticFinding.namespaceUri }),
      ...(semanticFinding.localName === undefined ? {} : { localName: semanticFinding.localName }),
      ...(semanticFinding.packetIndex === undefined ? {} : { packetIndex: semanticFinding.packetIndex }),
      ...(semanticFinding.occurrence === undefined ? {} : { occurrence: semanticFinding.occurrence }),
      ...(semanticFinding.sourceOffset === undefined ? {} : { sourceOffset: semanticFinding.sourceOffset }),
      ...(semanticFinding.sourceLength === undefined ? {} : { sourceLength: semanticFinding.sourceLength }),
      ...(semanticFinding.validation === undefined ? {} : { validation: semanticFinding.validation }),
      ...(semanticFinding.rawValue === undefined ? {} : { rawValue: semanticFinding.rawValue }),
    });
    addReasonCode(semanticFinding.category === "unknown-xmp" ? "RAW_XMP" : "SENSITIVE_METADATA_PRESENT");
  }
  if (!semanticInspection.complete) {
    gaps.push(...semanticInspection.diagnostics);
    findings.push({ target: "privacy:semantic-inspection", sensitivity: "high", message: "Semantic privacy inspection was incomplete; the uninspected remainder is an opaque risk.", reasonCode: "PARSER_ERROR", state: "opaque-risk", category: "unsupported-structure", fieldId: "privacy:semantic-inspection", blockId: null });
    addCoverageReason("PARSER_ERROR", "Semantic privacy inspection reached a configured parser or output limit.");
    worsenCoverage("partial");
  }
  if (result.photoshop !== null && result.photoshop !== undefined) {
    const photoshopResources = result.photoshop.resources;
    const photoshopFindingLimit = limits.maxImageDetailRelationships;
    for (const resource of photoshopResources.slice(0, photoshopFindingLimit)) {
      const blockId = `${resource.id}:block`;
      if (resource.kind === "thumbnail") {
        thumbnails.push(`Photoshop:${resource.id}`);
        findings.push({ target: resource.id, sensitivity: "high", message: "A Photoshop thumbnail resource may contain pixels and metadata outside the primary-image policy.", reasonCode: "SENSITIVE_METADATA_PRESENT", state: resource.status === "decoded" ? "decoded-finding" : "opaque-risk", category: "embedded-preview", fieldId: resource.id, blockId, sourceOffset: resource.offset, sourceLength: resource.length });
        addReasonCode("SENSITIVE_METADATA_PRESENT");
      } else if (resource.kind === "unknown" || resource.status === "malformed" || resource.status === "limited" || resource.rawPayload === null) {
        findings.push({ target: resource.id, sensitivity: "high", message: "This Photoshop resource is unknown, malformed, limited, or not retained as a complete payload and therefore remains an opaque privacy risk.", reasonCode: resource.status === "malformed" ? "BLOCK_MALFORMED" : "BLOCK_OPAQUE", state: "opaque-risk", category: resource.kind === "unknown" ? "opaque-block" : "unsupported-structure", fieldId: resource.id, blockId, sourceOffset: resource.offset, sourceLength: resource.length });
        addReasonCode(resource.status === "malformed" ? "BLOCK_MALFORMED" : "BLOCK_OPAQUE");
        addCoverageReason(resource.status === "malformed" ? "BLOCK_MALFORMED" : "BLOCK_OPAQUE", `${resource.id} was not completely classified.`, blockId);
        worsenCoverage(resource.status === "malformed" ? "malformed" : "opaque");
      }
    }
    if (photoshopResources.length > photoshopFindingLimit) {
      const omitted = photoshopResources.length - photoshopFindingLimit;
      const blockId = result.photoshop.source.blockId;
      findings.push({ target: "privacy:photoshop-resources", sensitivity: "high", message: `${omitted} Photoshop image resource${omitted === 1 ? "" : "s"} exceeded the privacy finding limit and remains an opaque risk.`, reasonCode: "BLOCK_OPAQUE", state: "opaque-risk", category: "unsupported-structure", fieldId: "privacy:photoshop-resources", blockId });
      gaps.push("Photoshop privacy findings were bounded before every resource could be individually classified; the remainder remains an opaque risk.");
      addReasonCode("BLOCK_OPAQUE");
      addCoverageReason("BLOCK_PARTIAL", "The Photoshop resource privacy finding limit was reached; unreported resources remain opaque.", blockId);
      worsenCoverage("partial");
    }
    if (!result.photoshop.complete) {
      gaps.push("Photoshop image-resource inventory was incomplete; unindexed or malformed resources remain conservatively classified.");
      addCoverageReason("BLOCK_MALFORMED", "Photoshop image-resource inventory is incomplete.", result.photoshop.source.blockId);
      worsenCoverage("malformed");
    }
  }
  if (result.makerNotes !== null && result.makerNotes !== undefined) {
    const makerNoteLimit = limits.maxImageDetailRelationships;
    for (const note of result.makerNotes.notes.slice(0, makerNoteLimit)) {
      const noteBlockId = note.provenance.blockId;
      if (note.status === "detected-decoded" && note.fields.length > 0) {
        for (const field of note.fields.slice(0, makerNoteLimit)) {
          if (field.sensitivity === "none") continue;
          findings.push({ target: field.id, sensitivity: field.sensitivity, message: `${field.name} is a decoded MakerNote field and may identify a device, capture, location, subject, or workflow.`, reasonCode: "SENSITIVE_METADATA_PRESENT", state: "decoded-finding", category: field.sensitivity === "high" ? "serial-identifier" : "device-identifier", fieldId: field.id, blockId: noteBlockId, sourceOffset: field.provenance.originalFileOffset, sourceLength: field.provenance.noteLength });
          addReasonCode("SENSITIVE_METADATA_PRESENT");
        }
      }
      if (note.status !== "detected-decoded" || note.opaqueRanges.length > 0 || note.fields.length === 0) {
        findings.push({ target: note.id, sensitivity: "high", message: "MakerNote data is unknown, incomplete, or not fully decoded and remains an opaque privacy risk.", reasonCode: "BLOCK_OPAQUE", state: "opaque-risk", category: "opaque-block", fieldId: note.fieldId, blockId: noteBlockId, sourceOffset: note.provenance.noteOffset, sourceLength: note.byteLength });
        addReasonCode("BLOCK_OPAQUE");
        addCoverageReason("BLOCK_OPAQUE", `${note.id} is not fully decoded by an explicitly supplied MakerNote plugin.`, noteBlockId);
        worsenCoverage("opaque");
      }
    }
    if (result.makerNotes.notes.length > makerNoteLimit) {
      const blockId = result.makerNotes.notes[makerNoteLimit]?.provenance.blockId;
      findings.push({ target: "privacy:makernote-notes", sensitivity: "high", message: "MakerNote privacy findings reached their configured limit; the remainder remains opaque.", reasonCode: "BLOCK_OPAQUE", state: "opaque-risk", category: "unsupported-structure", fieldId: "privacy:makernote-notes", blockId: blockId ?? null });
      addCoverageReason("BLOCK_PARTIAL", "MakerNote privacy findings were bounded before all notes were classified.", blockId);
      worsenCoverage("partial");
    }
    if (!result.makerNotes.complete) {
      addCoverageReason("BLOCK_OPAQUE", "MakerNote inspection is incomplete or contains opaque plugin results.");
      worsenCoverage("opaque");
    }
  }
  if (result.format === "jpeg") {
    const inspection = jpegInspection(bytes);
    opaqueBlocks.push(...inspection.opaqueBlocks);
    trailingBytes = inspection.trailingBytes;
    if (inspection.opaqueBlocks.length > 0) {
      gaps.push("Opaque JPEG APP markers are retained by lossless redaction.");
      for (const block of inspection.opaqueBlocks) {
        findings.push({ target: block.label, sensitivity: "high", message: `${block.label} is opaque and may contain sensitive or offset-bearing data.`, reasonCode: "OPAQUE_JPEG_MARKER", state: "opaque-risk", category: "opaque-block", blockId: `jpeg:opaque:${block.offset}` });
        addCoverageReason("OPAQUE_JPEG_MARKER", `${block.label} is not classified by the JPEG metadata policy.`, `jpeg:opaque:${block.offset}`);
      }
      worsenCoverage("opaque");
    }
    if (inspection.opaqueBlocks.some(({ label }) => label === "MPF multi-picture")) gaps.push("JPEG MPF secondary images are not rewritten by lossless redaction.");
    if (inspection.opaqueBlocks.some(({ label }) => label === "Ultra HDR gain map")) gaps.push("Ultra HDR gain-map structures are not rewritten by lossless redaction.");
    if (inspection.trailingBytes > 0) {
      gaps.push("Bytes after the JPEG end marker are retained by lossless redaction.");
      addCoverageReason("TRAILING_BYTES", "Bytes after the JPEG end marker are outside the classified image structure.", "jpeg:trailing");
      worsenCoverage("opaque");
    }
    if (inspection.malformed) {
      gaps.push("JPEG marker structure could not be fully inspected.");
      addCoverageReason("BLOCK_MALFORMED", "JPEG marker structure could not be fully inspected.");
      worsenCoverage("malformed");
    }
  }
  if (result.format === "heif" || result.format === "avif") {
    gaps.push("HEIF/AVIF item properties outside the bounded metadata paths are not inspected.");
    addCoverageReason("UNSUPPORTED_STRUCTURE", "HEIF/AVIF item properties outside the bounded metadata paths are not inspected.", `${result.format}:unbounded-properties`);
    worsenCoverage("opaque");
  }
  if (result.raw !== null) {
    const rawRanges = [...result.raw.rawPayloads, ...result.raw.opaquePayloads];
    const imageRanges = [...result.raw.previews, ...result.raw.thumbnails];
    const maxRawFindings = limits.maxImageDetailRelationships;
    for (const payload of imageRanges.slice(0, maxRawFindings)) {
      const isBounded = payload.offset !== null && payload.length !== null && payload.status === "valid";
      const target = `RAW:${result.raw.kind}:${payload.role}:${payload.id}`;
      if (payload.role === "thumbnail") thumbnails.push(target);
      findings.push({
        target,
        sensitivity: "high",
        message: isBounded
          ? "A RAW embedded preview or thumbnail is addressable but may contain pixels or metadata outside the primary-image policy."
          : "A RAW embedded preview or thumbnail is not safely bounded and remains an opaque privacy risk.",
        reasonCode: isBounded ? "SENSITIVE_METADATA_PRESENT" : "BLOCK_OPAQUE",
        state: isBounded ? "decoded-finding" : "opaque-risk",
        category: "embedded-preview",
        fieldId: target,
        blockId: payload.sourceDirectoryId,
        ...(payload.offset === null ? {} : { sourceOffset: payload.offset }),
        ...(payload.length === null ? {} : { sourceLength: payload.length }),
      });
      addReasonCode(isBounded ? "SENSITIVE_METADATA_PRESENT" : "BLOCK_OPAQUE");
      if (!isBounded) {
        addCoverageReason("BLOCK_OPAQUE", `${target} has no safely bounded source range.`);
        worsenCoverage("opaque");
      }
    }
    for (const payload of rawRanges.slice(0, Math.max(0, maxRawFindings - imageRanges.length))) {
      const target = `RAW:${result.raw.kind}:${payload.role}:${payload.id}`;
      findings.push({
        target,
        sensitivity: "high",
        message: payload.role === "raw"
          ? "The RAW sensor payload is not decoded by this package and remains an opaque privacy risk."
          : "A vendor RAW payload is opaque and may contain sensitive image, device, or workflow data.",
        reasonCode: "BLOCK_OPAQUE",
        state: "opaque-risk",
        category: "opaque-block",
        fieldId: target,
        blockId: payload.sourceDirectoryId,
        ...(payload.offset === null ? {} : { sourceOffset: payload.offset }),
        ...(payload.length === null ? {} : { sourceLength: payload.length }),
      });
      addReasonCode("BLOCK_OPAQUE");
      addCoverageReason("BLOCK_OPAQUE", `${target} is not interpreted by the metadata privacy policy.`, payload.sourceDirectoryId ?? target);
      worsenCoverage("opaque");
    }
    for (const diagnostic of result.raw.diagnostics) {
      const code = diagnostic.code === "MALFORMED_STRUCTURE" ? "BLOCK_MALFORMED" : "PARSER_ERROR";
      addCoverageReason(code, diagnostic.detail, `RAW:${result.raw.kind}`);
      gaps.push(`RAW ${result.raw.kind.toUpperCase()} inventory reported ${diagnostic.code}.`);
      worsenCoverage(diagnostic.code === "MALFORMED_STRUCTURE" ? "malformed" : diagnostic.code === "LIMIT_EXCEEDED" ? "partial" : "opaque");
    }
  }
  const phaseTwoInventory = result.cr3 ?? result.raf;
  if (phaseTwoInventory !== undefined) {
    const family = result.format.toUpperCase();
    const maxInventoryFindings = limits.maxImageDetailRelationships;
    const opaqueIds = new Set(phaseTwoInventory.opaqueStructures.map(({ id }) => id));
    for (const range of phaseTwoInventory.ranges.slice(0, maxInventoryFindings)) {
      const bounded = range.status === "valid" && range.offset !== null && range.length !== null;
      const target = `${family}:${range.role}:${range.id}`;
      const isOpaquePayload = range.role === "raw" || range.role === "cfa" || range.role === "unknown" || opaqueIds.has(range.id);
      if (range.role === "thumbnail") thumbnails.push(target);
      findings.push({
        target,
        sensitivity: "high",
        message: !bounded
          ? `${family} ${range.role} range is not safely bounded and remains an opaque privacy risk.`
          : isOpaquePayload
            ? `${family} ${range.role} range is not interpreted by the metadata policy and may contain image, device, or workflow data.`
            : `${family} ${range.role} range is addressable and may contain pixels or metadata outside the primary-image policy.`,
        reasonCode: bounded && !isOpaquePayload ? "SENSITIVE_METADATA_PRESENT" : "BLOCK_OPAQUE",
        state: bounded && !isOpaquePayload ? "decoded-finding" : "opaque-risk",
        category: range.role === "preview" || range.role === "thumbnail" ? "embedded-preview" : "opaque-block",
        fieldId: target,
        blockId: range.id,
        ...(range.offset === null ? {} : { sourceOffset: range.offset }),
        ...(range.length === null ? {} : { sourceLength: range.length }),
      });
      addReasonCode(bounded && !isOpaquePayload ? "SENSITIVE_METADATA_PRESENT" : "BLOCK_OPAQUE");
      if (!bounded || isOpaquePayload) {
        addCoverageReason("BLOCK_OPAQUE", `${target} is not fully classified by the ${family} inventory policy.`, range.id);
        worsenCoverage("opaque");
      }
    }
    for (const opaque of phaseTwoInventory.opaqueStructures.slice(0, Math.max(0, maxInventoryFindings - phaseTwoInventory.ranges.length))) {
      const target = `${family}:opaque:${opaque.id}`;
      if (phaseTwoInventory.ranges.some(({ id }) => id === opaque.id)) continue;
      findings.push({
        target,
        sensitivity: "high",
        message: `${family} contains an opaque vendor structure that may contain sensitive image, device, or workflow data.`,
        reasonCode: "BLOCK_OPAQUE",
        state: "opaque-risk",
        category: "opaque-block",
        fieldId: target,
        blockId: opaque.id,
        ...(opaque.offset === null ? {} : { sourceOffset: opaque.offset }),
        ...(opaque.length === null ? {} : { sourceLength: opaque.length }),
      });
      addReasonCode("BLOCK_OPAQUE");
      addCoverageReason("BLOCK_OPAQUE", `${target} is not fully classified by the ${family} inventory policy.`, opaque.id);
      worsenCoverage("opaque");
    }
    for (const diagnostic of phaseTwoInventory.diagnostics) {
      const coverageCode: MetadataCoverageReasonCode = diagnostic.code === "MALFORMED_STRUCTURE" ? "BLOCK_MALFORMED" : diagnostic.code === "LIMIT_EXCEEDED" ? "LIMIT_EXCEEDED" : diagnostic.code === "TRUNCATED_DATA" ? "TRUNCATED_DATA" : "BLOCK_OPAQUE";
      addCoverageReason(coverageCode, `${family} inventory reported ${diagnostic.code}: ${diagnostic.detail}`, `${family}:${diagnostic.code}`);
      gaps.push(`${family} inventory reported ${diagnostic.code}.`);
      worsenCoverage(diagnostic.code === "MALFORMED_STRUCTURE" ? "malformed" : diagnostic.code === "LIMIT_EXCEEDED" ? "partial" : "opaque");
    }
  }
  if (result.exif?.fields.some((field) => field.name === "JPEGInterchangeFormat" || field.name === "JPEGInterchangeFormatLength")) thumbnails.push("EXIF JPEG thumbnail");
  for (const image of result.exif?.associatedImages ?? []) {
    thumbnails.push(`${image.role} associated image`);
    const opaque = image.offset === null || image.length === null;
    findings.push({
      target: `${image.directoryId}:${image.role}`,
      sensitivity: "high",
      message: opaque ? "An associated image has no safely bounded byte range and remains an opaque privacy risk." : "An associated image or embedded preview may contain pixels and metadata outside the primary-image policy.",
      reasonCode: "SENSITIVE_METADATA_PRESENT",
      state: opaque ? "opaque-risk" : "decoded-finding",
      category: "embedded-preview",
      fieldId: `${image.directoryId}:${image.role}`,
      blockId: null,
      ...(image.offset === null ? {} : { sourceOffset: image.offset }),
      ...(image.length === null ? {} : { sourceLength: image.length }),
    });
    addReasonCode("SENSITIVE_METADATA_PRESENT");
  }
  const coverage: MetadataCoverage = {
    requested: result.coverage.requested,
    wholeFile,
    reasons: coverageReasons,
    unclassifiedBlockIds,
  };
  const complete = coverage.requested === "complete";
  return {
    format: result.format,
    safe: complete && coverage.wholeFile === "complete" && coverage.unclassifiedBlockIds.length === 0 && findings.length === 0 && gaps.length === 0,
    complete,
    findings,
    opaqueBlocks,
    thumbnails,
    trailingBytes,
    gaps,
    warnings: result.warnings,
    coverage,
    reasonCodes,
  };
}
