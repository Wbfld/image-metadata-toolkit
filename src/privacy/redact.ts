import { detectFormat } from "../detect-format.js";
import { editMetadata } from "../edit.js";
import { serializeIptcIim, serializeStructuredXmp } from "../metadata/serialization.js";
import { parseStructuredXmpDetailed } from "../metadata/xmp.js";
import { rewriteJpegMetadata } from "../jpeg-writer.js";
import { rewritePngMetadata } from "../png-writer.js";
import { rewriteWebpMetadata } from "../webp-writer.js";
import type {
  EditOperation,
  LegacyRedactOptions,
  LegacyRedactionTarget,
  MetadataWarning,
  MetadataField,
  MetadataResult,
  RedactionOperationEvidence,
  SurgeryResult,
  RedactOptions,
  RedactionTarget,
  SecurityLimits,
} from "../types.js";
import { redactJpeg } from "./jpeg-surgery.js";
import { redactPng } from "./png-surgery.js";
import { redactWebp } from "./webp-surgery.js";
import { c2paMutationFailure } from "../trust/jumbf.js";

const VALID_TARGETS = new Set<LegacyRedactionTarget>([
  "AllMetadata", "EXIF", "XMP", "PNGText", "IPTC", "ICC", "JFIF", "GPS", "SerialNumber",
  "Make", "Model", "Orientation", "DateTime", "DateTimeOriginal", "ExposureTime", "FNumber",
  "ISOSpeedRatings", "Flash", "FocalLength", "GPSLatitude", "GPSLongitude", "GPSAltitude",
  "Copyright", "Artist", "Software",
]);

const FIELD_TO_LEGACY: Readonly<Record<string, LegacyRedactionTarget>> = {
  Make: "Make", Model: "Model", Orientation: "Orientation", DateTime: "DateTime", DateTimeOriginal: "DateTimeOriginal", ExposureTime: "ExposureTime", FNumber: "FNumber", ISOSpeedRatings: "ISOSpeedRatings", Flash: "Flash", FocalLength: "FocalLength", GPSLatitude: "GPSLatitude", GPSLongitude: "GPSLongitude", GPSAltitude: "GPSAltitude", Copyright: "Copyright", Artist: "Artist", Software: "Software",
};

export interface RedactionTargetMapping {
  readonly request: RedactionTarget;
  readonly legacyTargets: readonly LegacyRedactionTarget[];
  readonly blockIds: readonly string[];
}

type ExactRedactionAddress =
  | {
    readonly kind: "EXIF";
    readonly fieldId: string;
    readonly blockId: string;
    readonly ifd: string;
    readonly tag: number;
    readonly directoryId: string | null;
  }
  | {
    readonly kind: "IPTC";
    readonly fieldId: string;
    readonly blockId: string;
    readonly tag: number;
    readonly occurrence: number;
  }
  | {
    readonly kind: "XMP";
    readonly fieldId: string;
    readonly blockId: string;
    readonly packetIndex: number;
    readonly namespaceUri: string;
    readonly localName: string;
    readonly order: number;
  };

interface RedactionExactMapping {
  readonly request: RedactionTarget;
  readonly addresses: readonly ExactRedactionAddress[];
}

export interface RedactionResolution {
  readonly options: LegacyRedactOptions | null;
  readonly mappings: readonly RedactionTargetMapping[];
  readonly exact: readonly RedactionExactMapping[];
  readonly parsed?: MetadataResult;
  readonly warnings: readonly MetadataWarning[];
}

function targetLabel(target: RedactionTarget): string {
  if (typeof target === "string") return target;
  if (target.kind === "field") return `field:${target.fieldId}`;
  const selector = target.selector;
  switch (selector.kind) {
    case "family": return `family:${selector.family}`;
    case "namespace-property": return `property:${selector.namespaceUri}#${selector.localName}`;
    case "sensitivity": return `sensitivity:${selector.sensitivity}`;
    case "field-id": return `field:${selector.fieldId}`;
    case "block": return `block:${selector.blockId}`;
    case "associated-image": return `associated-image:${selector.imageId}`;
  }
}

function familyTarget(family: MetadataResult["blocks"][number]["family"]): LegacyRedactionTarget | null {
  if (family === "EXIF" || family === "XMP" || family === "IPTC" || family === "ICC" || family === "JFIF" || family === "PNGText") return family;
  if (family === "Photoshop") return "IPTC";
  return null;
}

function physicalBlockId(result: MetadataResult, blockId: string): string {
  const blocks = new Map(result.blocks.map((block) => [block.id, block] as const));
  let current = blocks.get(blockId);
  const seen = new Set<string>();
  while (current?.parentBlockId !== undefined && current.parentBlockId !== null && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = blocks.get(current.parentBlockId);
    if (parent === undefined) break;
    current = parent;
  }
  return current?.id ?? blockId;
}

function uniqueBlockIds(values: readonly (string | null | undefined)[]): readonly string[] {
  return [...new Set(values.filter((value): value is string => value !== undefined && value !== null && value.length > 0))];
}

