import { editMetadata } from "../src/index.js";

const plannedEdit = await editMetadata(new Uint8Array(), {
  operations: [
    {
      op: "set",
      operationId: "set-caption",
      target: { kind: "field", fieldId: "XMP:dc:description" },
      value: { "lang-x-default": "Caption" },
    },
    {
      op: "delete",
      operationId: "remove-sensitive",
      target: { kind: "selector", selector: { kind: "sensitivity", sensitivity: "high" } },
    },
  ],
  policy: {
    preserve: [{ kind: "field", fieldId: "EXIF:IFD0:0x0112" }],
    unknown: "preserve",
    verification: "reparse-and-preserve-payload",
  },
});

if (!plannedEdit.successful) {
  console.log(plannedEdit.status, plannedEdit.unapplied.map(({ operationId, failure }) => `${operationId}:${failure.code}`));
}

