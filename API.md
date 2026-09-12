# browser-image-metadata API reference

## `parseMetadata(input, options?)`

```ts
parseMetadata(input: MetadataInput, options?: ParseOptions): Promise<MetadataResult>
```

Parses an `ArrayBuffer`, `ArrayBufferView`, `Blob`, or browser `File` entirely
locally. It returns a stable result with `format`, `mimeType`, `dimensions`,
normalized `fields`, typed EXIF `composites`, raw `exif`, `xmp`, `iptc`, `icc`, `jfif`, `pngText`, and
bounded `warnings`. `result.completeness` explicitly records whether the full
requested inspection completed without error warnings. `ParseOptions.signal`
supports cancellation before work, between Blob range reads, during PNG
decompression, and at bounded container traversal checkpoints. A synchronous
ArrayBuffer parse can only observe cancellation at parser checkpoints; worker
clients can opt into `terminateOnAbort` for immediate interruption.

`result.blocks` records every recognized metadata family retained in the
result, its container role, inspection status, sensitivity, and related warning
codes. Block offsets and lengths are null when a parser cannot establish an
unambiguous source range.

`result.coverage` separates the requested operation from whole-file knowledge.
`coverage.requested` describes whether the requested selection completed;
`coverage.wholeFile` is conservative for privacy decisions and becomes
`skipped-by-selection`, `partial`, `malformed`, `opaque`, or `unsupported` when
any metadata-bearing block is not fully classified. `coverage.reasons` contains
stable machine-readable codes and human messages, while
`coverage.unclassifiedBlockIds` identifies the affected blocks. Each block also
has a normalized `coverage` state (`complete`, `partial`, `skipped-by-selection`,
`malformed`, or `opaque`).

Supported metadata readers are JPEG EXIF/JFIF/XMP/IPTC/ICC, PNG EXIF/text/XMP/
ICC, classic TIFF EXIF/XMP/IPTC/ICC, WebP EXIF/XMP/ICC, and bounded HEIF/AVIF
EXIF/XMP/primary dimensions/ICC/`nclx` inspection. HEIF and AVIF use bounded
`cdsc` item references to associate metadata items with the declared primary
image. Unknown EXIF tags remain in
`result.exif.fields`.

`ParseOptions.select` accepts metadata `groups` and EXIF `tags`. All container
readers avoid decoding unrequested EXIF fields and metadata families; `tags`
accepts names such as `Make` and stable IDs such as `IFD0:0x010f`. The default
is a complete scan.
Set `scope: "jpeg-header"` for a latency-sensitive JPEG preview. With a `Blob`
or `File`, the reader uses `slice()` and stops immediately after the
start-of-scan header, leaving entropy-coded image data unread. The result has
`completeness.scope: "partial"` and records the intentional scope reason.
Set `scope: "metadata"` for JPEG, PNG, WebP, classic TIFF/BigTIFF, HEIF, and AVIF `Blob`/`File` inputs
to read metadata ranges while skipping image payload data. PNG/WebP scan chunk
headers; JPEG follows marker lengths and fetches selected APP/SOF ranges;
TIFF/BigTIFF follows bounded directory and value offsets (including SubIFDs and
directory chains) and compacts only the requested
metadata for the existing parser. `completeness.bytesRead` plus
`completeness.inputBytes` report the range-read evidence. HEIF and AVIF copy
bounded `ftyp`/`meta` structures and resolve only selected direct metadata
boxes or `iinf`/`iloc` Exif and RDF/XML XMP item extents. Unsupported or
malformed item layouts conservatively fall back to a full read.

Range-backed reads use the exported `createByteSource()` abstraction. It accepts
the same `ArrayBuffer`, `ArrayBufferView`, and Blob/File inputs, validates every
half-open range, coalesces overlapping reads queued together, and maintains a
bounded LRU cache. `source.telemetry()` reports underlying requests, fetched
bytes, cache hits, coalesced reads, and cache occupancy. `maxReadRequests`,
`maxReadBytes`, and `maxReadCacheBytes` are enforced alongside the existing
input and metadata limits. JPEG metadata-scope provenance is remapped to the
original source offsets even when only selected marker ranges were fetched.

