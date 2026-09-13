import { parseStructuredXmpDetailed, type XmpProperty, type XmpValue } from "../metadata/xmp.js";
import type {
  IptcSemanticCandidate,
  MetadataField,
  MetadataResult,
  PrivacyFindingCategory,
  PrivacyFindingState,
  SecurityLimits,
  Sensitivity,
} from "../types.js";

export interface SemanticPrivacyFinding {
  readonly target: string;
  readonly fieldId: string;
  readonly blockId: string | null;
  readonly category: PrivacyFindingCategory;
  readonly state: PrivacyFindingState;
  readonly sensitivity: Sensitivity;
  readonly reason: string;
  readonly namespaceUri?: string;
  readonly localName?: string;
  readonly packetIndex?: number;
  readonly occurrence?: number;
  readonly sourceOffset?: number | null;
  readonly sourceLength?: number | null;
  readonly validation?: string;
  readonly rawValue?: unknown;
}

export interface SemanticPrivacyInspection {
  readonly findings: readonly SemanticPrivacyFinding[];
  readonly complete: boolean;
  readonly diagnostics: readonly string[];
}

const EXIF_CATEGORY_RULES: readonly { readonly pattern: RegExp; readonly category: PrivacyFindingCategory; readonly sensitivity: Sensitivity; readonly reason: string }[] = [
  { pattern: /Prompt|PromptWriter|AIPrompt/iu, category: "prompt", sensitivity: "high", reason: "AI prompts and prompt-writer metadata can disclose private instructions, tools, or provenance." },
  { pattern: /Face|ImageRegion|RegionInfo|Crop|SubjectArea|Area/u, category: "region", sensitivity: "high", reason: "Face and region metadata can identify or locate people within the image." },
  { pattern: /Serial|CameraOwner|OwnerID|DeviceID|DeviceIdentifier/u, category: "serial-identifier", sensitivity: "high", reason: "Camera, lens, device, or owner serial identifiers can identify equipment or its owner." },
  { pattern: /GPS|Latitude|Longitude|Altitude|City|Country|Province|Sublocation|Location/u, category: "location", sensitivity: "high", reason: "Location metadata can identify where the image was captured or depicts." },
  { pattern: /Contact|Email|Phone|Address|Licensor|Release/u, category: "contact", sensitivity: "high", reason: "Contact and release metadata can identify a person or organization or disclose private contact details." },
  { pattern: /Creator|Artist|Author|Byline|Photographer|ImageEditor/u, category: "creator", sensitivity: "high", reason: "A creator, author, byline, or photographer identity can identify a person or organization." },
  { pattern: /Person|Depicted|Owner/u, category: "person", sensitivity: "high", reason: "A person or owner name can identify an individual or organization represented in the metadata." },
  { pattern: /Device|Firmware|LensMake|LensModel|Make|Model/u, category: "device-identifier", sensitivity: "high", reason: "Camera, lens, device, or firmware metadata can identify equipment or its owner." },
  { pattern: /Document|Instance|OriginalDocument|Manifest/u, category: "document-identifier", sensitivity: "high", reason: "Document and workflow identifiers can link this file to an editing history or source document." },
  { pattern: /Date|Time|Timestamp|Created|Digitized|Modify/u, category: "timestamp", sensitivity: "moderate", reason: "Capture, creation, and modification times can reveal a person’s schedule or the file’s history." },
  { pattern: /AI|Workflow|SystemUsed|Generator|ModelVersion|History/u, category: "workflow", sensitivity: "high", reason: "AI system, version, document, and workflow metadata can disclose private tools or editing history." },
  { pattern: /Thumbnail|Preview|JPEGInterchange|RelatedImage|AssociatedImage|MPF/u, category: "embedded-preview", sensitivity: "high", reason: "Embedded previews and associated images can contain pixels or metadata that were not covered by the primary-image policy." },
  { pattern: /Keyword|Caption|Description|Headline|Title|Comment|Copyright|Rights|License/u, category: "descriptive", sensitivity: "moderate", reason: "Descriptive, rights, and editorial metadata can disclose private context or contractual information." },
];

const XMP_NAMESPACE_HINTS: Readonly<Record<string, string>> = {
  "http://ns.adobe.com/exif/1.0/": "EXIF",
  "http://ns.adobe.com/photoshop/1.0/": "Photoshop",
  "http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/": "IPTC Core",
  "http://iptc.org/std/Iptc4xmpExt/2008-02-29/": "IPTC Extension",
  "http://purl.org/dc/elements/1.1/": "Dublin Core",
  "http://ns.adobe.com/xap/1.0/": "XMP",
  "http://ns.adobe.com/xap/1.0/rights/": "XMP Rights",
  "http://ns.useplus.org/ldf/xmp/1.0/": "PLUS",
};

