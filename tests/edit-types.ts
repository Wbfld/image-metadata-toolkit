import { editMetadata } from "../src/index.js";
import type {
  EditMetadataResult,
  EditOperation,
  EditPolicy,
  EditTarget,
  EditFailureCode,
} from "../src/types.js";

const operations = [
  { op: "set", operationId: "caption", target: { kind: "field", fieldId: "XMP:dc:description" }, value: { "lang-x-default": "A caption" } },
  { op: "delete", operationId: "private", target: { kind: "selector", selector: { kind: "sensitivity", sensitivity: "high" } } },
  { op: "copy", operationId: "copy", source: { kind: "field", fieldId: "XMP:dc:title" }, destination: { kind: "field", fieldId: "XMP:photoshop:Headline" } },
  { op: "rename", operationId: "rename", source: { kind: "field", fieldId: "XMP:dc:creator" }, destination: { kind: "field", fieldId: "XMP:iptc:Creator" } },
  { op: "alias", operationId: "alias", source: { kind: "field", fieldId: "XMP:dc:rights" }, destination: { kind: "field", fieldId: "XMP:plus:LicensorURL" } },
  { op: "remove-group", operationId: "group", target: { kind: "selector", selector: { kind: "family", family: "XMP" } } },
  { op: "remove-policy", operationId: "policy", target: { kind: "selector", selector: { kind: "policy", policyId: "share-safe" } } },
  { op: "merge-sidecar", operationId: "sidecar", target: { kind: "selector", selector: { kind: "family", family: "XMP" } }, sidecar: { id: "caption.xmp", format: "xmp", data: "<x:xmpmeta/>" } },
] satisfies readonly EditOperation[];

const policy = {
  preserve: [{ kind: "field", fieldId: "EXIF:IFD0:0x0112" }],
  remove: [{ kind: "selector", selector: { kind: "sensitivity", sensitivity: "high" } }],
  preserveRemovePrecedence: "preserve-wins",
  unknown: "preserve",
  ordering: { mode: "operation-order", operationIds: operations.map(({ operationId }) => operationId) },
  duplicates: "preserve",
  conflicts: "preserve-all",
  verification: "reparse-and-preserve-payload",
} satisfies EditPolicy;

const target = { kind: "field", fieldId: "XMP:dc:title" } satisfies EditTarget;
const failureCodes = ["UNSUPPORTED_OPERATION", "INVALID_VALUE", "UNSAFE_STRUCTURE", "POLICY_FAILURE", "VERIFICATION_FAILURE"] satisfies readonly EditFailureCode[];
const request = editMetadata(new Uint8Array(), { operations, policy, preserveUnknown: true, verifyImagePayload: true });
export const typedResult: Promise<EditMetadataResult> = request;

// @ts-expect-error A set operation must carry a value.
export const missingValue: EditOperation = { op: "set", operationId: "invalid", target };

// @ts-expect-error A group removal must use an explicit family selector.
export const nonFamilyGroup: EditOperation = { op: "remove-group", operationId: "invalid-group", target };
export { failureCodes };
