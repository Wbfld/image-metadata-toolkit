import type { PrivacyAuditResult, PrivacyFinding } from "./audit.js";
import type { PrivacyFindingCategory, PrivacyFindingState, PrivacyPolicyId, RedactionTarget } from "../types.js";
import { DEFAULT_METADATA_REGISTRY, type MetadataRegistry } from "../registry.js";

export interface PrivacyPolicy {
  readonly id: PrivacyPolicyId;
  readonly version: string;
  readonly inspectedFamilies: readonly string[];
  readonly removeCategories: readonly PrivacyFindingCategory[];
  readonly allowedCategories: readonly PrivacyFindingCategory[];
  readonly allowedOpaqueCategories: readonly PrivacyFindingCategory[];
  readonly retainedTechnicalMetadata: readonly string[];
  readonly failureBehavior: "strict-no-output" | "report-only";
  readonly requireCompleteCoverage: boolean;
  /** Explicit review ledger for the generated sensitive registry fields. */
  readonly reviewedSensitiveFieldIds: readonly string[];
  readonly reviewedRegistryHash: string;
  /** Exact generated-field scope reviewed for this policy. Empty family and
   * namespace rules are intentional: policy removal never falls back to a
   * whole physical family or prefix. */
  readonly removalFieldIds: readonly string[];
  readonly removalFamilies: readonly string[];
  readonly removalNamespaceProperties: readonly { readonly namespaceUri: string; readonly localName: string }[];
  readonly changeLog: readonly string[];
}

export interface PrivacyPolicyRegistryCoverage {
  readonly registryHash: string;
  readonly registryFieldCount: number;
  readonly sensitiveFieldIds: readonly string[];
  readonly reviewedSensitiveFieldIds: readonly string[];
  readonly reviewedRegistryHash: string;
  readonly reviewedRegistryHashMatches: boolean;
  readonly missingSensitiveFieldIds: readonly string[];
  readonly staleReviewedSensitiveFieldIds: readonly string[];
  readonly complete: boolean;
}

export interface PrivacyPolicyReport {
  readonly policyId: PrivacyPolicyId;
  readonly policyVersion: string;
  readonly passed: boolean;
  readonly complete: boolean;
  readonly coverage: PrivacyAuditResult["coverage"];
  readonly blockedFindings: readonly PrivacyPolicyFinding[];
  readonly removedFindingTargets: readonly string[];
  readonly unresolvedFindingTargets: readonly string[];
  readonly registryCoverage: PrivacyPolicyRegistryCoverage;
  readonly diagnostics: readonly string[];
}

export interface PrivacyPolicyFinding {
  readonly target: string;
  readonly category: PrivacyFindingCategory;
  readonly state: PrivacyFindingState;
  readonly sensitivity: PrivacyFinding["sensitivity"];
  readonly fieldId?: string;
  readonly blockId?: string | null;
  readonly reasonCode: PrivacyFinding["reasonCode"];
}

const SENSITIVE_CATEGORIES: readonly PrivacyFindingCategory[] = [
  "location", "person", "creator", "contact", "descriptive", "serial-identifier", "device-identifier", "timestamp", "document-identifier", "region", "prompt", "workflow", "embedded-preview", "unknown-xmp", "opaque-block", "unsupported-structure",
];

const ALL_FAMILIES = Object.freeze(["EXIF", "XMP", "IPTC", "ICC", "JFIF", "PNGText", "MakerNote", "Photoshop", "MPF", "Unknown"]);

/**
 * This is a checked-in review ledger, not a live projection of the registry.
 * A generated sensitive field therefore creates a visible coverage failure
 * until a maintainer reviews and intentionally updates every affected policy.
 */
