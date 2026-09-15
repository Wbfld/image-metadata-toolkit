import { throwIfAborted } from "./security/abort.js";
import { DEFAULT_LIMITS, resolveLimits } from "./security/limits.js";
import { detectFormat } from "./detect-format.js";
import { materializeInput } from "./input.js";
import { parseExif } from "./metadata/exif.js";
import { classifyRawTiff, normalizeRawTiffHeader } from "./raw.js";
import { applyTiffEditTransaction, tiffEvidence, type TiffEditTransaction } from "./tiff.js";
import { applyJpegEditTransaction, type JpegEditTransaction } from "./jpeg-writer.js";
import { applyPngEditTransaction, type PngEditTransaction } from "./png-writer.js";
import { applyWebpEditTransaction, type WebpEditTransaction } from "./webp-writer.js";
import { sha256Hex } from "./security/sha256.js";
import type {
  EditCanonicalFieldId,
  EditConflictPolicy,
  EditDiagnostic,
  EditDuplicatePolicy,
  EditFailure,
  EditFailureCode,
  EditMetadataOptions,
  EditMetadataResult,
  EditOperation,
  EditOperationEvidence,
  EditOperationKind,
  EditOperationStatus,
  EditOrderingPolicy,
  EditOrientationPolicy,
  EditPolicyEvidence,
  EditResultStatus,
  EditSelector,
  EditSidecarInput,
  EditTarget,
  EditUnappliedOperation,
  EditUnknownPolicy,
  EditVerificationEvidence,
  EditVerificationPolicy,
  ImageFormat,
  MetadataBlockFamily,
  MetadataInput,
  Sensitivity,
} from "./types.js";

const MAX_EDIT_ID_BYTES = 512;
const MAX_EDIT_VALUE_DEPTH = 32;
const EDIT_OPERATION_KINDS: readonly EditOperationKind[] = [
  "set",
  "delete",
  "copy",
  "rename",
  "alias",
  "remove-group",
  "remove-policy",
  "merge-sidecar",
];
const EDIT_FAMILIES: readonly MetadataBlockFamily[] = [
  "EXIF",
  "XMP",
  "IPTC",
  "ICC",
  "JFIF",
  "PNGText",
  "MakerNote",
  "Photoshop",
  "MPF",
  "Unknown",
];
const EDIT_SENSITIVITIES: readonly Sensitivity[] = ["none", "low", "moderate", "high"];
const EDIT_DUPLICATE_POLICIES: readonly EditDuplicatePolicy[] = ["preserve", "replace-target", "deduplicate-equivalent", "reject"];
const EDIT_CONFLICT_POLICIES: readonly EditConflictPolicy[] = ["preserve-all", "prefer-existing", "prefer-requested", "reject"];
const EDIT_UNKNOWN_POLICIES: readonly EditUnknownPolicy[] = ["preserve", "remove-unselected", "reject"];
const EDIT_VERIFICATION_POLICIES: readonly EditVerificationPolicy[] = ["none", "reparse", "reparse-and-preserve-payload"];
const EDIT_ORIENTATION_POLICIES: readonly EditOrientationPolicy[] = ["preserve", "report-only", "allow-change"];

interface ValidationBudget {
  itemCount: number;
  byteCount: number;
  readonly maxItems: number;
  readonly maxBytes: number;
}

interface OperationValidation {
  readonly operationId: string;
  readonly operation: EditOperationKind | null;
  readonly targets: readonly EditTarget[];
  readonly failure: EditFailure | null;
}

interface PolicyValidation {
  readonly policy: EditPolicyEvidence;
  readonly diagnostics: readonly EditDiagnostic[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    let width = 1;
    if (code < 0x80) width = 1;
    else if (code < 0x800) width = 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length && value.charCodeAt(index + 1) >= 0xdc00 && value.charCodeAt(index + 1) <= 0xdfff) {
      width = 4;
      index += 1;
    } else width = 3;
    if (bytes > Number.MAX_SAFE_INTEGER - width) return Number.MAX_SAFE_INTEGER;
    bytes += width;
  }
  return bytes;
}

function isSafeText(value: unknown, allowWhitespace = false): value is string {
  if (typeof value !== "string" || textByteLength(value) === 0 || textByteLength(value) > MAX_EDIT_ID_BYTES) return false;
  if (value !== value.trim() && !allowWhitespace) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code === 0x7f) return false;
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function isCanonicalFieldId(value: unknown): value is EditCanonicalFieldId {
  return isSafeText(value) && value.includes(":") && !value.startsWith(":") && !value.endsWith(":");
}

function isFamily(value: unknown): value is MetadataBlockFamily {
  return typeof value === "string" && EDIT_FAMILIES.includes(value as MetadataBlockFamily);
}

function isSensitivity(value: unknown): value is Sensitivity {
  return typeof value === "string" && EDIT_SENSITIVITIES.includes(value as Sensitivity);
}

function isAbsoluteUri(value: unknown): value is string {
  if (!isSafeText(value)) return false;
  if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) return false;
  try {
    return new URL(value).protocol.length > 0;
  } catch {
    return false;
  }
}

function validateSelector(value: unknown): value is EditSelector {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  switch (value.kind) {
    case "family":
      return isFamily(value.family);
    case "block":
      return isSafeText(value.blockId);
    case "associated-image":
      return isSafeText(value.imageId);
    case "sensitivity":
      return isSensitivity(value.sensitivity);
    case "namespace-property":
      return isAbsoluteUri(value.namespaceUri) && isSafeText(value.localName);
    case "field-id":
      return isCanonicalFieldId(value.fieldId);
    case "photoshop-resource":
      return isSafeText(value.resourceId);
    case "policy":
      return isSafeText(value.policyId);
    default:
      return false;
  }
}

function validateTarget(value: unknown): value is EditTarget {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  if (value.kind === "field") return isCanonicalFieldId(value.fieldId);
  return value.kind === "selector" && validateSelector(value.selector);
}