function fieldTarget(field: MetadataResult["fields"][number]): LegacyRedactionTarget | null {
  const mapped = FIELD_TO_LEGACY[field.name];
  if (mapped !== undefined) return mapped;
  return familyTarget(field.ifd === "ICC" ? "ICC" : field.ifd === "IPTC" ? "IPTC" : field.ifd === "XMP" ? "XMP" : "EXIF");
}

function exactFieldRequest(target: RedactionTarget): string | null {
  if (typeof target === "string") return null;
  if (target.kind === "field") return target.fieldId;
  return target.selector.kind === "field-id" ? target.selector.fieldId : null;
}

function exactNamespaceRequest(target: RedactionTarget): { readonly namespaceUri: string; readonly localName: string } | null {
  if (typeof target === "string" || target.kind !== "selector" || target.selector.kind !== "namespace-property") return null;
  return target.selector;
}

function exactFieldMatches(field: MetadataField, fieldId: string): boolean {
  return fieldMatchesId(field, fieldId);
}

function exactCandidateMatches(candidate: NonNullable<MetadataResult["iptcSemantic"]>["fields"][number]["candidates"][number], semanticId: string | null, fieldId: string | null, namespace: { readonly namespaceUri: string; readonly localName: string } | null): boolean {
  if (namespace !== null) return candidate.source.kind === "xmp" && candidate.source.namespaceUri === namespace.namespaceUri && candidate.source.localName === namespace.localName;
  return fieldId !== null && (semanticId === fieldId || candidate.source.fieldId === fieldId || candidate.source.fieldId === `normalized:${fieldId}`);
}

function xmpOrder(fieldId: string): number | null {
  const match = /:(\d+):(\d+)$/u.exec(fieldId);
  return match === null ? null : Number(match[2]);
}