## `parseMetadataMany(inputs, options?)`

```ts
parseMetadataMany(inputs: readonly MetadataInput[], options?: ParseManyOptions): Promise<readonly MetadataResult[]>
```

Parses an ordered collection locally and returns results in the same order.
`options.concurrency` bounds simultaneous work and defaults to four. Every
item receives the same parse selection, limits, scope, and cancellation signal.
The function rejects invalid concurrency and propagates parse or cancellation
errors without concealing them in a result array.

## `browser-image-metadata/fetch`

```ts
fetchMetadata(input: RequestInfo | URL, options?: FetchMetadataOptions): Promise<MetadataResult>
```

The optional fetch entry point makes network access explicit. It streams the
response with the same `maxInputBytes` bound used for local inputs, rejects
non-successful HTTP responses, and passes downloaded bytes to the local
parser. Supply `options.fetch` for custom runtimes or tests. The root entry
point never fetches URLs.

## `redactMetadata(input, options)`

```ts
redactMetadata(input: MetadataInput, options: RedactOptions): Promise<RedactionResult>
```

JPEG metadata, WebP metadata chunks, and selected PNG ancillary chunks can be removed without
decoding or recompressing pixels. `remove` accepts `AllMetadata`, whole
metadata classes (`EXIF`, `XMP`, `IPTC`, `ICC`, `JFIF`, `PNGText`), and the
normalized EXIF privacy targets. `preserve` wins over a conflicting removal.
Unsafe or malformed surgery is atomic: the original bytes are returned with an
error warning and no removal record. `result.outcome` identifies typed
unapplied targets, human-readable reasons, and whether the operation was fully
satisfied. `RedactOptions.signal` is checked before and during input
materialization and before surgery begins; worker clients can terminate a
running worker for immediate interruption.
JPEG MPF multi-picture files and Ultra HDR gain-map XMP are detected before
surgery. They return an `UNSUPPORTED_STRUCTURE` warning and unchanged bytes
until secondary-image offsets can be rewritten safely.

## `sanitizeMetadata(input, options?)`

```ts
sanitizeMetadata(input: MetadataInput, options?: SanitizeOptions): Promise<SanitizationResult>
```

Performs a strict sharing-oriented redaction. It keeps ICC rendering information
and EXIF orientation by default, but returns `data: null` if the requested
policy cannot be proved complete. Failed results include stable `reasonCodes`
when a remaining opaque, malformed, or unsupported structure explains the
failure.

## `getCapabilities(format)`

```ts
getCapabilities(format: ImageFormat): FormatCapabilities
```

Returns the metadata groups, supported parse scopes, and lossless redaction
targets supported for a format. `readScopes` reports `full` for ordinary
inputs, `metadata` for Blob/File range reads, and `jpeg-header` for JPEG
previews. The returned arrays are copies and can be used directly to build UI.

## `getMetadataSummary(result)`

```ts
getMetadataSummary(result: MetadataResult): MetadataSummary
```

Builds a typed application summary from normalized fields while retaining the
complete raw result for advanced callers. It includes timezone-aware date
companions when explicitly stored, modern sensitivity values, lens
specification, owner/serial identifiers, and decoded UserComment text.

## `getExifComposites(result)` / `readExifComposites(input, options?)`

These helpers return typed EXIF interpretations for capture time, GPS time,
field of view, exposure value, 35mm equivalence, image orientation, and primary
display dimensions. Every composite includes source field IDs, all candidates,
derivation, uncertainty, conflicts, and diagnostics. `ParseOptions.normalization`
defaults to `"lenient"`; `"strict"` withholds values whose required sources are
invalid or conflicting and emits error diagnostics. Raw EXIF fields remain
available in both modes.