function copyTarget(target: EditTarget): EditTarget {
  if (target.kind === "field") return { kind: "field", fieldId: target.fieldId };
  const selector = target.selector;
  switch (selector.kind) {
    case "family":
      return { kind: "selector", selector: { kind: "family", family: selector.family } };
    case "block":
      return { kind: "selector", selector: { kind: "block", blockId: selector.blockId } };
    case "associated-image":
      return { kind: "selector", selector: { kind: "associated-image", imageId: selector.imageId } };
    case "sensitivity":
      return { kind: "selector", selector: { kind: "sensitivity", sensitivity: selector.sensitivity } };
    case "namespace-property":
      return { kind: "selector", selector: { kind: "namespace-property", namespaceUri: selector.namespaceUri, localName: selector.localName } };
    case "field-id":
      return { kind: "selector", selector: { kind: "field-id", fieldId: selector.fieldId } };
    case "photoshop-resource":
      return { kind: "selector", selector: { kind: "photoshop-resource", resourceId: selector.resourceId } };
    case "policy":
      return { kind: "selector", selector: { kind: "policy", policyId: selector.policyId } };
  }
}

function targetKey(target: EditTarget): string {
  if (target.kind === "field") return `field:${target.fieldId}`;
  const selector = target.selector;
  switch (selector.kind) {
    case "family":
      return `selector:family:${selector.family}`;
    case "block":
      return `selector:block:${selector.blockId}`;
    case "associated-image":
      return `selector:associated-image:${selector.imageId}`;
    case "sensitivity":
      return `selector:sensitivity:${selector.sensitivity}`;
    case "namespace-property":
      return `selector:namespace-property:${selector.namespaceUri}#${selector.localName}`;
    case "field-id":
      return `field:${selector.fieldId}`;
    case "photoshop-resource":
      return `selector:photoshop-resource:${selector.resourceId}`;
    case "policy":
      return `selector:policy:${selector.policyId}`;
  }
}

function validateEditValue(value: unknown, depth: number, budget: ValidationBudget): boolean {
  if (depth > MAX_EDIT_VALUE_DEPTH || budget.itemCount >= budget.maxItems) return false;
  budget.itemCount += 1;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") {
    const bytes = textByteLength(value);
    budget.byteCount += bytes;
    return budget.byteCount <= budget.maxBytes;
  }
  if (value instanceof Uint8Array) {
    budget.byteCount += value.byteLength;
    return budget.byteCount <= budget.maxBytes;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!validateEditValue(item, depth + 1, budget)) return false;
    }
    return true;
  }
  if (!isRecord(value)) return false;
  let prototype: object | null;
  let keys: string[];
  try {
    prototype = Object.getPrototypeOf(value) as object | null;
    keys = Object.keys(value);
  } catch {
    return false;
  }
  if (prototype !== Object.prototype && prototype !== null) return false;
  for (const key of keys) {
    if (!isSafeText(key, true) || !validateEditValue(value[key], depth + 1, budget)) return false;
  }
  return true;
}

