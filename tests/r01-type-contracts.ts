import type {
  EditMetadataResult,
  EditOperation,
  EditTarget,
  MetadataInput,
  MetadataResult,
  ParseOptions,
  RedactionSelector,
  SanitizationResult,
  XmpSidecarMergePolicy,
} from "../src/index.js";

export declare const result: MetadataResult;
export declare const edit: EditMetadataResult;
export declare const sanitization: SanitizationResult;
export declare const input: MetadataInput;
export declare const parseOptions: ParseOptions;
export declare const selector: RedactionSelector;
export declare const target: EditTarget;
export declare const operation: EditOperation;
export declare const sidecarPolicy: XmpSidecarMergePolicy;

export function narrowEdit(value: EditMetadataResult): Uint8Array | null {
  if (value.successful) { const bytes: Uint8Array = value.data; return bytes; }
  const noBytes: null = value.data; return noBytes;
}
export function narrowSanitization(value: SanitizationResult): Uint8Array | null {
  if (value.successful) { const bytes: Uint8Array = value.data; return bytes; }
  const noBytes: null = value.data; return noBytes;
}
export const acceptedInput: MetadataInput = input;

// @ts-expect-error Paths are Node-adapter inputs, not dependency-free core inputs.
export const pathIsNotCoreInput: MetadataInput = "photo.jpg";
// @ts-expect-error Invalid sidecar merge policy must not compile.
export const invalidPolicy: XmpSidecarMergePolicy = "first";
// @ts-expect-error A delete operation cannot carry a set-only value.
export const invalidOperation: EditOperation = { op: "delete", operationId: "bad", target, value: "not-allowed" };
// @ts-expect-error Namespace selectors require both URI and local name.
export const incompleteSelector: RedactionSelector = { kind: "namespace-property", namespaceUri: "urn:example:" };