function exactAddressesForTarget(result: MetadataResult, target: RedactionTarget): readonly ExactRedactionAddress[] {
  const fieldId = exactFieldRequest(target);
  const namespace = exactNamespaceRequest(target);
  if (fieldId === null && namespace === null) return [];
  const addresses: ExactRedactionAddress[] = [];
  const addField = (field: MetadataField): void => {
    const blockId = field.source?.blockId;
    if (blockId === undefined || blockId.length === 0) return;
    if (field.ifd === "IPTC") {
      addresses.push({ kind: "IPTC", fieldId: field.id, blockId, tag: field.tag, occurrence: field.occurrence ?? 0 });
    } else if (field.ifd !== "ICC" && field.ifd !== "XMP" && field.ifd !== "Dimensions") {
      addresses.push({ kind: "EXIF", fieldId: field.id, blockId, ifd: field.ifd, tag: field.tag, directoryId: field.source?.directoryId ?? field.directoryId ?? null });
    }
  };
  if (fieldId !== null) {
    for (const field of result.fields) if (exactFieldMatches(field, fieldId)) addField(field);
  }
  const candidates = [
    ...(result.iptcSemantic?.fields.flatMap((field) => field.candidates.map((candidate) => ({ candidate, semanticId: field.id }))) ?? []),
    ...(result.iptcSemantic?.unknown.map((candidate) => ({ candidate, semanticId: null })) ?? []),
  ];
  for (const { candidate, semanticId } of candidates) {
    if (!exactCandidateMatches(candidate, semanticId, fieldId, namespace)) continue;
    const blockId = candidate.source.blockId;
    if (blockId === null || blockId === undefined || blockId.length === 0) continue;
    if (candidate.source.kind === "iim") {
      if (candidate.source.record === undefined || candidate.source.dataset === undefined) continue;
      addresses.push({ kind: "IPTC", fieldId: candidate.source.fieldId, blockId, tag: (candidate.source.record << 8) | candidate.source.dataset, occurrence: candidate.source.occurrence ?? 0 });
    } else {
      const packetIndex = candidate.source.packetIndex;
      const provenance = packetIndex === undefined ? undefined : result.xmp?.packetProvenance?.[packetIndex];
      const order = xmpOrder(candidate.source.fieldId);
      if (packetIndex === undefined || order === null || provenance?.source !== "embedded") continue;
      addresses.push({ kind: "XMP", fieldId: candidate.source.fieldId, blockId, packetIndex, namespaceUri: candidate.source.namespaceUri ?? "", localName: candidate.source.localName ?? "", order });
    }
  }
  const seen = new Set<string>();
  return addresses.filter((address) => {
    const key = address.kind === "EXIF"
      ? `${address.kind}:${address.blockId}:${address.directoryId ?? ""}:${address.ifd}:${address.tag}`
      : address.kind === "IPTC"
        ? `${address.kind}:${address.blockId}:${address.tag}:${address.occurrence}`
        : `${address.kind}:${address.blockId}:${address.packetIndex}:${address.namespaceUri}#${address.localName}:${address.order}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function exactLegacyPreservationTargets(result: MetadataResult, addresses: readonly ExactRedactionAddress[]): readonly LegacyRedactionTarget[] {
  if (addresses.length === 0 || addresses.some((address) => address.kind !== "EXIF")) return [];
  const names = result.fields.filter((field) => addresses.some((address) => address.kind === "EXIF" && address.fieldId === field.id)).map((field) => FIELD_TO_LEGACY[field.name]).filter((target): target is LegacyRedactionTarget => target !== undefined);
  return [...new Set(names)];
}

function staticFieldTarget(fieldId: string): LegacyRedactionTarget | null {
  const normalized = fieldId.startsWith("normalized:") ? fieldId.slice("normalized:".length) : fieldId;
  const direct = FIELD_TO_LEGACY[normalized];
  if (direct !== undefined) return direct;
  const exif = /^(?:EXIF:)?(?:IFD0|ExifIFD|GPSIFD):0x([0-9a-fA-F]{1,4})$/u.exec(normalized);
  if (exif !== null) {
    const tag = Number.parseInt(exif[1] ?? "", 16);
    const byTag: Readonly<Record<number, LegacyRedactionTarget>> = { 0x010f: "Make", 0x0110: "Model", 0x0112: "Orientation", 0x0132: "DateTime", 0x013b: "Artist", 0x0131: "Software", 0x8298: "Copyright", 0x829a: "ExposureTime", 0x829d: "FNumber", 0x8827: "ISOSpeedRatings", 0x9201: "ExposureTime", 0x9209: "Flash", 0x920a: "FocalLength", 0x9003: "DateTimeOriginal", 0x0002: "GPSLatitude", 0x0004: "GPSLongitude", 0x0006: "GPSAltitude" };
    return byTag[tag] ?? null;
  }
  return null;
}

function staticTarget(target: RedactionTarget): readonly LegacyRedactionTarget[] {
  if (typeof target === "string") return VALID_TARGETS.has(target) ? [target] : [];
  if (target.kind === "field") {
    const mapped = staticFieldTarget(target.fieldId);
    return mapped === null ? [] : [mapped];
  }
  switch (target.selector.kind) {
    case "family": {
      const mapped = familyTarget(target.selector.family); return mapped === null ? [] : [mapped];
    }
    case "field-id": {
      const mapped = staticFieldTarget(target.selector.fieldId); return mapped === null ? [] : [mapped];
    }
    default: return [];
  }
}

function fieldMatchesId(field: MetadataResult["fields"][number], fieldId: string): boolean {
  if (field.id === fieldId || field.name === fieldId || `normalized:${field.name}` === fieldId) return true;
  const match = /^(?:EXIF:)?(IFD0|ExifIFD|GPSIFD|InteropIFD):0x([0-9a-fA-F]{1,4})$/u.exec(fieldId);
  return match !== null && field.ifd === match[1] && field.tag === Number.parseInt(match[2] ?? "", 16);
}

function semanticCandidatesForField(result: MetadataResult, fieldId: string) {
  return result.iptcSemantic?.fields.flatMap((field) => field.id === fieldId || field.candidates.some((candidate) => candidate.source.fieldId === fieldId) ? field.candidates : []) ?? [];
}

function matchingLegacyTargets(result: MetadataResult, target: RedactionTarget): readonly LegacyRedactionTarget[] {
  if (typeof target === "string") return staticTarget(target);
  if (target.kind === "field") return [];
  const selector = target.selector;
  if (selector.kind === "family") return [...new Set(result.blocks.filter((block) => block.family === selector.family).map((block) => familyTarget(block.family)).filter((item): item is LegacyRedactionTarget => item !== null))];
  if (selector.kind === "block") return [...new Set(result.blocks.filter((block) => block.id === selector.blockId).map((block) => familyTarget(block.family)).filter((item): item is LegacyRedactionTarget => item !== null))];
  if (selector.kind === "associated-image") return [...new Set(result.blocks.filter((block) => block.associatedImage === selector.imageId).map((block) => familyTarget(block.family)).filter((item): item is LegacyRedactionTarget => item !== null))];
  if (selector.kind === "sensitivity") {
    const fields = result.fields.filter((field) => field.sensitivity === selector.sensitivity).map(fieldTarget);
    const blocks = result.blocks.filter((block) => block.sensitivity === selector.sensitivity).map((block) => familyTarget(block.family));
    return [...new Set([...fields, ...blocks].filter((item): item is LegacyRedactionTarget => item !== null))];
  }
  if (selector.kind === "namespace-property") return [];
  return [];
}

function matchingBlockIds(result: MetadataResult, target: RedactionTarget): readonly string[] {
  if (typeof target === "string") return [];
  if (target.kind === "field") {
    return uniqueBlockIds([
      ...result.fields.filter((field) => fieldMatchesId(field, target.fieldId)).map((field) => field.source?.blockId),
      ...semanticCandidatesForField(result, target.fieldId).map((candidate) => candidate.source.blockId),
    ].map((blockId) => blockId === undefined || blockId === null ? undefined : physicalBlockId(result, blockId)));
  }
  const selector = target.selector;
  if (selector.kind === "block") {
    const block = result.blocks.find((candidate) => candidate.id === selector.blockId);
    return block === undefined ? [] : [physicalBlockId(result, block.id)];
  }
  if (selector.kind === "associated-image") {
    return uniqueBlockIds(result.blocks.filter((block) => block.associatedImage === selector.imageId).map((block) => physicalBlockId(result, block.id)));
  }
  if (selector.kind === "family") {
    return uniqueBlockIds(result.blocks.filter((block) => block.family === selector.family).map((block) => physicalBlockId(result, block.id)));
  }
  if (selector.kind === "sensitivity") {
    return uniqueBlockIds([
      ...result.fields.filter((field) => field.sensitivity === selector.sensitivity).map((field) => field.source?.blockId),
      ...result.blocks.filter((block) => block.sensitivity === selector.sensitivity).map((block) => block.id),
    ].map((blockId) => blockId === undefined ? undefined : physicalBlockId(result, blockId)));
  }
  if (selector.kind === "namespace-property") {
    const candidates = [
      ...(result.iptcSemantic?.fields.flatMap((field) => field.candidates) ?? []),
      ...(result.iptcSemantic?.unknown ?? []),
    ].filter((candidate) => candidate.source.namespaceUri === selector.namespaceUri && candidate.source.localName === selector.localName);
    const sourceBlockIds = candidates.map((candidate) => candidate.source.blockId);
    return uniqueBlockIds(sourceBlockIds.map((blockId) => blockId === undefined || blockId === null ? undefined : physicalBlockId(result, blockId)));
  }
  return uniqueBlockIds([
    ...result.fields.filter((field) => fieldMatchesId(field, selector.fieldId)).map((field) => field.source?.blockId),
    ...semanticCandidatesForField(result, selector.fieldId).map((candidate) => candidate.source.blockId),
  ].map((blockId) => blockId === undefined || blockId === null ? undefined : physicalBlockId(result, blockId)));
}

function exactAddressKey(address: ExactRedactionAddress): string {
  if (address.kind === "EXIF") return `${address.kind}:${address.blockId}:${address.directoryId ?? ""}:${address.ifd}:${address.tag}`;
  if (address.kind === "IPTC") return `${address.kind}:${address.blockId}:${address.tag}:${address.occurrence}`;
  return `${address.kind}:${address.blockId}:${address.packetIndex}:${address.namespaceUri}#${address.localName}:${address.order}`;
}

function legacyTargetTouchesExactAddress(target: LegacyRedactionTarget, address: ExactRedactionAddress): boolean {
  if (target === "AllMetadata") return true;
  if (target === "EXIF" || target === "GPS" || target === "SerialNumber") return address.kind === "EXIF";
  if (target === "IPTC") return address.kind === "IPTC";
  if (target === "XMP") return address.kind === "XMP";
  if (address.kind !== "EXIF") return false;
  const fieldName = address.fieldId.startsWith("normalized:") ? address.fieldId.slice("normalized:".length) : address.fieldId;
  return FIELD_TO_LEGACY[fieldName] === target;
}

function exactFailure(bytes: Uint8Array, message: string): SurgeryResult {
  return {
    data: new Uint8Array(bytes),
    format: detectFormat(bytes).format,
    removed: [],
    warnings: [{ code: "REDACTION_SKIPPED", message, severity: "error" }],
  };
}

function xmpPropertyAddress(address: ExactRedactionAddress, packetIndex: number, namespaceUri: string, localName: string, order: number): boolean {
  return address.kind === "XMP" && address.packetIndex === packetIndex && address.namespaceUri === namespaceUri && address.localName === localName && address.order === order;
}

function buildExactXmpEdits(
  result: MetadataResult,
  addresses: readonly ExactRedactionAddress[],
  limits: SecurityLimits,
): { readonly edits: readonly { readonly blockId: string; readonly data: string }[]; readonly removed: number } {
  const xmpAddresses = addresses.filter((address): address is Extract<ExactRedactionAddress, { readonly kind: "XMP" }> => address.kind === "XMP");
  if (xmpAddresses.length === 0) return { edits: [], removed: 0 };
  const packets = result.xmp?.packets ?? [];
  const provenance = result.xmp?.packetProvenance ?? [];
  const edits: { blockId: string; data: string }[] = [];
  let removed = 0;
  const byBlock = new Map<string, Extract<ExactRedactionAddress, { readonly kind: "XMP" }>[] >();
  for (const address of xmpAddresses) byBlock.set(address.blockId, [...(byBlock.get(address.blockId) ?? []), address]);
  for (const [blockId, blockAddresses] of byBlock) {
    const packetIndex = blockAddresses[0]?.packetIndex;
    if (packetIndex === undefined || provenance[packetIndex]?.source !== "embedded") throw new Error(`XMP property ${blockId} is not carried by a directly rewritable standard packet.`);
    const packet = packets[packetIndex];
    if (packet === undefined) throw new Error(`XMP packet ${packetIndex} is missing during exact redaction planning.`);
    const parsed = parseStructuredXmpDetailed(packet, { maxInputBytes: limits.maxStringBytes, maxElements: limits.maxXmpNodes, maxProperties: limits.maxXmpProperties, maxDepth: limits.maxXmpDepth, maxAttributes: limits.maxXmpAttributes, maxNamespaces: limits.maxXmpNamespaces, maxTextBytes: limits.maxXmpTextBytes, maxArrayItems: limits.maxXmpArrayItems, maxQualifiers: limits.maxXmpQualifiers, maxOutputBytes: limits.maxXmpOutputBytes, maxPackets: 1 });
    if (parsed.value?.rdf === undefined || parsed.diagnostics.some((diagnostic) => diagnostic.severity === "error")) throw new Error(`XMP packet ${packetIndex} cannot be safely represented for exact redaction.`);
    const targets = new Set(blockAddresses.map((address) => `${address.namespaceUri}#${address.localName}:${address.order}`));
    let packetRemoved = 0;
    const descriptions = parsed.value.rdf.descriptions.map((description) => {
      const properties = description.properties.filter((property) => {
        const order = property.order;
        const key = `${property.name.namespaceUri}#${property.name.localName}:${order}`;
        if (!targets.has(key) || !blockAddresses.some((address) => xmpPropertyAddress(address, packetIndex, property.name.namespaceUri, property.name.localName, order))) return true;
        packetRemoved += 1;
        return false;
      });
      return { ...description, properties };
    });
    if (packetRemoved === 0) throw new Error(`XMP exact redaction target ${blockId} was not present in its top-level RDF packet.`);
    const document = { ...parsed.value.rdf, descriptions, properties: descriptions.flatMap((description) => description.properties) };
    edits.push({ blockId, data: serializeStructuredXmp(document, { maxOutputBytes: limits.maxXmpOutputBytes }) });
    removed += packetRemoved;
  }
  return { edits, removed };
}

function buildExactIptcEdits(
  result: MetadataResult,
  addresses: readonly ExactRedactionAddress[],
  limits: SecurityLimits,
): { readonly edits: readonly { readonly blockId: string; readonly data: Uint8Array }[]; readonly removeBlocks: readonly string[]; readonly removed: number } {
  const iptcAddresses = addresses.filter((address): address is Extract<ExactRedactionAddress, { readonly kind: "IPTC" }> => address.kind === "IPTC");
  if (iptcAddresses.length === 0) return { edits: [], removeBlocks: [], removed: 0 };
  const fields = result.iptc?.fields ?? [];
  const byBlock = new Map<string, Extract<ExactRedactionAddress, { readonly kind: "IPTC" }>[] >();
  for (const address of iptcAddresses) byBlock.set(address.blockId, [...(byBlock.get(address.blockId) ?? []), address]);
  const edits: { blockId: string; data: Uint8Array }[] = [];
  const removeBlocks: string[] = [];
  let removed = 0;
  for (const [blockId, blockAddresses] of byBlock) {
    if (!blockId.startsWith("jpeg:")) throw new Error(`IPTC field ${blockId} is not carried by a directly rewritable JPEG resource.`);
    const keys = new Set(blockAddresses.map((address) => `${address.tag}:${address.occurrence}`));
    const blockFields = fields.filter((field) => field.source?.blockId === blockId);
    const retained = blockFields.filter((field) => !keys.has(`${field.tag}:${field.occurrence ?? 0}`));
    const blockRemoved = blockFields.length - retained.length;
    if (blockRemoved === 0) throw new Error(`IPTC exact redaction target ${blockId} was not present in its resource.`);
    if (retained.length === 0) removeBlocks.push(blockId);
    else {
      const characterSet = result.iptc?.characterSet === "utf-8" || result.iptc?.characterSet === "latin1"
        ? result.iptc.characterSet
        : undefined;
      edits.push({ blockId, data: serializeIptcIim(retained.map((field) => {
        const raw = field.raw instanceof Uint8Array
          ? field.raw
          : typeof field.raw === "string"
            ? new TextEncoder().encode(field.raw)
            : null;
        if (raw === null) throw new Error(`IPTC field ${field.tag} has no lossless raw value for exact redaction.`);
        return { record: (field.tag >>> 8) & 0xff, dataset: field.tag & 0xff, value: raw, encoding: "binary" as const, occurrence: field.occurrence ?? 0 };
      }), { ...(characterSet === undefined ? {} : { characterSet }), invalidValuePolicy: "preserve-raw", allowExtendedLengths: true, maxOutputBytes: limits.maxMetadataBytes, maxDatasets: limits.maxIptcDatasets }) });
    }
    removed += blockRemoved;
  }
  return { edits, removeBlocks, removed };
}

export async function redactExactMetadata(bytes: Uint8Array, options: RedactOptions, resolution: RedactionResolution, limits: SecurityLimits): Promise<SurgeryResult> {
  const parsed = resolution.parsed;
  if (parsed === undefined) return exactFailure(bytes, "Exact redaction could not access the preflight metadata model.");
  const removeTargets = resolution.exact.filter((mapping) => options.remove.includes(mapping.request));
  const preserveKeys = new Set(resolution.exact.filter((mapping) => (options.preserve ?? []).includes(mapping.request)).flatMap((mapping) => mapping.addresses.map(exactAddressKey)));
  const addresses = removeTargets.flatMap((mapping) => mapping.addresses).filter((address) => !preserveKeys.has(exactAddressKey(address)));
  if (addresses.length === 0) return { data: new Uint8Array(bytes), format: detectFormat(bytes).format, removed: [], warnings: [] };
  try {
    const legacyRemovals = resolution.options?.remove ?? [];
    for (const mapping of resolution.exact) {
      if (!(options.preserve ?? []).includes(mapping.request)) continue;
      const preservedByLegacy = exactLegacyPreservationTargets(parsed, mapping.addresses);
      if (mapping.addresses.some((address) => legacyRemovals.some((target) => legacyTargetTouchesExactAddress(target, address)) && !preservedByLegacy.some((target) => legacyTargetTouchesExactAddress(target, address)))) {
        throw new Error(`Exact preserved target ${targetLabel(mapping.request)} cannot be combined safely with a broad removal selector.`);
      }
    }
    const xmp = buildExactXmpEdits(parsed, addresses, limits);
    const iptc = buildExactIptcEdits(parsed, addresses, limits);
    let current = new Uint8Array(bytes);
    const format = detectFormat(bytes).format;
    if (xmp.edits.length > 0 || iptc.edits.length > 0 || iptc.removeBlocks.length > 0) {
      if (format === "jpeg") {
        const blocks = [
          ...xmp.edits.map((edit) => ({ op: "replace" as const, kind: "standard-xmp" as const, blockId: edit.blockId, data: edit.data })),
          ...iptc.edits.map((edit) => ({ op: "replace" as const, kind: "iptc" as const, blockId: edit.blockId, data: edit.data })),
          ...iptc.removeBlocks.map((blockId) => ({ op: "remove" as const, kind: "iptc" as const, blockId })),
        ];
        current = rewriteJpegMetadata(current, { blocks, duplicatePolicy: "replace-target", verify: true, ...(options.c2pa === undefined ? {} : { c2pa: options.c2pa }) }).data as typeof current;
      } else if (format === "png") {
        if (iptc.edits.length > 0 || iptc.removeBlocks.length > 0) throw new Error("PNG IPTC field redaction has no safe PNG IPTC resource writer.");
        current = (await rewritePngMetadata(current, { blocks: xmp.edits.map((edit) => ({ op: "replace" as const, kind: "xmp" as const, blockId: edit.blockId, data: edit.data })), duplicatePolicy: "replace-target", verify: true, ...(options.c2pa === undefined ? {} : { c2pa: options.c2pa }) })).data as typeof current;
      } else if (format === "webp") {
        if (iptc.edits.length > 0 || iptc.removeBlocks.length > 0) throw new Error("WebP IPTC field redaction has no WebP IPTC resource writer.");
        current = rewriteWebpMetadata(current, { blocks: xmp.edits.map((edit) => ({ op: "replace" as const, kind: "xmp" as const, blockId: edit.blockId, data: edit.data })), duplicatePolicy: "replace-target", verify: true, preservation: { orientationPolicy: "preserve" }, ...(options.c2pa === undefined ? {} : { c2pa: options.c2pa }) }).data as typeof current;
      } else if (xmp.edits.length > 0 || iptc.edits.length > 0 || iptc.removeBlocks.length > 0) {
        throw new Error(`Exact ${format.toUpperCase()} XMP/IPTC redaction is not supported by a lossless container writer.`);
      }
    }
    const exif = addresses.filter((address): address is Extract<ExactRedactionAddress, { readonly kind: "EXIF" }> => address.kind === "EXIF");
    if (exif.length > 0) {
      const seen = new Set<string>();
      const operations: EditOperation[] = [];
      for (const address of exif) {
        const key = exactAddressKey(address);
        if (seen.has(key)) continue;
        seen.add(key);
        operations.push({ operationId: `redact-${operations.length}`, op: "delete", target: { kind: "field", fieldId: address.fieldId } });
      }
      const edited = await editMetadata(current, { operations, policy: { verification: "reparse-and-preserve-payload", duplicates: "preserve", orientation: "allow-change" }, limits });
      if (!edited.successful) throw new Error(edited.diagnostics.map((diagnostic) => diagnostic.detail).join("; ") || "The exact EXIF redaction transaction was not applied.");
      current = edited.data as typeof current;
    }
    const counts = new Map<RedactionTarget, number>();
    for (const mapping of removeTargets) {
      const count = mapping.addresses.filter((address) => !preserveKeys.has(exactAddressKey(address))).length;
      if (count > 0) counts.set(mapping.request, count);
    }
    const exactRemoved = [...counts].map(([target, occurrences]) => ({ target, occurrences }));
    if (legacyRemovals.length > 0) {
      const legacy = redactBytes(current, resolution.options as LegacyRedactOptions, limits);
      if (legacy.warnings.some((warning) => warning.code === "REDACTION_SKIPPED" || warning.severity === "error")) {
        throw new Error(legacy.warnings.map((warning) => warning.message).join("; "));
      }
      current = legacy.data as typeof current;
      return { data: current, format, removed: [...exactRemoved, ...legacy.removed], warnings: legacy.warnings };
    }
    return { data: current, format, removed: exactRemoved, warnings: [] };
  } catch (error) {
    return exactFailure(bytes, error instanceof Error ? `Exact redaction failed safely: ${error.message}` : "Exact redaction failed safely.");
  }
}

function preflightFailure(bytes: Uint8Array, warnings: readonly MetadataWarning[]): SurgeryResult {
  return { data: new Uint8Array(bytes), format: detectFormat(bytes).format, removed: [], warnings };
}

function buildLegacyOptions(
  options: RedactOptions,
  removeMappings: readonly RedactionTargetMapping[],
  preserveMappings: readonly RedactionTargetMapping[],
): LegacyRedactOptions {
  const remove = [...new Set(removeMappings.flatMap((mapping) => mapping.legacyTargets))];
  const preserve = [...new Set(preserveMappings.flatMap((mapping) => mapping.legacyTargets))];
  const scopes = [...removeMappings, ...preserveMappings].flatMap((mapping) => mapping.blockIds.length === 0
    ? []
    : mapping.legacyTargets.map((target) => ({ target, blockIds: mapping.blockIds })));
  const base = {
    ...(options.limits === undefined ? {} : { limits: options.limits }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  };
  return {
    ...base,
    remove,
    ...(preserve.length === 0 ? {} : { preserve }),
    ...(scopes.length === 0 ? {} : { scopes }),
  };
}

function optionWarnings(options: RedactOptions, limits: SecurityLimits): MetadataWarning[] {
  const warnings: MetadataWarning[] = [];
  const values: readonly RedactionTarget[] = [...options.remove, ...(options.preserve ?? [])];
  for (const target of values) {
    const rendered = targetLabel(target);
    if (typeof target !== "string" || VALID_TARGETS.has(target) || warnings.some(({ message }) => message.includes(rendered))) continue;
    if (warnings.length >= limits.maxWarnings) break;
    warnings.push({ code: "REDACTION_SKIPPED", message: `Unknown redaction target ${rendered}; no matching metadata was changed.`, severity: "warning" });
  }
  return warnings;
}

function isScopedOptions(options: RedactOptions | LegacyRedactOptions): options is LegacyRedactOptions {
  return Object.hasOwn(options, "scopes");
}

function withOptionWarnings(result: SurgeryResult, options: RedactOptions, limits: SecurityLimits): SurgeryResult {
  const warnings = [...optionWarnings(options, limits), ...result.warnings].slice(0, limits.maxWarnings);
  return warnings.length === result.warnings.length ? result : { ...result, warnings };
}

function normalizeStatic(options: RedactOptions, limits: SecurityLimits): RedactionResolution {
  const requests = [...options.remove, ...(options.preserve ?? [])];
  const mappings = requests.map((request) => ({ request, legacyTargets: staticTarget(request), blockIds: [] }));
  const warnings = mappings.filter(({ legacyTargets }) => legacyTargets.length === 0).slice(0, limits.maxWarnings).map(({ request }) => ({ code: "REDACTION_SKIPPED" as const, message: `Unsupported redaction selector ${targetLabel(request)} was rejected before mutation.`, severity: "error" as const }));
  if (warnings.length > 0) return { options: null, mappings, exact: [], warnings };
  const removeMappings = mappings.filter(({ request }) => options.remove.includes(request));
  const preserveMappings = mappings.filter(({ request }) => (options.preserve ?? []).includes(request));
  return { options: buildLegacyOptions(options, removeMappings, preserveMappings), mappings, exact: [], warnings: [] };
}

/** Resolve typed selectors against the same parsed fields and provenance blocks
 * used by readers. This pass completes before any surgery engine is called. */
export async function resolveRedactionOptions(bytes: Uint8Array, options: RedactOptions, limits: SecurityLimits): Promise<RedactionResolution> {
  const hasTypedTarget = [...options.remove, ...(options.preserve ?? [])].some((target) => typeof target !== "string");
  if (!hasTypedTarget) return normalizeStatic(options, limits);
  const { parseMetadata } = await import("../index.js");
  const parsed = await parseMetadata(bytes, { limits, ...(options.registry === undefined ? {} : { registry: options.registry }), select: { groups: ["Dimensions", "EXIF", "XMP", "IPTC", "ICC", "JFIF", "PNGText"] } });
  const requests = [...options.remove, ...(options.preserve ?? [])];
  const exact = requests.map((request) => ({ request, addresses: exactAddressesForTarget(parsed, request) }));
  const mappings = requests.map((request, index) => {
    const exactMapping = exact[index];
    const preserving = (options.preserve ?? []).includes(request);
    const legacyTargets = exactMapping !== undefined && exactMapping.addresses.length > 0
      ? preserving ? exactLegacyPreservationTargets(parsed, exactMapping.addresses) : []
      : matchingLegacyTargets(parsed, request);
    return { request, legacyTargets, blockIds: matchingBlockIds(parsed, request) };
  });
  const warnings = mappings.filter(({ legacyTargets }, index) => (exact[index]?.addresses.length ?? 0) === 0 && legacyTargets.length === 0).slice(0, limits.maxWarnings).map(({ request }) => ({ code: "REDACTION_SKIPPED" as const, message: `Unsupported or unmatched redaction selector ${targetLabel(request)} was rejected before mutation.`, severity: "error" as const }));
  const legacyRemovals = mappings.filter(({ request }) => options.remove.includes(request)).flatMap(({ legacyTargets }) => legacyTargets);
  const unsafePreserves = exact.filter((mapping) => (options.preserve ?? []).includes(mapping.request)).flatMap((mapping) => {
    const preservedByLegacy = exactLegacyPreservationTargets(parsed, mapping.addresses);
    return mapping.addresses.some((address) => legacyRemovals.some((target) => legacyTargetTouchesExactAddress(target, address)) && !preservedByLegacy.some((target) => legacyTargetTouchesExactAddress(target, address)))
      ? [mapping.request]
      : [];
  });
  const policyWarnings = unsafePreserves.slice(0, Math.max(0, limits.maxWarnings - warnings.length)).map((request) => ({ code: "REDACTION_SKIPPED" as const, message: `Exact preserved target ${targetLabel(request)} cannot be combined safely with a broad removal selector.`, severity: "error" as const }));
  const allWarnings = [...warnings, ...policyWarnings];
  if (allWarnings.length > 0) return { options: null, mappings, exact, parsed, warnings: allWarnings };
  const removeMappings = mappings.filter(({ request }) => options.remove.includes(request));
  const preserveMappings = mappings.filter(({ request }) => (options.preserve ?? []).includes(request));
  return { options: buildLegacyOptions(options, removeMappings, preserveMappings), mappings, exact, parsed, warnings: [] };
}

export function redactionPreflightResult(bytes: Uint8Array, resolution: RedactionResolution): SurgeryResult {
  return preflightFailure(bytes, resolution.warnings);
}

function exactMappingForRequest(resolution: RedactionResolution, request: RedactionTarget, used: ReadonlySet<RedactionExactMapping>): RedactionExactMapping | undefined {
  return resolution.exact.find((mapping) => mapping.request === request && !used.has(mapping));
}

/** Attach operation-ID and physical-coverage evidence to typed redaction
 * results. This is intentionally separate from warning rendering so outcome
 * evaluation never depends on human-readable diagnostic text. */
export function attachRedactionOperationEvidence(result: SurgeryResult, options: RedactOptions, resolution: RedactionResolution): SurgeryResult {
  const used = new Set<RedactionExactMapping>();
  const operations: RedactionOperationEvidence[] = options.remove.map((request, index) => {
    const mapping = resolution.mappings.find((candidate) => candidate.request === request);
    const exact = exactMappingForRequest(resolution, request, used);
    if (exact !== undefined) used.add(exact);
    const exactAddresses = exact?.addresses ?? [];
    const direct = result.removed.find((record) => record.target === request);
    const legacyCount = mapping === undefined
      ? 0
      : result.removed.filter((record) => typeof record.target === "string" && mapping.legacyTargets.includes(record.target)).reduce((total, record) => total + record.occurrences, 0);
    const appliedCount = direct?.occurrences ?? legacyCount;
    const failure = result.warnings.find((warning) => warning.code === "REDACTION_SKIPPED" || warning.severity === "error");
    const matchedBlockIds = uniqueBlockIds([
      ...exactAddresses.map((address) => address.blockId),
      ...(mapping?.blockIds ?? []),
    ]);
    const candidateCount = exactAddresses.length > 0 ? exactAddresses.length : matchedBlockIds.length;
    return {
      operationId: `redaction-remove-${index}`,
      target: request,
      status: failure === undefined && appliedCount > 0 ? "applied" : "rejected",
      candidateCount,
      appliedCount,
      matchedFieldIds: [...new Set(exactAddresses.map((address) => address.fieldId))],
      matchedBlockIds,
      failureCode: failure?.code ?? (appliedCount > 0 ? null : "REDACTION_SKIPPED"),
    };
  });
  return { ...result, operations };
}

/**
 * Synchronously redact an already materialized byte array using resolved limits.
 * JPEG and PNG metadata writers operate without decoding or recompressing pixels.
 */
export function redactBytes(
  bytes: Uint8Array,
  options: RedactOptions | LegacyRedactOptions,
  limits: SecurityLimits,
): SurgeryResult {
  const resolution = isScopedOptions(options)
    ? { options, mappings: [], exact: [], warnings: [] } satisfies RedactionResolution
    : normalizeStatic(options, limits);
  if (resolution.options === null) return redactionPreflightResult(bytes, resolution);
  const legacyOptions = resolution.options;
  const c2paFailure = c2paMutationFailure(bytes, legacyOptions.c2pa, limits);
  if (c2paFailure !== null) return { data: new Uint8Array(bytes), format: detectFormat(bytes).format, removed: [], warnings: [{ code: "UNSUPPORTED_STRUCTURE", message: c2paFailure, severity: "error" }] };
  const detection = detectFormat(bytes);
  const beginsWithSoi = bytes[0] === 0xff && bytes[1] === 0xd8;
  if (detection.format === "jpeg" || beginsWithSoi) {
    return withOptionWarnings(redactJpeg(bytes, legacyOptions, limits), legacyOptions, limits);
  }
  if (detection.format === "png") return withOptionWarnings(redactPng(bytes, legacyOptions, limits), legacyOptions, limits);
  if (detection.format === "webp") return withOptionWarnings(redactWebp(bytes, legacyOptions, limits), legacyOptions, limits);

  const warnings: MetadataWarning[] = [];
  if (limits.maxWarnings > 0) {
  warnings.push({
      code: "UNSUPPORTED_FORMAT",
      message:
        detection.format === "unknown"
          ? "Metadata redaction requires a recognized JPEG input."
          : `Lossless metadata redaction is not implemented for ${detection.format.toUpperCase()}.`,
      severity: "warning",
    });
  }

  return {
    data: new Uint8Array(bytes),
    format: detection.format,
    removed: [],
    warnings: [...warnings, ...optionWarnings(options, limits)].slice(0, limits.maxWarnings),
  };
}