function isSidecarText(value: unknown, maxBytes: number): value is string {
  if (typeof value !== "string" || textByteLength(value) === 0 || textByteLength(value) > maxBytes) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function validateSidecar(value: unknown, maxBytes: number): value is EditSidecarInput {
  if (!isRecord(value) || !isSafeText(value.id) || (value.format !== "xmp" && value.format !== "iptc-iim")) return false;
  if (value.mediaType !== undefined && value.mediaType !== "application/rdf+xml" && value.mediaType !== "application/xmp" && value.mediaType !== "application/octet-stream") return false;
  if (value.source !== undefined && !isSafeText(value.source, true)) return false;
  if (typeof value.data === "string") return isSidecarText(value.data, maxBytes);
  return value.data instanceof Uint8Array && value.data.byteLength > 0 && value.data.byteLength <= maxBytes;
}

function operationTargets(value: unknown): EditTarget[] {
  if (!isRecord(value) || typeof value.op !== "string") return [];
  const targets: EditTarget[] = [];
  if (validateTarget(value.target)) targets.push(copyTarget(value.target));
  if (validateTarget(value.source)) targets.push(copyTarget(value.source));
  if (validateTarget(value.destination)) targets.push(copyTarget(value.destination));
  return targets;
}

function operationKind(value: unknown): EditOperationKind | null {
  if (!isRecord(value) || typeof value.op !== "string") return null;
  return EDIT_OPERATION_KINDS.includes(value.op as EditOperationKind) ? value.op as EditOperationKind : null;
}

function operationId(value: unknown, index: number): string {
  if (isRecord(value) && isSafeText(value.operationId)) return value.operationId;
  return `invalid-operation-${index}`;
}

function failure(code: EditFailureCode, detail: string): EditFailure {
  return { code, detail };
}

function validateOperation(value: unknown, index: number, maxValueBytes: number, maxValueItems: number): OperationValidation {
  const id = operationId(value, index);
  const kind = operationKind(value);
  const targets = operationTargets(value);
  if (!isRecord(value)) return { operationId: id, operation: null, targets, failure: failure("INVALID_VALUE", "An edit operation must be an object.") };
  if (!isSafeText(value.operationId)) return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", "operationId must be a unique bounded non-empty string.") };
  if (kind === null) return { operationId: id, operation: null, targets, failure: failure("INVALID_VALUE", "op must name a supported edit operation.") };

  const requireTarget = (target: unknown): target is EditTarget => validateTarget(target);
  switch (kind) {
    case "set": {
      const budget: ValidationBudget = { itemCount: 0, byteCount: 0, maxItems: maxValueItems, maxBytes: maxValueBytes };
      if (!requireTarget(value.target)) return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", "set requires a canonical field or explicit selector target.") };
      if (!Object.hasOwn(value, "value") || !validateEditValue(value.value, 0, budget)) return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", "set.value is not a bounded supported edit value.") };
      return { operationId: id, operation: kind, targets, failure: null };
    }
    case "delete":
      return requireTarget(value.target)
        ? { operationId: id, operation: kind, targets, failure: null }
        : { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", "delete requires a canonical field or explicit selector target.") };
    case "copy":
    case "rename":
    case "alias":
      if (!requireTarget(value.source) || !requireTarget(value.destination)) {
        return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", `${kind} requires canonical or explicitly selected source and destination targets.`) };
      }
      if (targetKey(value.source) === targetKey(value.destination)) {
        return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", `${kind} source and destination must be different.`) };
      }
      return { operationId: id, operation: kind, targets, failure: null };
    case "remove-group":
      if (!isRecord(value.target) || value.target.kind !== "selector" || !isRecord(value.target.selector) || value.target.selector.kind !== "family" || !isFamily(value.target.selector.family)) {
        return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", "remove-group requires an explicit metadata-family selector.") };
      }
      return { operationId: id, operation: kind, targets, failure: null };
    case "remove-policy":
      if (!isRecord(value.target) || value.target.kind !== "selector" || !isRecord(value.target.selector) || value.target.selector.kind !== "policy" || !isSafeText(value.target.selector.policyId)) {
        return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", "remove-policy requires an explicit policy selector.") };
      }
      return { operationId: id, operation: kind, targets, failure: null };
    case "merge-sidecar":
      if (!requireTarget(value.target)) return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", "merge-sidecar requires a canonical field or explicit selector target.") };
      if (!validateSidecar(value.sidecar, maxValueBytes)) return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", "sidecar must contain bounded XMP or IPTC-IIM bytes and stable provenance.") };
      if (value.mergePolicy !== undefined && value.mergePolicy !== "append" && value.mergePolicy !== "preserve-existing" && value.mergePolicy !== "prefer-sidecar" && value.mergePolicy !== "reject-conflict") {
        return { operationId: id, operation: kind, targets, failure: failure("INVALID_VALUE", "mergePolicy must be an explicit supported sidecar policy.") };
      }
      return { operationId: id, operation: kind, targets, failure: null };
  }
}

function defaultOrdering(): EditOrderingPolicy {
  return { mode: "preserve-source" };
}

function getRecordValue(record: Record<string, unknown> | undefined, key: string): unknown {
  return record === undefined ? undefined : record[key];
}

function validatePolicy(rawOptions: Record<string, unknown> | null, operationIds: readonly string[], maxTargets: number): PolicyValidation {
  const diagnostics: EditDiagnostic[] = [];
  const rawPolicy = rawOptions !== null && rawOptions.policy !== undefined ? rawOptions.policy : undefined;
  const policyRecord = rawPolicy === undefined ? undefined : isRecord(rawPolicy) ? rawPolicy : undefined;
  if (rawPolicy !== undefined && policyRecord === undefined) diagnostics.push({ code: "INVALID_VALUE", detail: "policy must be an object." });

  const readTargets = (key: "preserve" | "remove"): EditTarget[] => {
    const rawTargets = getRecordValue(policyRecord, key);
    if (rawTargets === undefined) return [];
    if (!Array.isArray(rawTargets) || rawTargets.length > maxTargets) {
      diagnostics.push({ code: "INVALID_VALUE", detail: `policy.${key} must be a bounded array of edit targets.` });
      return [];
    }
    const targets: EditTarget[] = [];
    for (const target of rawTargets) {
      if (validateTarget(target)) targets.push(copyTarget(target));
      else diagnostics.push({ code: "INVALID_VALUE", detail: `policy.${key} contains an invalid target.` });
    }
    return targets;
  };

  const preserve = readTargets("preserve");
  const remove = readTargets("remove");
  const rawPrecedence = getRecordValue(policyRecord, "preserveRemovePrecedence");
  if (rawPrecedence !== undefined && rawPrecedence !== "preserve-wins") diagnostics.push({ code: "INVALID_VALUE", detail: "preserveRemovePrecedence can only be preserve-wins." });

  let unknown: EditUnknownPolicy = "preserve";
  const rawUnknown = getRecordValue(policyRecord, "unknown");
  if (rawUnknown !== undefined) {
    if (typeof rawUnknown !== "string" || !EDIT_UNKNOWN_POLICIES.includes(rawUnknown as EditUnknownPolicy)) diagnostics.push({ code: "INVALID_VALUE", detail: "policy.unknown is not a supported unknown-preservation policy." });
    else unknown = rawUnknown as EditUnknownPolicy;
  }
  const preserveUnknown = rawOptions === null ? undefined : rawOptions.preserveUnknown;
  if (preserveUnknown !== undefined) {
    if (typeof preserveUnknown !== "boolean") diagnostics.push({ code: "INVALID_VALUE", detail: "preserveUnknown must be boolean when supplied." });
    else {
      const shorthand = preserveUnknown ? "preserve" : "remove-unselected";
      if (rawUnknown !== undefined && unknown !== shorthand) diagnostics.push({ code: "INVALID_VALUE", detail: "preserveUnknown conflicts with policy.unknown." });
      unknown = shorthand;
    }
  }

  let ordering: EditOrderingPolicy = defaultOrdering();
  const rawOrdering = getRecordValue(policyRecord, "ordering");
  if (rawOrdering !== undefined) {
    if (!isRecord(rawOrdering) || (rawOrdering.mode !== "preserve-source" && rawOrdering.mode !== "canonical" && rawOrdering.mode !== "operation-order")) {
      diagnostics.push({ code: "INVALID_VALUE", detail: "policy.ordering is not a supported ordering policy." });
    } else if (rawOrdering.mode === "operation-order") {
      if (!Array.isArray(rawOrdering.operationIds) || rawOrdering.operationIds.some((id) => !isSafeText(id))) {
        diagnostics.push({ code: "INVALID_VALUE", detail: "operation-order must name bounded operation IDs." });
      } else {
        const ids = rawOrdering.operationIds as string[];
        const expected = new Set(operationIds);
        const actual = new Set(ids);
        if (ids.length !== actual.size || ids.length !== expected.size || ids.some((id) => !expected.has(id))) diagnostics.push({ code: "INVALID_VALUE", detail: "operation-order must contain each operationId exactly once." });
        else ordering = { mode: "operation-order", operationIds: [...ids] };
      }
    } else ordering = { mode: rawOrdering.mode };
  }

  let duplicates: EditDuplicatePolicy = "preserve";
  const rawDuplicates = getRecordValue(policyRecord, "duplicates");
  if (rawDuplicates !== undefined) {
    if (typeof rawDuplicates !== "string" || !EDIT_DUPLICATE_POLICIES.includes(rawDuplicates as EditDuplicatePolicy)) diagnostics.push({ code: "INVALID_VALUE", detail: "policy.duplicates is not supported." });
    else duplicates = rawDuplicates as EditDuplicatePolicy;
  }

  let conflicts: EditConflictPolicy = "preserve-all";
  const rawConflicts = getRecordValue(policyRecord, "conflicts");
  if (rawConflicts !== undefined) {
    if (typeof rawConflicts !== "string" || !EDIT_CONFLICT_POLICIES.includes(rawConflicts as EditConflictPolicy)) diagnostics.push({ code: "INVALID_VALUE", detail: "policy.conflicts is not supported." });
    else conflicts = rawConflicts as EditConflictPolicy;
  }

  let verification: EditVerificationPolicy = "reparse-and-preserve-payload";
  const rawVerification = getRecordValue(policyRecord, "verification");
  if (rawVerification !== undefined) {
    if (typeof rawVerification !== "string" || !EDIT_VERIFICATION_POLICIES.includes(rawVerification as EditVerificationPolicy)) diagnostics.push({ code: "INVALID_VALUE", detail: "policy.verification is not supported." });
    else verification = rawVerification as EditVerificationPolicy;
  }
  const verifyImagePayload = rawOptions === null ? undefined : rawOptions.verifyImagePayload;
  if (verifyImagePayload !== undefined) {
    if (typeof verifyImagePayload !== "boolean") diagnostics.push({ code: "INVALID_VALUE", detail: "verifyImagePayload must be boolean when supplied." });
    else {
      const shorthand = verifyImagePayload ? "reparse-and-preserve-payload" : "reparse";
      if (rawVerification !== undefined && verification !== shorthand) diagnostics.push({ code: "INVALID_VALUE", detail: "verifyImagePayload conflicts with policy.verification." });
      verification = shorthand;
    }
  }

  let orientation: EditOrientationPolicy = "preserve";
  const rawOrientation = getRecordValue(policyRecord, "orientation");
  if (rawOrientation !== undefined) {
    if (typeof rawOrientation !== "string" || !EDIT_ORIENTATION_POLICIES.includes(rawOrientation as EditOrientationPolicy)) diagnostics.push({ code: "INVALID_VALUE", detail: "policy.orientation is not supported." });
    else orientation = rawOrientation as EditOrientationPolicy;
  }

  const preserveKeys = new Set(preserve.map(targetKey));
  const overlappingTargets = remove.filter((target) => preserveKeys.has(targetKey(target)));
  const policy: EditPolicyEvidence = {
    preserve,
    remove,
    preserveRemovePrecedence: "preserve-wins",
    unknown,
    ordering,
    duplicates,
    conflicts,
    verification,
    orientation,
    overlappingTargets,
  };
  return { policy, diagnostics };
}

function isRemovalOperation(operation: EditOperationKind | null): boolean {
  return operation === "delete" || operation === "remove-group" || operation === "remove-policy";
}

function statusForFailure(code: EditFailureCode): Exclude<EditOperationStatus, "applied"> {
  switch (code) {
    case "UNSUPPORTED_OPERATION": return "unsupported";
    case "INVALID_VALUE": return "invalid-value";
    case "UNSAFE_STRUCTURE": return "unsafe-structure";
    case "POLICY_FAILURE": return "policy-failure";
    case "VERIFICATION_FAILURE": return "verification-failure";
  }
}

function failureCodeForStatus(status: EditOperationStatus): EditFailureCode | null {
  switch (status) {
    case "applied": return null;
    case "unsupported": return "UNSUPPORTED_OPERATION";
    case "invalid-value": return "INVALID_VALUE";
    case "unsafe-structure": return "UNSAFE_STRUCTURE";
    case "policy-failure": return "POLICY_FAILURE";
    case "verification-failure": return "VERIFICATION_FAILURE";
  }
}

function operationEvidence(validation: OperationValidation, policy: EditPolicyEvidence): EditOperationEvidence {
  let operationFailure = validation.failure;
  if (operationFailure === null && isRemovalOperation(validation.operation)) {
    const preserveKeys = new Set(policy.preserve.map(targetKey));
    if (validation.targets.some((target) => preserveKeys.has(targetKey(target)))) {
      operationFailure = failure("POLICY_FAILURE", "The preserve rule wins over this removal operation.");
    }
  }
  if (operationFailure === null) operationFailure = failure("UNSUPPORTED_OPERATION", "This operation is not available for the detected input container.");
  const status = statusForFailure(operationFailure.code);
  return {
    operationId: validation.operationId,
    operation: validation.operation,
    targets: validation.targets,
    status,
    candidateCount: null,
    appliedCount: 0,
    matchedFieldIds: [],
    matchedBlockIds: [],
    byteChanges: [],
    preservedUnknownCandidates: null,
    failure: operationFailure,
  };
}

function operationEvidenceForTiff(validation: OperationValidation, policy: EditPolicyEvidence, transaction: TiffEditTransaction): EditOperationEvidence {
  const result = transaction.operations.find((item) => item.operationId === validation.operationId);
  if (result === undefined) return operationEvidence(validation, policy);
  return {
    operationId: validation.operationId,
    operation: validation.operation,
    targets: validation.targets,
    status: result.status,
    candidateCount: result.matchedFieldIds.length,
    appliedCount: result.appliedCount,
    matchedFieldIds: result.matchedFieldIds,
    matchedBlockIds: result.matchedDirectoryIds.map((id) => `tiff:IFD:${id}`),
    byteChanges: result.status === "applied" && transaction.output !== null ? [{ blockId: "tiff", offset: 0, length: transaction.output.byteLength, kind: "rewritten" as const }] : [],
    preservedUnknownCandidates: null,
    failure: result.failure,
  };
}

function operationEvidenceForJpeg(validation: OperationValidation, policy: EditPolicyEvidence, transaction: JpegEditTransaction): EditOperationEvidence {
  const result = transaction.operations.find((item) => item.operationId === validation.operationId);
  if (result === undefined) return operationEvidence(validation, policy);
  return {
    operationId: validation.operationId,
    operation: validation.operation,
    targets: validation.targets,
    status: result.status,
    candidateCount: result.matchedBlockIds.length > 0 ? result.matchedBlockIds.length : result.appliedCount,
    appliedCount: result.appliedCount,
    matchedFieldIds: result.matchedFieldIds,
    matchedBlockIds: result.matchedBlockIds,
    byteChanges: result.status === "applied" ? transaction.byteChanges : [],
    preservedUnknownCandidates: result.preservedUnknownCandidates,
    failure: result.failure,
  };
}

function operationEvidenceForPng(validation: OperationValidation, policy: EditPolicyEvidence, transaction: PngEditTransaction): EditOperationEvidence {
  const result = transaction.operations.find((item) => item.operationId === validation.operationId);
  if (result === undefined) return operationEvidence(validation, policy);
  return {
    operationId: validation.operationId,
    operation: validation.operation,
    targets: validation.targets,
    status: result.status,
    candidateCount: result.matchedBlockIds.length > 0 ? result.matchedBlockIds.length : result.appliedCount,
    appliedCount: result.appliedCount,
    matchedFieldIds: result.matchedFieldIds,
    matchedBlockIds: result.matchedBlockIds,
    byteChanges: result.status === "applied" ? transaction.byteChanges : [],
    preservedUnknownCandidates: result.preservedUnknownCandidates,
    failure: result.failure,
  };
}

function operationEvidenceForWebp(validation: OperationValidation, policy: EditPolicyEvidence, transaction: WebpEditTransaction): EditOperationEvidence {
  const result = transaction.operations.find((item) => item.operationId === validation.operationId);
  if (result === undefined) return operationEvidence(validation, policy);
  return {
    operationId: validation.operationId,
    operation: validation.operation,
    targets: validation.targets,
    status: result.status,
    candidateCount: result.matchedBlockIds.length > 0 ? result.matchedBlockIds.length : result.appliedCount,
    appliedCount: result.appliedCount,
    matchedFieldIds: result.matchedFieldIds,
    matchedBlockIds: result.matchedBlockIds,
    byteChanges: result.status === "applied" ? transaction.byteChanges : [],
    preservedUnknownCandidates: result.preservedUnknownCandidates,
    failure: result.failure,
  };
}

function resultStatus(operationStatuses: readonly EditOperationStatus[], diagnostics: readonly EditDiagnostic[]): Exclude<EditResultStatus, "applied"> {
  const statuses = new Set<Exclude<EditOperationStatus, "applied">>();
  for (const status of operationStatuses) {
    if (status !== "applied") statuses.add(status);
  }
  for (const diagnostic of diagnostics) statuses.add(statusForFailure(diagnostic.code));
  if (statuses.size === 0) return "invalid-value";
  if (statuses.size === 1) return [...statuses][0] as Exclude<EditResultStatus, "applied">;
  return "mixed-failure";
}

function isMetadataInput(value: unknown): value is MetadataInput {
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return true;
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function verificationEvidence(policy: EditVerificationPolicy): EditVerificationEvidence {
  return {
    policy,
    status: "not-run",
    checked: [],
    failure: policy === "none" ? null : failure("UNSUPPORTED_OPERATION", "Verification is deferred because no output bytes were generated.")
  };
}

function completedVerification(policy: EditVerificationPolicy): EditVerificationEvidence {
  if (policy === "none") return { policy, status: "not-run", checked: [], failure: null };
  return {
    policy,
    status: "passed",
    checked: policy === "reparse" ? ["reparse", "dimensions", "relationships"] : ["reparse", "image-payload", "dimensions", "relationships"],
    failure: null,
  };
}

function directBytes(input: MetadataInput): Uint8Array | null {
  if (input instanceof ArrayBuffer) return new Uint8Array(input).slice();
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength).slice();
  return null;
}

function tiffFailure(error: unknown): EditFailure {
  if (error instanceof Error && "code" in error) {
    const code = (error as Error & { readonly code?: string }).code;
    if (code === "INVALID_VALUE") return failure("INVALID_VALUE", error.message);
    if (code === "VERIFICATION_FAILURE") return failure("VERIFICATION_FAILURE", error.message);
    if (code === "UNSAFE_STRUCTURE" || code === "LIMIT_EXCEEDED") return failure("UNSAFE_STRUCTURE", error.message);
  }
  return failure("UNSAFE_STRUCTURE", error instanceof Error ? error.message : "TIFF serialization failed before output was committed.");
}

function jpegFailure(error: unknown): EditFailure {
  if (error instanceof Error && "code" in error) {
    const code = (error as Error & { readonly code?: string }).code;
    if (code === "INVALID_VALUE") return failure("INVALID_VALUE", error.message);
    if (code === "VERIFICATION_FAILURE") return failure("VERIFICATION_FAILURE", error.message);
    if (code === "UNSUPPORTED_STRUCTURE") return failure("UNSUPPORTED_OPERATION", error.message);
    if (code === "UNSAFE_STRUCTURE" || code === "LIMIT_EXCEEDED") return failure("UNSAFE_STRUCTURE", error.message);
  }
  return failure("UNSAFE_STRUCTURE", error instanceof Error ? error.message : "JPEG serialization failed before output was committed.");
}

function pngFailure(error: unknown): EditFailure {
  if (error instanceof Error && "code" in error) {
    const code = (error as Error & { readonly code?: string }).code;
    if (code === "INVALID_VALUE") return failure("INVALID_VALUE", error.message);
    if (code === "VERIFICATION_FAILURE") return failure("VERIFICATION_FAILURE", error.message);
    if (code === "UNSUPPORTED_STRUCTURE") return failure("UNSUPPORTED_OPERATION", error.message);
    if (code === "UNSAFE_STRUCTURE" || code === "LIMIT_EXCEEDED") return failure("UNSAFE_STRUCTURE", error.message);
  }
  return failure("UNSAFE_STRUCTURE", error instanceof Error ? error.message : "PNG serialization failed before output was committed.");
}

function webpFailure(error: unknown): EditFailure {
  if (error instanceof Error && "code" in error) {
    const code = (error as Error & { readonly code?: string }).code;
    if (code === "INVALID_VALUE") return failure("INVALID_VALUE", error.message);
    if (code === "VERIFICATION_FAILURE") return failure("VERIFICATION_FAILURE", error.message);
    if (code === "UNSUPPORTED_STRUCTURE") return failure("UNSUPPORTED_OPERATION", error.message);
    if (code === "UNSAFE_STRUCTURE" || code === "LIMIT_EXCEEDED") return failure("UNSAFE_STRUCTURE", error.message);
  }
  return failure("UNSAFE_STRUCTURE", error instanceof Error ? error.message : "WebP serialization failed before output was committed.");
}

function invalidLimitDetail(error: unknown): string {
  return error instanceof Error ? error.message : "Security limits could not be validated.";
}

/**
 * Validate an edit transaction and dispatch it to the dedicated safe writer
 * for the detected container. The function never mutates caller-owned input;
 * unsupported formats and operations remain explicit typed results.
 */
export async function editMetadata(input: MetadataInput, options: EditMetadataOptions): Promise<EditMetadataResult> {
  await Promise.resolve();
  const rawOptions = isRecord(options) ? options : null;
  const diagnostics: EditDiagnostic[] = [];
  if (rawOptions === null) diagnostics.push({ code: "INVALID_VALUE", detail: "Edit options must be an object." });

  const rawSignal = getRecordValue(rawOptions ?? undefined, "signal");
  if (rawSignal !== undefined && (!isRecord(rawSignal) || typeof rawSignal.aborted !== "boolean")) diagnostics.push({ code: "INVALID_VALUE", detail: "signal must be an AbortSignal." });
  else if (rawSignal !== undefined) throwIfAborted(rawSignal as unknown as AbortSignal);

  let limits = DEFAULT_LIMITS;
  try {
    const rawLimits = getRecordValue(rawOptions ?? undefined, "limits");
    limits = resolveLimits(rawLimits === undefined ? undefined : rawLimits as Partial<typeof DEFAULT_LIMITS>);
  } catch (error) {
    diagnostics.push({ code: "INVALID_VALUE", detail: invalidLimitDetail(error) });
  }

  const rawOperations = getRecordValue(rawOptions ?? undefined, "operations");
  const operationValues = Array.isArray(rawOperations) ? rawOperations : [];
  if (!Array.isArray(rawOperations) || operationValues.length === 0) diagnostics.push({ code: "INVALID_VALUE", detail: "operations must be a non-empty array." });
  if (operationValues.length > limits.maxAdapterItems) diagnostics.push({ code: "INVALID_VALUE", detail: "operations exceed the configured edit-operation limit." });

  const validations = operationValues.slice(0, limits.maxAdapterItems).map((operation, index) => validateOperation(operation, index, Math.min(limits.maxValueBytes, limits.maxAdapterOutputBytes), limits.maxAdapterItems));
  const ids = validations.map(({ operationId }) => operationId);
  if (new Set(ids).size !== ids.length) diagnostics.push({ code: "INVALID_VALUE", detail: "operationId values must be unique." });
  const policyValidation = validatePolicy(rawOptions, ids, limits.maxAdapterItems);
  diagnostics.push(...policyValidation.diagnostics);

  if (!isMetadataInput(input)) diagnostics.push({ code: "INVALID_VALUE", detail: "input must be an ArrayBuffer, ArrayBufferView, Blob, or File." });

  let evidence = validations.map((validation) => operationEvidence(validation, policyValidation.policy));
  let transaction: TiffEditTransaction | null = null;
  let jpegTransaction: JpegEditTransaction | null = null;
  let pngTransaction: PngEditTransaction | null = null;
  let webpTransaction: WebpEditTransaction | null = null;
  let transactionFailure: EditFailure | null = null;
  let examinedBytes: Uint8Array | null = null;
  let examinedFormat: ImageFormat | null = null;
  let examinedSha256: string | null = null;
  const hasPreflightPolicyFailure = evidence.some((item) => item.failure?.code === "POLICY_FAILURE");
  const canAttemptWriter = diagnostics.length === 0 && !hasPreflightPolicyFailure && validations.every(({ failure: itemFailure }) => itemFailure === null) && isMetadataInput(input);
  if (canAttemptWriter) {
    try {
      examinedBytes = directBytes(input) ?? await materializeInput(input, limits, rawSignal as AbortSignal | undefined);
      const detection = detectFormat(examinedBytes);
      examinedFormat = detection.format === "png" && examinedBytes.length < 33 ? "unknown" : detection.format;
      if (detection.format === "tiff") {
        examinedSha256 = await sha256Hex(examinedBytes);
        const signatureKind = classifyRawTiff(examinedBytes, null);
        const parsedKind = signatureKind ?? classifyRawTiff(examinedBytes, parseExif(normalizeRawTiffHeader(examinedBytes), limits).exif);
        if (parsedKind !== null) {
          transactionFailure = failure("UNSUPPORTED_OPERATION", `RAW ${parsedKind.toUpperCase()} writing is intentionally unsupported; metadata inspection is read-only.`);
          evidence = validations.map((validation) => operationEvidence(validation, policyValidation.policy));
        } else {
          transaction = applyTiffEditTransaction(examinedBytes, operationValues as readonly EditOperation[], policyValidation.policy, limits);
          const completedTransaction = transaction;
          evidence = validations.map((validation) => operationEvidenceForTiff(validation, policyValidation.policy, completedTransaction));
        }
      } else if (detection.format === "jpeg") {
        examinedSha256 = await sha256Hex(examinedBytes);
        jpegTransaction = applyJpegEditTransaction(examinedBytes, operationValues as readonly EditOperation[], policyValidation.policy, limits);
        const completedTransaction = jpegTransaction;
        evidence = validations.map((validation) => operationEvidenceForJpeg(validation, policyValidation.policy, completedTransaction));
      } else if (detection.format === "png" && examinedFormat === "png") {
        examinedSha256 = await sha256Hex(examinedBytes);
        pngTransaction = await applyPngEditTransaction(examinedBytes, operationValues as readonly EditOperation[], policyValidation.policy, limits);
        const completedTransaction = pngTransaction;
        evidence = validations.map((validation) => operationEvidenceForPng(validation, policyValidation.policy, completedTransaction));
      } else if (detection.format === "webp") {
        examinedSha256 = await sha256Hex(examinedBytes);
        webpTransaction = applyWebpEditTransaction(examinedBytes, operationValues as readonly EditOperation[], policyValidation.policy, limits);
        const completedTransaction = webpTransaction;
        evidence = validations.map((validation) => operationEvidenceForWebp(validation, policyValidation.policy, completedTransaction));
      }
    } catch (error) {
      transactionFailure = examinedFormat === "jpeg" ? jpegFailure(error) : examinedFormat === "png" ? pngFailure(error) : examinedFormat === "webp" ? webpFailure(error) : tiffFailure(error);
      if (examinedBytes !== null && examinedFormat === "tiff") {
        evidence = validations.map((validation) => {
          if (validation.failure !== null) return operationEvidence(validation, policyValidation.policy);
          const itemFailure = transactionFailure ?? failure("UNSAFE_STRUCTURE", "TIFF serialization failed before output was committed.");
          return {
            operationId: validation.operationId,
            operation: validation.operation,
            targets: validation.targets,
            status: statusForFailure(itemFailure.code),
            candidateCount: null,
            appliedCount: 0,
            matchedFieldIds: [],
            matchedBlockIds: [],
            byteChanges: [],
            preservedUnknownCandidates: null,
            failure: itemFailure,
          };
        });
      } else if (examinedBytes !== null && examinedFormat === "jpeg") {
        evidence = validations.map((validation) => {
          if (validation.failure !== null) return operationEvidence(validation, policyValidation.policy);
          const itemFailure = transactionFailure ?? failure("UNSAFE_STRUCTURE", "JPEG serialization failed before output was committed.");
          return {
            operationId: validation.operationId,
            operation: validation.operation,
            targets: validation.targets,
            status: statusForFailure(itemFailure.code),
            candidateCount: null,
            appliedCount: 0,
            matchedFieldIds: [],
            matchedBlockIds: [],
            byteChanges: [],
            preservedUnknownCandidates: null,
            failure: itemFailure,
          };
        });
      } else if (examinedBytes !== null && examinedFormat === "png") {
        evidence = validations.map((validation) => {
          if (validation.failure !== null) return operationEvidence(validation, policyValidation.policy);
          const itemFailure = transactionFailure ?? failure("UNSAFE_STRUCTURE", "PNG serialization failed before output was committed.");
          return {
            operationId: validation.operationId,
            operation: validation.operation,
            targets: validation.targets,
            status: statusForFailure(itemFailure.code),
            candidateCount: null,
            appliedCount: 0,
            matchedFieldIds: [],
            matchedBlockIds: [],
            byteChanges: [],
            preservedUnknownCandidates: null,
            failure: itemFailure,
          };
        });
      } else if (examinedBytes !== null && examinedFormat === "webp") {
        evidence = validations.map((validation) => {
          if (validation.failure !== null) return operationEvidence(validation, policyValidation.policy);
          const itemFailure = transactionFailure ?? failure("UNSAFE_STRUCTURE", "WebP serialization failed before output was committed.");
          return {
            operationId: validation.operationId,
            operation: validation.operation,
            targets: validation.targets,
            status: statusForFailure(itemFailure.code),
            candidateCount: null,
            appliedCount: 0,
            matchedFieldIds: [],
            matchedBlockIds: [],
            byteChanges: [],
            preservedUnknownCandidates: null,
            failure: itemFailure,
          };
        });
      }
    }
  }
  for (const item of evidence) {
    if (item.failure !== null) diagnostics.push({ code: item.failure.code, detail: item.failure.detail, operationId: item.operationId });
  }
  if (transactionFailure !== null && !diagnostics.some(({ detail }) => detail === transactionFailure.detail)) diagnostics.push({ code: transactionFailure.code, detail: transactionFailure.detail });
  if (transaction?.output !== null && transaction?.output !== undefined && examinedBytes !== null && examinedFormat === "tiff") {
    const hashEvidence = await tiffEvidence(examinedBytes, transaction.output);
    const payloads = await Promise.all(transaction.before.preservedData.map(async (payload) => {
      const after = transaction.after?.preservedData.find((candidate) => candidate.id === payload.id);
      const beforeSha256 = await sha256Hex(payload.data);
      const afterSha256 = after === undefined ? null : await sha256Hex(after.data);
      return { payloadId: payload.id, beforeSha256, afterSha256, comparable: afterSha256 !== null && afterSha256 === beforeSha256 };
    }));
    const outputEvidence = {
      generated: true,
      format: "tiff" as const,
      byteLength: hashEvidence.outputBytes,
      sha256: hashEvidence.outputSha256,
      byteChanges: [{ blockId: "tiff", offset: 0, length: transaction.output.byteLength, kind: "rewritten" as const }],
      payloads,
    };
    const unapplied = evidence.reduce<EditUnappliedOperation[]>((items, item) => {
      if (item.status === "applied") return items;
      const itemFailure = item.failure ?? failure(failureCodeForStatus(item.status) ?? "UNSUPPORTED_OPERATION", "The operation was not applied.");
      items.push({ operationId: item.operationId, operation: item.operation, targets: item.targets, status: item.status, failure: itemFailure });
      return items;
    }, []);
    return {
      successful: true,
      status: "applied",
      data: transaction.output,
      format: "tiff",
      input: { examined: true, format: "tiff", byteLength: hashEvidence.inputBytes, sha256: hashEvidence.inputSha256, sourceMutated: false },
      output: outputEvidence,
      operations: evidence,
      unapplied,
      policy: policyValidation.policy,
      verification: completedVerification(policyValidation.policy.verification),
      diagnostics,
      warnings: [],
    };
  }
  if (jpegTransaction?.output !== null && jpegTransaction?.output !== undefined && examinedBytes !== null && examinedFormat === "jpeg") {
    const inputSha256 = examinedSha256 ?? await sha256Hex(examinedBytes);
    const outputSha256 = await sha256Hex(jpegTransaction.output);
    const payloads = await Promise.all(jpegTransaction.preservedPayloads.map(async (payload) => {
      const beforeSha256 = await sha256Hex(payload.before);
      const afterSha256 = await sha256Hex(payload.after);
      return { payloadId: payload.id, beforeSha256, afterSha256, comparable: beforeSha256 === afterSha256 };
    }));
    const outputEvidence = {
      generated: true,
      format: "jpeg" as const,
      byteLength: jpegTransaction.output.byteLength,
      sha256: outputSha256,
      byteChanges: jpegTransaction.byteChanges,
      payloads,
    };
    const unapplied = evidence.reduce<EditUnappliedOperation[]>((items, item) => {
      if (item.status === "applied") return items;
      const itemFailure = item.failure ?? failure(failureCodeForStatus(item.status) ?? "UNSUPPORTED_OPERATION", "The operation was not applied.");
      items.push({ operationId: item.operationId, operation: item.operation, targets: item.targets, status: item.status, failure: itemFailure });
      return items;
    }, []);
    return {
      successful: true,
      status: "applied",
      data: jpegTransaction.output,
      format: "jpeg",
      input: { examined: true, format: "jpeg", byteLength: examinedBytes.byteLength, sha256: inputSha256, sourceMutated: false },
      output: outputEvidence,
      operations: evidence,
      unapplied,
      policy: policyValidation.policy,
      verification: completedVerification(policyValidation.policy.verification),
      diagnostics,
      warnings: [],
    };
  }
  if (pngTransaction?.output !== null && pngTransaction?.output !== undefined && examinedBytes !== null && examinedFormat === "png") {
    const inputSha256 = examinedSha256 ?? await sha256Hex(examinedBytes);
    const outputSha256 = await sha256Hex(pngTransaction.output);
    const payloads = await Promise.all(pngTransaction.preservedPayloads.map(async (payload) => {
      const beforeSha256 = await sha256Hex(payload.before);
      const afterSha256 = await sha256Hex(payload.after);
      return { payloadId: payload.id, beforeSha256, afterSha256, comparable: beforeSha256 === afterSha256 };
    }));
    const outputEvidence = {
      generated: true,
      format: "png" as const,
      byteLength: pngTransaction.output.byteLength,
      sha256: outputSha256,
      byteChanges: pngTransaction.byteChanges,
      payloads,
    };
    const unapplied = evidence.reduce<EditUnappliedOperation[]>((items, item) => {
      if (item.status === "applied") return items;
      const itemFailure = item.failure ?? failure(failureCodeForStatus(item.status) ?? "UNSUPPORTED_OPERATION", "The operation was not applied.");
      items.push({ operationId: item.operationId, operation: item.operation, targets: item.targets, status: item.status, failure: itemFailure });
      return items;
    }, []);
    return {
      successful: true,
      status: "applied",
      data: pngTransaction.output,
      format: "png",
      input: { examined: true, format: "png", byteLength: examinedBytes.byteLength, sha256: inputSha256, sourceMutated: false },
      output: outputEvidence,
      operations: evidence,
      unapplied,
      policy: policyValidation.policy,
      verification: completedVerification(policyValidation.policy.verification),
      diagnostics,
      warnings: [],
    };
  }
  if (webpTransaction?.output !== null && webpTransaction?.output !== undefined && examinedBytes !== null && examinedFormat === "webp") {
    const inputSha256 = examinedSha256 ?? await sha256Hex(examinedBytes);
    const outputSha256 = await sha256Hex(webpTransaction.output);
    const payloads = await Promise.all(webpTransaction.preservedPayloads.map(async (payload) => {
      const beforeSha256 = await sha256Hex(payload.before);
      const afterSha256 = await sha256Hex(payload.after);
      return { payloadId: payload.id, beforeSha256, afterSha256, comparable: beforeSha256 === afterSha256 };
    }));
    const outputEvidence = {
      generated: true,
      format: "webp" as const,
      byteLength: webpTransaction.output.byteLength,
      sha256: outputSha256,
      byteChanges: webpTransaction.byteChanges,
      payloads,
    };
    const unapplied = evidence.reduce<EditUnappliedOperation[]>((items, item) => {
      if (item.status === "applied") return items;
      const itemFailure = item.failure ?? failure(failureCodeForStatus(item.status) ?? "UNSUPPORTED_OPERATION", "The operation was not applied.");
      items.push({ operationId: item.operationId, operation: item.operation, targets: item.targets, status: item.status, failure: itemFailure });
      return items;
    }, []);
    return {
      successful: true,
      status: "applied",
      data: webpTransaction.output,
      format: "webp",
      input: { examined: true, format: "webp", byteLength: examinedBytes.byteLength, sha256: inputSha256, sourceMutated: false },
      output: outputEvidence,
      operations: evidence,
      unapplied,
      policy: policyValidation.policy,
      verification: completedVerification(policyValidation.policy.verification),
      diagnostics,
      warnings: [],
    };
  }
  const unapplied = evidence.reduce<EditUnappliedOperation[]>((items, item) => {
    if (item.status === "applied") return items;
    const itemFailure = item.failure ?? failure(failureCodeForStatus(item.status) ?? "UNSUPPORTED_OPERATION", "The operation was not applied.");
    items.push({
      operationId: item.operationId,
      operation: item.operation,
      targets: item.targets,
      status: item.status,
      failure: itemFailure,
    });
    return items;
  }, []);
  const status = resultStatus(evidence.map(({ status: itemStatus }) => itemStatus), diagnostics);
  const verification = verificationEvidence(policyValidation.policy.verification);
  return {
    successful: false,
    status,
    data: null,
    format: examinedFormat === "tiff" || examinedFormat === "jpeg" || examinedFormat === "png" || examinedFormat === "webp" ? examinedFormat : null,
    input: {
      examined: examinedBytes !== null && (examinedFormat === "tiff" || examinedFormat === "jpeg" || examinedFormat === "png" || examinedFormat === "webp"),
      format: examinedBytes !== null && (examinedFormat === "tiff" || examinedFormat === "jpeg" || examinedFormat === "png" || examinedFormat === "webp") ? examinedFormat : null,
      byteLength: examinedBytes !== null && (examinedFormat === "tiff" || examinedFormat === "jpeg" || examinedFormat === "png" || examinedFormat === "webp") ? examinedBytes.byteLength : null,
      sha256: examinedBytes !== null && (examinedFormat === "tiff" || examinedFormat === "jpeg" || examinedFormat === "png" || examinedFormat === "webp") ? examinedSha256 : null,
      sourceMutated: false,
    },
    output: null,
    operations: evidence,
    unapplied,
    policy: policyValidation.policy,
    verification,
    diagnostics,
    warnings: [],
  };
}

export type {
  EditAliasOperation,
  EditCanonicalFieldId,
  EditConflictPolicy,
  EditCopyOperation,
  EditDeleteOperation,
  EditDiagnostic,
  EditDuplicatePolicy,
  EditFailure,
  EditFailureCode,
  EditGroupRemovalOperation,
  EditMetadataOptions,
  EditMetadataResult,
  EditOperation,
  EditOperationEvidence,
  EditOperationKind,
  EditOperationStatus,
  EditOrderingPolicy,
  EditPolicy,
  EditPolicyEvidence,
  EditPolicyRemovalOperation,
  EditResultStatus,
  EditSelector,
  EditSetOperation,
  EditSidecarFormat,
  EditSidecarInput,
  EditSidecarMergeOperation,
  EditSidecarMergePolicy,
  EditTarget,
  EditUnappliedOperation,
  EditUnknownPolicy,
  EditVerificationEvidence,
  EditVerificationPolicy,
  EditValue,
  EditByteRange,
  EditInputEvidence,
  EditOutputEvidence,
  EditPayloadEvidence,
  MetadataInput,
} from "./types.js";
