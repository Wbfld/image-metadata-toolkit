import { redactMetadata } from "../src/index.js";
import type { RedactOptions, RedactionTarget } from "../src/types.js";

const targets = [
  "EXIF",
  { kind: "field", fieldId: "IFD0:0x010f" },
  { kind: "selector", selector: { kind: "family", family: "XMP" } },
  { kind: "selector", selector: { kind: "namespace-property", namespaceUri: "http://purl.org/dc/elements/1.1/", localName: "title" } },
  { kind: "selector", selector: { kind: "sensitivity", sensitivity: "high" } },
  { kind: "selector", selector: { kind: "field-id", fieldId: "normalized:DateTimeOriginal" } },
  { kind: "selector", selector: { kind: "block", blockId: "jpeg:APP1:2" } },
  { kind: "selector", selector: { kind: "associated-image", imageId: "primary" } },
] satisfies readonly RedactionTarget[];

const fieldTarget = { kind: "field", fieldId: "IFD0:0x010f" } satisfies RedactionTarget;
const options = { remove: targets, preserve: [fieldTarget] } satisfies RedactOptions;
export const typedRedactionRequest = redactMetadata(new Uint8Array(), options);

// @ts-expect-error A selector must use a supported metadata family.
const invalidFamily: RedactionTarget = { kind: "selector", selector: { kind: "family", family: "not-a-family" } };

// @ts-expect-error A selector must use a supported sensitivity.
const invalidSensitivity: RedactionTarget = { kind: "selector", selector: { kind: "sensitivity", sensitivity: "secret" } };

export { invalidFamily, invalidSensitivity };
