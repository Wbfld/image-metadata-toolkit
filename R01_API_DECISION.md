# R01 public API decision record

Status: accepted for the 2.0 release contract; additive changes only in the
current alpha line.

## Identity and compatibility

The published package name and import name are `browser-image-metadata`.
`image-metadata-toolkit` is the repository name only. The package uses ESM as
its source contract and publishes equivalent CommonJS declarations through the
same export map. Existing names remain available in 2.0: no public symbol is
removed or silently renamed by R01.

The stable API contract is version `1` and is described by
[`schemas/r01-api-v1.schema.json`](./schemas/r01-api-v1.schema.json). The
schema covers the JSON-safe metadata result and the discriminated edit,
redaction, sanitization, and sidecar outcomes. The checked declaration/export
snapshot is [`reports/r01-api-snapshot.json`](./reports/r01-api-snapshot.json).

## Result model

`parseMetadata(input, options?)` returns `Promise<MetadataResult>`. The input
is an `ArrayBuffer`, `ArrayBufferView`, `Blob`, or `File`; strings, paths, URLs,
and image elements are not accepted by the dependency-free core. The parser
does not perform network or filesystem access. `ParseOptions` owns selection,
limits, cancellation, registry, normalization, and explicit MakerNote plugin
configuration.

Every result retains physical container identity, normalized fields, raw family
views, source blocks, coverage, completeness, warnings, and optional telemetry.
`coverage` is the privacy/conformance boundary; `completeness` describes the
requested read. A decoded value is never inferred from a warning string.
Duplicate values, conflicts, raw/lexical values, unknown structures, and
source ranges remain observable where the parser can establish them.

`toJsonSafeResult(result)` is the stable serialized metadata view. Binary,
64-bit, rational, non-finite, and undefined values use tagged reversible JSON
objects. `toJsonSafe()` applies the same bounded output model to arbitrary
adapter values. Reports must use this view and must not serialize raw privacy
values unless the caller explicitly opted into them.

## Discriminated operation outcomes

`editMetadata()` returns `EditMetadataResult`, discriminated by
`successful` and `status`. A successful result has `successful: true`,
`status: "applied"`, and non-null `data`. A failed result has
`successful: false`, a typed non-`applied` status, and `data: null`. Operation
IDs, typed failures, physical byte changes, policy evidence, and verification
evidence are retained. Writers validate and plan before allocating output and
must not mutate caller-owned input.

`redactMetadata()` returns a typed `RedactionResult` with operation evidence
when selectors are used. `outcome.successful`, `outcome.complete`, and
`outcome.unapplied` are the machine contract; human warning text is secondary.
`sanitizeMetadata()` returns a discriminated successful/failed result and only
provides bytes when its strict policy has been satisfied.

`parseXmpSidecar()` and `mergeXmpSources()` are explicit sidecar operations.
The default merge policy is `preserve-all`; first/last-style precedence is
never implicit. `serializeXmpSidecar()` returns new bytes, verifies semantic
reparsing by default, and never writes or changes an image.

## Sync/async boundaries

The canonical public parser and writers are asynchronous at their public input
boundaries because `Blob`, `File`, range-backed Node sources, cancellation,
and worker transport are supported. The internal in-memory TIFF graph and
preservation verifier expose synchronous forms only where their contracts are
already explicit (`parseTiffGraph`, `serializeTiff`, and
`verifyPreservationSync`). No second synchronous parser is added.

Worker operations are message-based and return promises. Transferable input
is copied or transferred only after bounded validation; functions such as
MakerNote plugins and Brotli decoders are not silently transferred.

## Mutation and privacy

Mutation is transactional. A failed preflight, unsupported structure, failed
verification, conflict refusal, or insufficient privacy coverage yields no
output bytes. Selectors resolve exact registry field IDs, namespace URI/local
name, physical block, associated image, family, sensitivity, policy, or
resource identity. Legacy family/string targets remain compatibility adapters.

Privacy defaults are fail-closed for unknown XMP, opaque blocks, sensitive
IPTC categories, incomplete coverage, and undecoded vendor data. Raw semantic
values are omitted from default privacy serialization and require an explicit
`includeRawValues` option.

## Optional adapters and extensions

The dependency-free core and ordinary parser/writer bundles do not import C2PA
SDKs. Official C2PA verification is available only through the separate
`c2pa/browser` and `c2pa/node` entry points. Their results retain the complete
official result and use namespaced adapter statuses; T03 inventory remains
structural inventory, not verification.

MakerNote packs are explicit per-operation plugins. There is no global plugin
registry. Plugin identity, source provenance, confidence, opaque outcomes,
limits, and diagnostics are retained; plugin exceptions do not become public
raw error text.

## Change control

The release gate checks the versioned schema, package export map, root and
subpath runtime exports, declaration hashes, and this contract's expected
surface. Any drift fails `npm run r01:check` until the snapshot and this
decision record are reviewed together. A schema version is never changed in
place for an incompatible result change; a new version and migration note are
required.