const REVIEWED_SENSITIVE_FIELD_IDS = Object.freeze([
  "ExifIFD:0x9003", "ExifIFD:0x9004", "ExifIFD:0x9010", "ExifIFD:0x9011", "ExifIFD:0x9012", "ExifIFD:0x9214", "ExifIFD:0x927c", "ExifIFD:0x9286", "ExifIFD:0x9287", "ExifIFD:0x9290", "ExifIFD:0x9291", "ExifIFD:0x9292", "ExifIFD:0x9400", "ExifIFD:0x9401", "ExifIFD:0x9402", "ExifIFD:0x9403", "ExifIFD:0x9404", "ExifIFD:0x9405", "ExifIFD:0xa004", "ExifIFD:0xa40b", "ExifIFD:0xa40e", "ExifIFD:0xa420", "ExifIFD:0xa430", "ExifIFD:0xa431", "ExifIFD:0xa433", "ExifIFD:0xa434", "ExifIFD:0xa435", "ExifIFD:0xa436", "ExifIFD:0xa437", "ExifIFD:0xa438", "ExifIFD:0xa439", "ExifIFD:0xa43a", "ExifIFD:0xa43b", "ExifIFD:0xa43c",
  "GPSIFD:0x0000", "GPSIFD:0x0001", "GPSIFD:0x0002", "GPSIFD:0x0003", "GPSIFD:0x0004", "GPSIFD:0x0005", "GPSIFD:0x0006", "GPSIFD:0x0007", "GPSIFD:0x0008", "GPSIFD:0x0009", "GPSIFD:0x000a", "GPSIFD:0x000b", "GPSIFD:0x000c", "GPSIFD:0x000d", "GPSIFD:0x000e", "GPSIFD:0x000f", "GPSIFD:0x0010", "GPSIFD:0x0011", "GPSIFD:0x0012", "GPSIFD:0x0013", "GPSIFD:0x0014", "GPSIFD:0x0015", "GPSIFD:0x0016", "GPSIFD:0x0017", "GPSIFD:0x0018", "GPSIFD:0x0019", "GPSIFD:0x001a", "GPSIFD:0x001b", "GPSIFD:0x001c", "GPSIFD:0x001d", "GPSIFD:0x001e", "GPSIFD:0x001f",
  "IFD0:0x010e", "IFD0:0x010f", "IFD0:0x0110", "IFD0:0x0131", "IFD0:0x0132", "IFD0:0x013b", "IFD0:0x8298", "IFD0:0x8825",
]);