EXIF/TIFF topology is available through `result.exif.topology` and the
compatibility `result.exif.ifds` list. Directories expose stable identities,
source offsets, kind, parent/next links, associated-image roles, and shared
offset state. `topology.relations` preserves pointer, SubIFD, chained-next,
shared-offset, and cycle relationships. Fields retain `directoryId` and
`source.directoryId`, so equal tags in multiple previews or SubIFDs are never
flattened. EXIF directory blocks expose the same links through
`MetadataBlock.directoryId`, `role`, and `relationships`; strip/tile pixel
offsets are not traversed. `result.exif.associatedImages` contains bounded
offset/length references for thumbnail and preview JPEG payloads without
decoding those payloads.

## Convenience helpers

The root entry point also exports task-oriented helpers for common application
workflows:

- `getGps(result)` returns validated decimal coordinates and altitude, plus
  `complete` and source conflicts. It never treats raw DMS values and their
  normalized decimal field as a conflict.
- `getOrientation(result)` returns the validated EXIF orientation code and any
  HEIF/AVIF container transform. The `source` value identifies whether the
  result came from EXIF, a container transform, or both.
- `getRotation(result)` returns degrees, radians, mirror scales, a dimension
  swap flag, and a CSS transform. Conflicting EXIF and container transforms are
  included in `conflicts` instead of being silently hidden.
- `getThumbnail(result)` returns a defensive copy of the bounded embedded EXIF
  thumbnail, or `null`.
- `getCaptureTime(result)` prefers `DateTimeOriginal`, then `DateTime`, then
  `DateTimeDigitized`, and preserves an explicitly stored timezone offset
  without inferring one from the runtime environment.

Direct input variants avoid a full application-level parse for common tasks:

- `readGps(input, options?)`
- `readOrientation(input, options?)`
- `readRotation(input, options?)`
- `readThumbnail(input, options?)`
- `readCaptureTime(input, options?)`
- `readExifComposites(input, options?)`
- `readTags(input, tags, options?)`
- `readMetadataSummary(input, options?)`
- `readStructuredXmp(input, options?)`
- `getIptcSemantic(result, options?)`
- `readIptcSemantic(input, options?)`
- `readPreset(input, preset, options?)`, where `preset` is `essential`,
  `camera`, `location`, `privacy`, or `all`.

`DirectReadOptions` accepts limits, cancellation, and scope, but helpers own
their selections. `indexMetadataFields(result)` exposes `byId`, `byName`, and
`allByName` maps for repeat lookup without flattening duplicate metadata.
`getStructuredXmp(result, options?)` and `readStructuredXmp(input, options?)`
decode retained XMP packets into a bounded namespace-aware RDF model while
retaining a document entry, diagnostics, and packet/block provenance for every
packet that could not be decoded safely. `document.value.rdf` preserves ordered
property occurrences, Bag/Seq/Alt arrays, language alternatives, typed and
lexical literals, resources, blank nodes, qualifiers, aliases, and source
offsets. `document.value.properties` remains the alpha-era lossy compatibility
map. `document.provenance` identifies embedded or Extended-XMP sources.
`document.value` is never merged implicitly. Use `mergeStructuredXmp()` with
`preserve-all`, `first`, or `last`; preserve-all is the default and exposes all
candidates and conflicts. The merge input can carry caller-supplied sidecar
provenance, but core parsing never reads sidecar files.

`getIptcSemantic()` and `readIptcSemantic()` expose the additive IPTC Photo
Metadata Standard 2025.1 view. It is generated from the pinned official
TechReference and maps IPTC-IIM plus URI/local-name XMP properties from IPTC
Core/Extension, Dublin Core, Photoshop, PLUS, and XMP Rights. Each field keeps
all candidates, source packet/block and IIM occurrence provenance, raw and
lexical values, validation state, and conflicts. The default `preserve-all`
policy does not apply IIM-versus-XMP precedence; callers may explicitly choose
`first` or `last` for a convenience value. Unknown or invalid values remain
inspectable and diagnostics are retained.
`IPTC_IIM_DATASETS` is the immutable catalog of all recognised IIM transport,
application, preview, and object-data datasets, including format, cardinality,
repeatability, min/max byte bounds, version, and sensitivity metadata.
`IPTC_TECHREFERENCE_VERSION_DELTA` records the fields added in 2025.1 (the four
AI prompt/system properties) and any fields removed relative to 2023.1.

