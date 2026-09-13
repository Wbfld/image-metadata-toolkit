# W01 mutation model

Status: accepted API contract for the trust/edit beta. The `editMetadata()`
entry point validates a transaction, applies only the dedicated writer for the
detected safe container, and returns typed unsupported evidence for operations
outside that writer's scope. W02 supplies standalone TIFF/BigTIFF EXIF graph
writing, W03 supplies transactional JPEG marker metadata writing, W04 supplies
PNG chunk writing, and W05 supplies WebP metadata writing; other format writers
remain explicit unsupported results.

## Decision

The public operation is:

```ts
editMetadata(input: MetadataInput, options: EditMetadataOptions): Promise<EditMetadataResult>
```

`EditOperation.operationId` is required, bounded, and unique within one
request. It is the identity used by `result.operations` and
`result.unapplied`; callers never need to parse a warning message to determine
which request was not applied.

Every operation address is an `EditTarget`:

- `{ kind: "field", fieldId }` names a canonical registry identity. A field
  ID is a stable identity such as `EXIF:ExifIFD:0x9003` or
  `XMP:dc:description`; display names and namespace prefixes alone are not
  accepted.
- `{ kind: "selector", selector }` is an explicit selector. Supported
  selectors are metadata family, block ID, associated image ID, sensitivity,
  namespace URI plus local name, field ID, and named policy. Namespace
  selectors use the URI and local name together; a prefix is never sufficient.

The operation set is deliberately explicit:

| Operation | Meaning | Removal behavior |
| --- | --- | --- |
| `set` | Add or replace the value at one field or selector target according to the duplicate and conflict policies. | No implicit removal beyond the selected duplicate policy. |
| `delete` | Remove candidates matched by a field or selector. | Preserve rules are evaluated first. |
| `copy` | Copy candidates from `source` to `destination`, retaining the source. | Destination conflicts use the conflict policy. |
| `rename` | Move the logical candidates from `source` to `destination`. | The source is removed only after the destination is safely represented; an unsafe structure fails atomically. |
| `alias` | Add a destination identity for the same logical value while retaining the source identity. | No source removal. |
| `remove-group` | Remove one explicitly selected metadata family. | The family selector is required by the type and preserve rules win. |
| `remove-policy` | Apply the named policy’s removal set. | Preserve rules still win over the policy. |
| `merge-sidecar` | Merge caller-supplied XMP or IPTC-IIM bytes into an explicit target. | The sidecar is never read from a path or URL; merge conflicts use the declared policy. |

`rename` and `alias` are not synonyms: rename changes the logical identity,
while alias adds an additional identity. A `copy` does not remove its source.
These distinctions remain in operation evidence so a future writer cannot infer
intent from a human description.

## Policy decisions

The resolved policy is included in every result. Defaults are intentionally
trust-first:

- Preserve rules are evaluated before removal rules. If a candidate matches
  both, it is preserved and the removal operation receives a
  `POLICY_FAILURE` result. This is fixed as `preserve-wins`; there is no hidden
  last-rule-wins behavior.
- Unknown fields, blocks, XMP properties, and sidecar values are preserved by
  default. `unknown: "remove-unselected"` is an explicit opt-in broad removal
  policy; `unknown: "reject"` refuses an edit when an unknown candidate would
  make the requested policy unprovable. The `preserveUnknown` boolean is only a
  compatibility shorthand for the first two choices.
- Ordering defaults to `preserve-source`, which retains source order and
  repeated candidates. `canonical` is deterministic registry order.
  `operation-order` requires every operation ID exactly once. No first/last
  convenience selection is implicit.
- Duplicate handling defaults to `preserve`. `replace-target`,
  `deduplicate-equivalent`, and `reject` are explicit alternatives.
- Conflict handling defaults to `preserve-all`. `prefer-existing`,
  `prefer-requested`, and `reject` are explicit alternatives. A preference is
  never inferred from array position or from a warning string.
