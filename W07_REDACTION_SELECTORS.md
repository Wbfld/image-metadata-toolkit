# W07 typed redaction selectors

The redaction API accepts the historical string targets and typed targets. The
strings are a compatibility adapter for the existing lossless format surgeries;
typed requests are resolved before any bytes are changed.

## Typed identity

`RedactionTarget` supports:

- `{ kind: "field", fieldId }` for a registry field identity;
- `{ kind: "selector", selector: { kind: "family", family } }`;
- `{ kind: "selector", selector: { kind: "namespace-property", namespaceUri, localName } }`;
- `{ kind: "selector", selector: { kind: "sensitivity", sensitivity } }`;
- `{ kind: "selector", selector: { kind: "field-id", fieldId } }`;
- `{ kind: "selector", selector: { kind: "block", blockId } }`; and
- `{ kind: "selector", selector: { kind: "associated-image", imageId } }`.

Field IDs are matched against the parser's registry-backed IDs, directory and
tag identities, normalized names, IPTC semantic IDs, and URI-aware semantic
candidates. Namespace selectors compare namespace URIs and local names; a
prefix or display label is never used as identity. Unknown XMP semantic
candidates remain targetable by their URI/local-name pair and are not treated
as harmless.

For a field or namespace-property request that resolves to a readable source,
the resolver records an exact physical address before mutation. EXIF addresses
contain the IFD, tag, directory, and source block; IPTC addresses contain the
record/dataset, occurrence, and Photoshop resource block; XMP addresses contain
the packet, namespace URI, local name, property order, and embedded packet
block. The writers use those addresses to remove only the selected field or
property. An exact request never falls back to family-wide removal. The
generated-registry sensitive fields readable from the JPEG regression fixture
are all exercised by exact-target tests (11 fields in the current fixture).

## Preflight and physical scope

`redactMetadata` parses the selected metadata families before invoking a format
surgery. A typed selector with no matching field, block, family, namespace
property, or associated image returns the original bytes, an error-level
`REDACTION_SKIPPED` warning, and an unsuccessful outcome. The surgery is never
started for that request.

When a typed request resolves to a physical block, the resolver records its
physical ancestor for directory and assembled-resource blocks. JPEG, PNG, and
WebP surgeries consume that scope so duplicate metadata blocks are not widened
to an unrelated block. A family selector intentionally scopes all matching
physical blocks. Selectors for nested fields are scoped to the containing
physical block; the existing format-specific field surgery remains responsible
for its safe byte-level behavior.

Exact EXIF operations use the registry-backed field writer, while exact IPTC
and XMP operations rebuild only the selected Photoshop resource or embedded
RDF packet and preserve all other values, ordering, repetitions, and raw
bytes represented by the bounded model. IPTC occurrence-qualified IDs select
one duplicate instance. If an exact preserve request would be widened by a
simultaneous broad removal and cannot be represented by the legacy preservation
adapter, the whole request is rejected before output allocation; it is never
silently weakened.

The optional `RedactOptions.registry` is passed to the same bounded parser used
by readers. This keeps canonical field identity and sensitivity policy tied to
the caller's immutable registry instead of maintaining a second redaction
vocabulary.

## Outcome and precedence

Public typed results include one `operations` record per removal request. Each
record has a stable operation ID, candidate and applied counts, matched field
and physical-block IDs, a status, and a machine-readable failure code. Outcome
success and `unapplied` targets are derived from those records and their
physical coverage. Human-readable warning text is explanatory only and is not
used to decide whether a target was applied. A typed result reports the
original typed request in `removed` and `unapplied` records.

Preserve rules are evaluated before removal at each physical target. A family
removal therefore cannot remove a preserved field, and a block-scoped preserve
rule affects only that block. If the requested format cannot perform the
necessary selective operation, the existing surgery returns the original bytes
and an unsuccessful outcome; no partial output is exposed.

The focused contract coverage is in
[`tests/redaction-w07.test.ts`](./tests/redaction-w07.test.ts), together with
the existing legacy redaction and integration suites. It covers canonical EXIF
IDs, every selector kind, URI/local-name matching, duplicate physical XMP
blocks, duplicate IPTC occurrences, exact targeting of every readable
standardized sensitive field in the fixture, cross-family physical-block
isolation, typed preserve precedence, atomic preflight rejection, unsafe mixed
policy rejection, and unchanged caller-owned input.