function sensitivityMax(left: Sensitivity, right: Sensitivity): Sensitivity {
  const rank: Readonly<Record<Sensitivity, number>> = { none: 0, low: 1, moderate: 2, high: 3 };
  return rank[left] >= rank[right] ? left : right;
}

function categoryForName(name: string): { readonly category: PrivacyFindingCategory; readonly sensitivity: Sensitivity; readonly reason: string } | null {
  for (const rule of EXIF_CATEGORY_RULES) if (rule.pattern.test(name)) return rule;
  return null;
}

function displayTarget(field: MetadataField): string {
  return field.id.length > 0 ? field.id : `${field.ifd}:${field.tag}`;
}

function rawForFinding(value: unknown, includeRawValues: boolean): unknown {
  if (!includeRawValues) return undefined;
  if (value instanceof Uint8Array) return value.slice();
  return value;
}

function isOpaque(value: unknown): boolean {
  return value instanceof Uint8Array || value === null || typeof value === "undefined";
}

function fieldFinding(field: MetadataField, includeRawValues: boolean): SemanticPrivacyFinding | null {
  const rule = categoryForName(field.name);
  if (rule === null && field.sensitivity === "none") return null;
  const selected = rule ?? semanticCategory(field.id, field.name);
  const opaque = isOpaque(field.value) || field.type === "UNKNOWN";
  return {
    target: displayTarget(field),
    fieldId: field.id,
    blockId: field.source?.blockId ?? null,
    category: selected.category,
    state: opaque ? "opaque-risk" : "decoded-finding",
    sensitivity: sensitivityMax(field.sensitivity, selected.sensitivity),
    reason: opaque ? `${selected.reason} Its value is opaque or unavailable, so it remains a risk.` : selected.reason,
    ...(field.source?.valueOffset === undefined ? {} : { sourceOffset: field.source.valueOffset }),
    ...(field.source?.valueLength === undefined ? {} : { sourceLength: field.source.valueLength }),
    ...(rawForFinding(field.value, includeRawValues) === undefined ? {} : { rawValue: rawForFinding(field.value, includeRawValues) }),
  };
}

function semanticCategory(fieldId: string, name: string): { readonly category: PrivacyFindingCategory; readonly sensitivity: Sensitivity; readonly reason: string } {
  const identity = `${fieldId} ${name}`;
  const generatedRules: readonly { readonly pattern: RegExp; readonly category: PrivacyFindingCategory; readonly sensitivity: Sensitivity; readonly reason: string }[] = [
    { pattern: /digitalImageGuid|documentId|instanceId|historyId|eventId|jobid/iu, category: "document-identifier", sensitivity: "high", reason: "Document, event, and workflow identifiers can link this file to an editing history or source document." },
    { pattern: /locationCreated|locationsShown|sublocationName|provinceState|countryName|countryCode/iu, category: "location", sensitivity: "high", reason: "Location metadata can identify where the image was captured or depicts." },
    { pattern: /personInImage|personsShown|depicted/iu, category: "person", sensitivity: "high", reason: "A depicted-person name can identify an individual represented in the image metadata." },
    { pattern: /imageCreators|creatorNames|contributors/iu, category: "creator", sensitivity: "high", reason: "A creator or contributor identity can identify a person or organization." },
    { pattern: /creatorContact|licensors|suppliers|contact/iu, category: "contact", sensitivity: "high", reason: "Contact, supplier, and licensor metadata can identify a person or organization or disclose private contact details." },
    { pattern: /imageRegion|face|subjectArea|crop/iu, category: "region", sensitivity: "high", reason: "Face and region metadata can identify or locate people within the image." },
    { pattern: /aIPrompt|promptWriter/iu, category: "prompt", sensitivity: "high", reason: "AI prompts and prompt-writer metadata can disclose private instructions, tools, or provenance." },
    { pattern: /aISystem|dataMining|workflow|registryEntries/iu, category: "workflow", sensitivity: "high", reason: "AI system, data-mining, registry, and workflow metadata can disclose private tools or editing history." },
  ];
  for (const generatedRule of generatedRules) if (generatedRule.pattern.test(identity)) return generatedRule;
  const rule = categoryForName(identity);
  if (rule !== null) return rule;
  if (/keyword|caption|description|headline|title/iu.test(`${fieldId} ${name}`)) return { category: "descriptive", sensitivity: "moderate", reason: "Descriptive metadata can disclose private context or editorial information." };
  if (/rights|license|copyright|owner|release/iu.test(`${fieldId} ${name}`)) return { category: "person", sensitivity: "high", reason: "Rights and licensing metadata can identify people, organizations, or contractual information." };
  return { category: "descriptive", sensitivity: "moderate", reason: "A non-technical registry field is retained as a privacy-relevant candidate until a policy classifies it." };
}