function stableHash(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

const REVIEWED_REGISTRY_HASH = stableHash(REVIEWED_SENSITIVE_FIELD_IDS.join("\n"));

function freezePolicy(policy: PrivacyPolicy): PrivacyPolicy {
  return Object.freeze({
    ...policy,
    inspectedFamilies: Object.freeze([...policy.inspectedFamilies]),
    removeCategories: Object.freeze([...policy.removeCategories]),
    allowedCategories: Object.freeze([...policy.allowedCategories]),
    allowedOpaqueCategories: Object.freeze([...policy.allowedOpaqueCategories]),
    retainedTechnicalMetadata: Object.freeze([...policy.retainedTechnicalMetadata]),
    reviewedSensitiveFieldIds: Object.freeze([...policy.reviewedSensitiveFieldIds]),
    removalFieldIds: Object.freeze([...policy.removalFieldIds]),
    removalFamilies: Object.freeze([...policy.removalFamilies]),
    removalNamespaceProperties: Object.freeze(policy.removalNamespaceProperties.map((item) => Object.freeze({ ...item }))),
    changeLog: Object.freeze([...policy.changeLog]),
  });
}

const BASE = {
  inspectedFamilies: ALL_FAMILIES,
  allowedCategories: ["metadata-presence"] as const,
  retainedTechnicalMetadata: ["ICC", "EXIF:Orientation"] as const,
  failureBehavior: "strict-no-output" as const,
  requireCompleteCoverage: true,
  reviewedSensitiveFieldIds: REVIEWED_SENSITIVE_FIELD_IDS,
  reviewedRegistryHash: REVIEWED_REGISTRY_HASH,
  removalFieldIds: REVIEWED_SENSITIVE_FIELD_IDS,
  removalFamilies: Object.freeze([]),
  removalNamespaceProperties: Object.freeze([]),
};

export const PRIVACY_POLICY_PRESETS: Readonly<Record<PrivacyPolicyId, PrivacyPolicy>> = Object.freeze({
  "share-safe": freezePolicy({ id: "share-safe", version: "1.0.0", ...BASE, removeCategories: SENSITIVE_CATEGORIES, allowedOpaqueCategories: [], changeLog: ["1.0.0: Initial strict sharing policy; unknown and opaque data fail closed."] }),
  "location-safe": freezePolicy({ id: "location-safe", version: "1.0.0", ...BASE, removeCategories: ["location", "embedded-preview"], allowedCategories: ["metadata-presence", "person", "creator", "contact", "descriptive"], allowedOpaqueCategories: [], changeLog: ["1.0.0: Initial strict location-removal policy; opaque metadata cannot be cleared safely."] }),
  "anonymous": freezePolicy({ id: "anonymous", version: "1.0.0", ...BASE, removeCategories: SENSITIVE_CATEGORIES.filter((category) => category !== "metadata-presence"), allowedOpaqueCategories: [], retainedTechnicalMetadata: ["ICC"], changeLog: ["1.0.0: Initial strict anonymous-sharing policy."] }),
  "retain-rights": freezePolicy({ id: "retain-rights", version: "1.0.0", ...BASE, removeCategories: ["location", "descriptive", "serial-identifier", "device-identifier", "timestamp", "document-identifier", "region", "prompt", "workflow", "embedded-preview", "unknown-xmp", "opaque-block", "unsupported-structure"], allowedCategories: ["metadata-presence", "person", "creator", "contact"], allowedOpaqueCategories: [], changeLog: ["1.0.0: Initial strict policy preserving rights and creator information."] }),
  "publisher": freezePolicy({ id: "publisher", version: "1.0.0", ...BASE, removeCategories: ["location", "descriptive", "serial-identifier", "device-identifier", "timestamp", "document-identifier", "region", "prompt", "workflow", "embedded-preview", "unknown-xmp", "opaque-block", "unsupported-structure"], allowedCategories: ["metadata-presence", "person", "creator", "contact"], allowedOpaqueCategories: [], changeLog: ["1.0.0: Initial strict publisher policy preserving attribution and rights."] }),
  "accessibility": freezePolicy({ id: "accessibility", version: "1.0.0", ...BASE, removeCategories: ["location", "person", "creator", "contact", "serial-identifier", "device-identifier", "timestamp", "document-identifier", "region", "prompt", "workflow", "embedded-preview", "unknown-xmp", "opaque-block", "unsupported-structure"], allowedCategories: ["metadata-presence", "descriptive"], allowedOpaqueCategories: [], retainedTechnicalMetadata: ["ICC", "EXIF:Orientation", "IPTC:AltTextAccessibility", "XMP:Iptc4xmpCore#AltTextAccessibility"], changeLog: ["1.0.0: Initial strict accessibility-preserving policy."] }),
  "forensic-preserve": freezePolicy({ id: "forensic-preserve", version: "1.0.0", ...BASE, removeCategories: [], allowedCategories: ["metadata-presence", ...SENSITIVE_CATEGORIES], allowedOpaqueCategories: ["opaque-block", "unknown-xmp", "unsupported-structure"], failureBehavior: "report-only", changeLog: ["1.0.0: Initial preservation policy; findings remain visible and no metadata is removed."] }),
});

export function getPrivacyPolicy(id: PrivacyPolicyId): PrivacyPolicy {
  return PRIVACY_POLICY_PRESETS[id];
}

export function getPrivacyPolicyRegistryCoverage(policy: PrivacyPolicy, registry: MetadataRegistry = DEFAULT_METADATA_REGISTRY): PrivacyPolicyRegistryCoverage {
  const sensitiveFieldIds = [...new Set(registry.fields.filter((field) => field.sensitivity !== "none").map((field) => field.id))].sort();
  const reviewedSensitiveFieldIds = [...new Set(policy.reviewedSensitiveFieldIds)].sort();
  const sensitive = new Set(sensitiveFieldIds);
  const reviewed = new Set(reviewedSensitiveFieldIds);
  const missingSensitiveFieldIds = sensitiveFieldIds.filter((id) => !reviewed.has(id));
  const staleReviewedSensitiveFieldIds = reviewedSensitiveFieldIds.filter((id) => !sensitive.has(id));
  const reviewedRegistryHashMatches = policy.reviewedRegistryHash === stableHash(sensitiveFieldIds.join("\n"));
  return {
    registryHash: stableHash(registry.fields.map((field) => `${field.id}:${field.sensitivity}`).sort().join("\n")),
    registryFieldCount: registry.fields.length,
    sensitiveFieldIds,
    reviewedSensitiveFieldIds,
    reviewedRegistryHash: policy.reviewedRegistryHash,
    reviewedRegistryHashMatches,
    missingSensitiveFieldIds,
    staleReviewedSensitiveFieldIds,
    complete: missingSensitiveFieldIds.length === 0 && staleReviewedSensitiveFieldIds.length === 0 && reviewedRegistryHashMatches,
  };
}

function safeFinding(finding: PrivacyFinding, state: PrivacyFindingState = finding.state): PrivacyPolicyFinding {
  return {
    target: finding.target,
    category: finding.category,
    state,
    sensitivity: finding.sensitivity,
    ...(finding.fieldId === undefined ? {} : { fieldId: finding.fieldId }),
    ...(finding.blockId === undefined ? {} : { blockId: finding.blockId }),
    reasonCode: finding.reasonCode,
  };
}

export function evaluatePrivacyPolicy(audit: PrivacyAuditResult, policy: PrivacyPolicy, registry: MetadataRegistry = DEFAULT_METADATA_REGISTRY): PrivacyPolicyReport {
  const registryCoverage = getPrivacyPolicyRegistryCoverage(policy, registry);
  const blockedFindings = audit.findings.filter((finding) => {
    if (policy.allowedCategories.includes(finding.category)) return false;
    if (finding.state === "opaque-risk") return !policy.allowedOpaqueCategories.includes(finding.category);
    return !policy.allowedCategories.includes(finding.category);
  }).map((finding) => safeFinding(finding, "policy-violation"));
  const diagnostics: string[] = [];
  if (policy.requireCompleteCoverage && (audit.coverage.wholeFile !== "complete" || audit.coverage.unclassifiedBlockIds.length > 0)) diagnostics.push("The policy requires complete whole-file coverage.");
  if (!registryCoverage.complete) diagnostics.push("The generated sensitive-field registry has not been explicitly reviewed by this policy.");
  if (blockedFindings.length > 0) diagnostics.push("The input contains findings that violate the selected policy.");
  const complete = registryCoverage.complete && (!policy.requireCompleteCoverage || (audit.coverage.wholeFile === "complete" && audit.coverage.unclassifiedBlockIds.length === 0));
  return {
    policyId: policy.id,
    policyVersion: policy.version,
    passed: complete && blockedFindings.length === 0,
    complete,
    coverage: audit.coverage,
    blockedFindings,
    removedFindingTargets: [],
    unresolvedFindingTargets: [],
    registryCoverage,
    diagnostics,
  };
}

export function policyRemovalTargets(audit: PrivacyAuditResult, policy: PrivacyPolicy): { readonly targets: readonly RedactionTarget[]; readonly unresolved: readonly string[] } {
  const targets: RedactionTarget[] = [];
  const unresolved: string[] = [];
  const seen = new Set<string>();
  for (const finding of audit.findings) {
    if (!policy.removeCategories.includes(finding.category)) continue;
    if (finding.fieldId === undefined || finding.fieldId.length === 0) {
      unresolved.push(finding.target);
      continue;
    }
    const key = finding.fieldId;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({ kind: "field", fieldId: key });
  }
  return { targets, unresolved: [...new Set(unresolved)] };
}