- Verification defaults to `reparse-and-preserve-payload`. `reparse` verifies
  only the metadata/image structure and `none` explicitly disables preservation
  verification. A successful writer result will require all checks named by its
  resolved verification policy.

The `policy.preserve` and `policy.remove` arrays are constraints on the whole
transaction. Operation-level deletes and group/policy removals are still
identified by their own operation IDs. Exact policy overlaps are recorded in
`policy.overlappingTargets`; container-aware selectors apply the same
preserve-first rule to every matched candidate.

## Input validation

Validation happens before a transaction can be planned. It rejects:

- missing, duplicate, empty, or oversized operation IDs;
- unknown operation kinds, missing addresses, non-canonical field IDs, and
  malformed selectors;
- non-absolute namespace URIs, empty local names, invalid sensitivities,
  invalid family/block/image/policy identities, and same-source/destination
  copy, rename, or alias operations;
- undefined, non-finite, cyclic/non-plain, excessively deep, excessively large,
  or unsupported structured values;
- malformed or oversized sidecar data, unsupported sidecar formats, and
  contradictory shorthand versus nested policy options;
- incomplete explicit operation order and invalid security-limit overrides.

Request values are bounded by the existing security limits, including
`maxAdapterItems`, `maxAdapterOutputBytes`, and `maxValueBytes`, with a fixed
maximum structured-value depth. The core does not open paths, fetch URLs, or
mutate caller-owned `ArrayBuffer`, typed-array, or `Blob` input. Cancellation
uses the package’s existing `ABORTED` error contract.

## Result and evidence contract

`EditMetadataResult` is a discriminated result. A successful result has
`successful: true`, `status: "applied"`, and non-null output bytes. A failed
result has `successful: false`, `data: null`, and a status of
`unsupported`, `invalid-value`, `unsafe-structure`, `policy-failure`,
`verification-failure`, or `mixed-failure`.

Each requested operation has one `EditOperationEvidence` record containing its
operation ID, operation kind, targets, status, candidate/applied counts,
matched field and block IDs, byte changes, preserved-unknown count, and a
typed failure. The `unapplied` array repeats only the operation identity,
status, targets, and typed failure needed for automation. The failure codes
are:

```text
UNSUPPORTED_OPERATION
INVALID_VALUE
UNSAFE_STRUCTURE
POLICY_FAILURE
VERIFICATION_FAILURE
```

Human-readable `detail` strings and ordinary parser `warnings` are explanatory
only. No result status or unapplied-operation calculation depends on their
wording.

`input`, `output`, and `verification` evidence have stable slots for input and
output hashes, format and byte lengths, byte-change ranges, encoded-payload
hashes, reparsing, dimensions, relationships, and verification diagnostics.
When no dedicated writer is available, no output bytes are generated: input
hashes and output evidence are null, verification is `not-run`, and every valid
operation is explicitly `unsupported`. This is an intentional result, not a
claim that an edit occurred. TIFF/BigTIFF and JPEG use their writer-specific
evidence when the complete transaction is verified.

Future writers must preserve transactional invariants: calculate the complete
plan before allocation, build new output without changing the source, retain
unknown candidates unless policy says otherwise, reparse the output, run the
resolved verification checks, and return no output bytes when any operation,
structure, policy, or verification step fails.

## Example

```ts
import { editMetadata } from "browser-image-metadata";

const result = await editMetadata(bytes, {
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
  policy: { unknown: "preserve", verification: "reparse-and-preserve-payload" },
});

if (result.successful && result.data !== null) {
  useEditedBytes(result.data);
} else {
  for (const operation of result.unapplied) {
    console.error(operation.operationId, operation.failure.code, operation.failure.detail);
  }
}
```

The result is format-dependent: the dedicated JPEG, PNG, and WebP writers can
apply the supported operations transactionally, while formats without a
dedicated writer return typed `UNSUPPORTED_OPERATION` evidence and no bytes.