## `auditPrivacy(input, options?)`

```ts
auditPrivacy(input: MetadataInput, options?: PrivacyAuditOptions): Promise<PrivacyAuditResult>
```

Parses locally and reports recognized metadata classes, sensitive normalized
fields, opaque blocks, thumbnails, trailing bytes, parser warnings, and known inspection gaps. `safe` is conservative: it
is true only when requested and whole-file coverage are complete, every block is
classified, no recognized or opaque metadata findings remain, and no inspection
gaps are reported. `coverage` mirrors the parser coverage model and
`reasonCodes` provides stable machine-readable policy outcomes (for example
`RAW_XMP`, `OPAQUE_JPEG_MARKER`, `TRAILING_BYTES`, and
`SENSITIVE_METADATA_PRESENT`). Audit options accept the same limits and
`AbortSignal` controls as other local inspection operations.

## Limits and warnings

`ParseOptions.limits`, `RedactOptions.limits`, and `PrivacyAuditOptions.limits` accept positive safe integer
overrides for input, metadata, segment, chunk, IFD, nesting, string, per-chunk
decompression, cumulative decoded metadata, range requests/bytes/cache, and warning budgets. Every parser warning has a stable `code`,
`message`, and `severity` (`warning` or `error`), with offsets where available.
Oversized top-level input rejects with `MetadataError` code `LIMIT_EXCEEDED`.
PNG `iTXt` text is decoded as UTF-8. PNG selective EXIF redaction uses the same
bounded TIFF-directory validation as JPEG surgery and regenerates changed CRCs.
Unknown redaction targets are reported as warnings and do not change bytes.
IPTC semantic processing additionally bounds `maxIptcDatasets`,
`maxIptcCandidates`, `maxIptcStructureDepth`, and `maxIptcOutputBytes`.
Image/container details additionally bound retained candidates with
`maxImageDetailCandidates` (4,096), animation frames with
`maxImageDetailFrames` (4,096), and auxiliary/thumbnail relationships with
`maxImageDetailRelationships` (4,096). These are cumulative output limits;
truncated results retain diagnostics rather than allocating from hostile
header counts.

## Focused entry points

`browser-image-metadata/detect` contains signature detection only.
`browser-image-metadata/jpeg` contains JPEG-only parsing, including the
header-only and metadata-only Blob paths. `browser-image-metadata/redact` contains lossless JPEG,
PNG, and WebP redaction without importing metadata readers.
`browser-image-metadata/mini` provides a small JPEG-focused reader with the
same task-oriented summary helpers as the root entry point. Its
`parseMetadata` export is an alias for `parseJpegMetadata` and rejects
non-JPEG inputs with `UNSUPPORTED_FORMAT`.
`browser-image-metadata/xmp` provides bounded structured RDF XMP decoding
against ISO 16684-1:2019, Adobe XMP Specification Parts 2 (February 2022) and
3 (January 2020), W3C Namespaces in XML 1.0 (Third Edition), and the RDF 1.1
XML Syntax and Concepts recommendations.
It exports string and UTF-8 byte decoders, detailed diagnostic results,
`mergeStructuredXmp()`, and `parseStructuredXmpWithDecoder()` for applications
that supply an XML decoder. The adapter is validated against the same canonical
RDF model and receives the same UTF-8, DTD/entity, depth, node, attribute,
namespace, text, property, array, qualifier, and output limits; supplied
decoders must not resolve external resources. Bounds are also available as
`maxXmpNodes`, `maxXmpAttributes`, `maxXmpNamespaces`, `maxXmpDepth`,
`maxXmpTextBytes`, `maxXmpProperties`, `maxXmpArrayItems`,
`maxXmpQualifiers`, `maxXmpPackets`, and `maxXmpOutputBytes` in
`SecurityLimits`.
`browser-image-metadata/xmp/rgrove` is a separate optional-peer adapter around
`@rgrove/parse-xml`; it first validates a bounded packet with that parser and
then returns the same RDF-oriented result shape. Existing
`StructuredXmpPacket.namespaces` and `.properties` consumers remain valid;
the lossless model is additive through `.rdf`/`.model`.