function candidateFinding(candidate: IptcSemanticCandidate, fieldId: string, fieldName: string, includeRawValues: boolean, unknown: boolean): SemanticPrivacyFinding {
  const category = unknown ? { category: "unknown-xmp" as const, sensitivity: "high" as const, reason: "Unknown XMP or IPTC semantic data may contain undiscovered sensitive information and is fail-closed." } : semanticCategory(fieldId, fieldName);
  const opaque = unknown || isOpaque(candidate.value);
  return {
    target: candidate.source.kind === "xmp"
      ? `XMP:${candidate.source.namespaceUri ?? "unresolved"}#${candidate.source.localName ?? fieldId}`
      : candidate.source.fieldId,
    fieldId: candidate.source.fieldId,
    blockId: candidate.source.blockId ?? null,
    category: category.category,
    state: opaque ? "opaque-risk" : "decoded-finding",
    sensitivity: category.sensitivity,
    reason: opaque ? `${category.reason} The value remains opaque or was not recognized.` : category.reason,
    ...(candidate.source.namespaceUri === undefined ? {} : { namespaceUri: candidate.source.namespaceUri }),
    ...(candidate.source.localName === undefined ? {} : { localName: candidate.source.localName }),
    ...(candidate.source.packetIndex === undefined ? {} : { packetIndex: candidate.source.packetIndex }),
    ...(candidate.source.occurrence === undefined ? {} : { occurrence: candidate.source.occurrence }),
    ...(candidate.source.offset === undefined ? {} : { sourceOffset: candidate.source.offset }),
    ...(candidate.source.length === undefined ? {} : { sourceLength: candidate.source.length }),
    ...(candidate.validation === "valid" ? {} : { validation: candidate.validation }),
    ...(rawForFinding(candidate.raw, includeRawValues) === undefined ? {} : { rawValue: rawForFinding(candidate.raw, includeRawValues) }),
  };
}

function knownXmpProperties(result: MetadataResult): ReadonlySet<string> {
  const values = new Set<string>();
  for (const field of result.iptcSemantic?.fields ?? []) {
    for (const candidate of field.candidates) {
      if (candidate.source.kind === "xmp" && candidate.source.namespaceUri !== undefined && candidate.source.localName !== undefined) values.add(`${candidate.source.namespaceUri}#${candidate.source.localName}`);
    }
  }
  return values;
}

function inspectNestedXmp(
  value: XmpValue,
  packetIndex: number,
  blockId: string | null,
  known: ReadonlySet<string>,
  includeRawValues: boolean,
  limits: SecurityLimits,
  findings: SemanticPrivacyFinding[],
  depth: number,
): void {
  if (depth > limits.maxIptcStructureDepth || findings.length >= limits.maxIptcCandidates) return;
  if (value.kind === "resource" || value.kind === "blank-node" || value.kind === "typed-resource") {
    for (const property of value.properties.slice(0, limits.maxXmpProperties)) {
      inspectXmpProperty(property, packetIndex, blockId, known, includeRawValues, limits, findings, depth + 1);
      if (findings.length >= limits.maxIptcCandidates) return;
    }
  } else if (value.kind === "array") {
    for (const item of value.items.slice(0, limits.maxXmpArrayItems)) {
      inspectNestedXmp(item, packetIndex, blockId, known, includeRawValues, limits, findings, depth + 1);
      if (findings.length >= limits.maxIptcCandidates) return;
    }
  }
}

function inspectXmpProperty(
  property: XmpProperty,
  packetIndex: number,
  blockId: string | null,
  known: ReadonlySet<string>,
  includeRawValues: boolean,
  limits: SecurityLimits,
  findings: SemanticPrivacyFinding[],
  depth: number,
): void {
  if (findings.length >= limits.maxIptcCandidates || depth > limits.maxIptcStructureDepth) return;
  const namespaceUri = property.name.namespaceUri;
  const localName = property.name.localName;
  const identity = `${namespaceUri}#${localName}`;
  const rule = categoryForName(`${XMP_NAMESPACE_HINTS[namespaceUri] ?? "XMP"} ${localName}`);
  if (!known.has(identity) || rule !== null) {
    const category = !known.has(identity)
      ? { category: "unknown-xmp" as const, sensitivity: "high" as const, reason: "Unknown XMP properties are privacy risk because their semantics are not established by the registry." }
      : rule ?? { category: "metadata-presence" as const, sensitivity: "moderate" as const, reason: "Structured metadata is retained as a privacy-relevant candidate." };
    const opaque = property.value.kind !== "literal" || property.value.lexicalValue.length === 0;
    findings.push({
      target: `XMP:${namespaceUri}#${localName}`,
      fieldId: `XMP:${namespaceUri}:${localName}:${packetIndex}:${property.order}`,
      blockId,
      category: category.category,
      state: opaque ? "opaque-risk" : "decoded-finding",
      sensitivity: category.sensitivity,
      reason: opaque ? `${category.reason} The structured value is retained as opaque risk.` : category.reason,
      namespaceUri,
      localName,
      packetIndex,
      sourceOffset: property.sourceStart,
      sourceLength: property.sourceEnd - property.sourceStart,
      ...(includeRawValues && property.value.kind === "literal" ? { rawValue: property.value.lexicalValue } : {}),
    });
  }
  inspectNestedXmp(property.value, packetIndex, blockId, known, includeRawValues, limits, findings, depth + 1);
}