EXIF results expose a bounded `exif.thumbnail` when the referenced thumbnail
range is safe and within limits. HEIF and AVIF results keep stored dimensions
separate from `displayDimensions`, expose primary-item `irot`/`imir`
transforms, and return primary-item `nclx` colour parameters when present.
`browser-image-metadata/worker` provides a module-worker client and installer.

## Types and compatibility

All public types are exported from the package root. `MetadataField.raw`
preserves source values, including exact rational numerator/denominator pairs;
`value` is validated/interpreted metadata and `display` is human-readable.
The package has ESM and CommonJS exports, browser/Web Worker-compatible ESM,
and no runtime dependencies. It never performs network I/O.

See [`README.md`](./README.md) for field semantics, format limitations, and
complete runnable examples.

## ICC, image details, and output adapters

Complete ICC profiles expose bounded decoded standard tag payloads through
`result.icc.decodedTags`; each value retains its profile-relative range and
status, while unknown payloads remain range-only. Supported payloads include
ASCII/legacy descriptions, MLUC records, XYZ arrays, sampled and parametric
curves, matrices, measurements, viewing conditions, colorants, signatures, and
LUT8/LUT16/A-to-B/B-to-A structure headers. Exact shared ranges are accepted;
partial overlaps are malformed. ICC parsing does not apply colour transforms.
`result.details` is an additive, provenance-preserving common image-detail
view. It retains candidates from every validated JPEG SOF, PNG IHDR/APNG,
WebP frame/canvas, GIF descriptor, TIFF directory, or HEIF/AVIF item-property
source. Candidates carry source text, original block/offset provenance,
validation state, and a derivation explanation; conflicting candidates remain
visible in `conflicts` and are never silently selected. `primaryImageCandidates`
and `relationshipCandidates` retain image-item relationships while
`primaryImageId` is populated only when the primary is unambiguous. Empty
arrays mean that a fact was not proven (not that it is false). `support` is a
per-format matrix with `supported`, `conditional`, and `unsupported` states.
The bounded header reader never decodes pixels or entropy-coded payloads.

`toFlatObject()`, `toFamilyGroups()`, `queryMetadata()`, `queryStructuredXmp()`, `toJsonSafe()`, and
`fromJsonSafe()`
provide deterministic output without silently losing duplicate fields. Flat
output preserves duplicates by default; `first` and `last` are explicit lossy
policies. `toLosslessFamilyGroups()` and `toJsonSafeResult()` retain all
canonical S03-S08 families, including RDF qualifiers, IPTC candidates, ICC
decoded values, image-detail conflicts, and block provenance. The JSON-safe
adapter uses tagged encodings for binary, exact rationals (including a zero
denominator), non-finite numbers, BigInt, and unsafe integer64 values and is
bounded by `maxAdapterItems` and `maxAdapterOutputBytes`.
`toExifrCompatible()` and `toExifReaderCompatible()` are documented lossy
migration helpers with explicit caller-selectable duplicate policies;
`MIGRATION.md` contains the conversion/loss matrix. `queryMetadata()` supports
stable field, family, directory, block, tag, and source-offset identities;
`queryImageDetails()`, `queryIptcSemantic()`, and `queryIccTags()` cover the
other canonical families. `queryStructuredXmp()` filters the RDF property
sequence by namespace URI/local name/prefix and an explicit source-order
occurrence, so namespace rebinding cannot change identity.
`browser-image-metadata/browser-thumbnail` exports
`createThumbnailObjectUrl()` and requires callers to invoke its idempotent
`revoke()` method; failed host URL creation fails closed without leaking an
object URL. The same adapter functions are available from the opt-in
`browser-image-metadata/adapters` ESM/CommonJS entry when an application does
not need the parser entry point.