export function inspectSemanticPrivacyDetailed(result: MetadataResult, limits: SecurityLimits, includeRawValues = false): SemanticPrivacyInspection {
  const findings: SemanticPrivacyFinding[] = [];
  const diagnostics: string[] = [];
  let complete = true;
  const addFinding = (finding: SemanticPrivacyFinding): void => {
    if (findings.length < limits.maxIptcCandidates) findings.push(finding);
    else {
      complete = false;
      if (!diagnostics.includes("Semantic privacy finding output reached its configured limit.")) diagnostics.push("Semantic privacy finding output reached its configured limit.");
    }
  };
  const fields = [...result.fields, ...(result.exif?.fields ?? [])];
  const seen = new Set<string>();
  for (const field of fields) {
    if (seen.has(field.id)) continue;
    seen.add(field.id);
    const finding = fieldFinding(field, includeRawValues);
    if (finding !== null) addFinding(finding);
  }
  for (const field of result.iptcSemantic?.fields ?? []) {
    if (field.candidates.length > limits.maxIptcCandidates) {
      complete = false;
      diagnostics.push("IPTC semantic candidate limit was reached; additional candidates remain uninspected.");
    }
    for (const candidate of field.candidates.slice(0, limits.maxIptcCandidates)) addFinding(candidateFinding(candidate, field.id, field.name, includeRawValues, false));
  }
  for (const candidate of result.iptcSemantic?.unknown ?? []) {
    addFinding(candidateFinding(candidate, candidate.source.fieldId, "unknown", includeRawValues, true));
  }
  if ((result.iptcSemantic?.unknown.length ?? 0) > limits.maxIptcCandidates) {
    complete = false;
    diagnostics.push("Unknown IPTC/XMP candidate limit was reached; additional unknown candidates remain uninspected.");
  }
  const known = knownXmpProperties(result);
  if ((result.xmp?.packets.length ?? 0) > limits.maxXmpPackets) {
    complete = false;
    diagnostics.push("XMP packet limit was reached; additional packets remain uninspected.");
  }
  for (let packetIndex = 0; packetIndex < Math.min(result.xmp?.packets.length ?? 0, limits.maxXmpPackets); packetIndex += 1) {
    const packet = result.xmp?.packets[packetIndex];
    if (packet === undefined) continue;
    if (packet.length > limits.maxStringBytes) {
      complete = false;
      diagnostics.push(`XMP packet ${packetIndex} exceeds the semantic inspection byte limit.`);
    }
    const parsed = parseStructuredXmpDetailed(packet, { maxInputBytes: limits.maxStringBytes, maxElements: limits.maxXmpNodes, maxProperties: limits.maxXmpProperties, maxDepth: limits.maxXmpDepth, maxAttributes: limits.maxXmpAttributes, maxNamespaces: limits.maxXmpNamespaces, maxTextBytes: limits.maxXmpTextBytes, maxArrayItems: limits.maxXmpArrayItems, maxQualifiers: limits.maxXmpQualifiers, maxOutputBytes: limits.maxXmpOutputBytes, maxPackets: 1 });
    if (parsed.diagnostics.length > 0) {
      complete = false;
      diagnostics.push(...parsed.diagnostics.map((item) => `XMP packet ${packetIndex}: ${item.code}.`));
    }
    const blockId = result.xmp?.packetProvenance?.[packetIndex]?.blockIds[0] ?? null;
    for (const property of parsed.value?.rdf?.properties.slice(0, limits.maxXmpProperties) ?? []) {
      inspectXmpProperty(property, packetIndex, blockId, known, includeRawValues, limits, findings, 0);
      if (findings.length >= limits.maxIptcCandidates) {
        complete = false;
        break;
      }
    }
  }
  return { findings, complete, diagnostics: [...new Set(diagnostics)] };
}

export function inspectSemanticPrivacy(result: MetadataResult, limits: SecurityLimits, includeRawValues = false): readonly SemanticPrivacyFinding[] {
  return inspectSemanticPrivacyDetailed(result, limits, includeRawValues).findings;
}
