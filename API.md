# browser-image-metadata API reference

The stable public contract is version 1.0.0. Naming, discriminated result
outcomes, deprecations, runtime boundaries, and compatibility rules are
recorded in [`R01_API_DECISION.md`](./R01_API_DECISION.md),
[`DEPRECATION_POLICY.md`](./DEPRECATION_POLICY.md), and
[`RUNTIME_SUPPORT.md`](./RUNTIME_SUPPORT.md). The versioned JSON Schema is
[`schemas/r01-api-v1.schema.json`](./schemas/r01-api-v1.schema.json); its
checked declaration and export snapshot is retained in
[`reports/r01-api-snapshot.json`](./reports/r01-api-snapshot.json).

The static documentation site and local-only playground are described in
[`R02_DOCUMENTATION_SITE.md`](./R02_DOCUMENTATION_SITE.md). The Node-only
command-line surface is described in [`R03_CLI.md`](./R03_CLI.md); it uses the
same public parser, privacy, policy, mutation, and preservation APIs and is not
part of the browser/core dependency graph.

## `parseMetadata(input, options?)`

```ts
parseMetadata(input: MetadataInput, options?: ParseOptions): Promise<MetadataResult>
```

Parses an `ArrayBuffer`, `ArrayBufferView`, `Blob`, or browser `File` entirely
locally. It returns a stable result with `format`, `mimeType`, `container`,
`fileKind`, `dimensions`,
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
ICC, classic TIFF EXIF/XMP/IPTC/ICC, WebP EXIF/XMP/ICC, bounded SVG RDF/XML XMP
inside namespace-validated SVG `metadata` elements, separate CR3 and RAF
RAW container inventories with embedded supported metadata, and bounded HEIF/AVIF
EXIF/XMP/primary dimensions/ICC/`nclx` inspection. HEIF and AVIF additionally
expose `result.heif`, a bounded per-`meta` item graph retaining `pitm`, `iinf`,
`iloc` construction methods 0/1/2, multiple extents, self-contained `dref`
entries, `ipco`/`ipma` properties, and ordered `thmb`, `auxl`, `dimg`, `cdsc`,
and item-offset relationships. Grid, overlay, and identity derived descriptors
are structural only; no item pixels are decoded and external data references
are never fetched. Unknown EXIF tags remain in
`result.exif.fields`. TIFF-derived DNG, CR2, NEF, ARW, ORF, RW2, and IIQ inputs
retain `format: "tiff"` and `container: "tiff"` (or `"bigtiff"` where
applicable), with the camera variant in `fileKind`. Their bounded `result.raw`
inventory retains source ranges and provenance for RAW data, previews,
thumbnails, and opaque vendor payloads without copying or decoding sensor
pixels; RAW writing is unsupported.

SVG inventory accepts only valid UTF-8 documents with an SVG-namespace root.
DTD/entity declarations and malformed nesting are rejected; limits cover XML
elements, attributes, depth, packet count, metadata bytes, text, and warnings.
Non-RDF SVG metadata remains an opaque, high-sensitivity block. SVG rendering,
pixel decoding, and writing are outside the API surface.

CR3 exposes `result.cr3` with its ISO-BMFF boxes, retained B02/B03 item and
track candidates, transformations, sample ranges, metadata associations,
preview/RAW ranges, primary-selection ambiguity, and opaque Canon UUID
structures. RAF exposes `result.raf` with its validated fixed directory,
source-relative preview/thumbnail, proprietary metadata, and CFA/RAW ranges.
Both models are read-only inventories: they do not decode RAW pixels or fetch
network resources. See [B05_RAW_PHASE_TWO.md](./B05_RAW_PHASE_TWO.md) and the
hash-pinned evidence reports for the real CR3 and RAF corpus run.

HEIF and AVIF sequence-bearing ISO-BMFF inputs additionally expose
`result.heifSequences`. Each sequence retains its source range, timescale,
duration, fragmentation state, independent tracks, track handler and language,
stored dimensions, transformation matrix/orientation, sample descriptions,
sample offsets/lengths/timing/sync state, edit entries, track references, and
metadata associations. Item-graph metadata associations remain separate from
track associations. The backward-compatible top-level `dimensions` and image
detail view use sequence dimensions only when exactly one picture track is
unambiguously selectable; multiple picture tracks remain in the collection and
produce an explicit ambiguous primary-selection state. Sample payloads are
never decoded or copied.

JPEG XL container parsing reports codestream dimensions from `jxlc` or ordered
`jxlp` headers and reads `Exif`/`xml ` boxes. Brotli-compressed `brob` metadata
uses `ParseOptions.jxlBrotliDecompressor` when supplied; otherwise the parser
uses the runtime `DecompressionStream("brotli")` if available and reports
`UNSUPPORTED_COMPRESSION` when the platform exposes no Brotli stream support.
The callback is bounded, receives copied compressed bytes and an output limit,
and must not be used to infer metadata boxes in a naked codestream. Naked
codestreams expose dimensions only. Because it is a function, the callback is
not structured-clone transferable; worker clients reject it during preflight
with `UNSUPPORTED_STRUCTURE`. Configure a decoder in the worker instead.

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
boxes or `iinf`/`iloc` Exif and RDF/XML XMP item extents using the same bounded
construction-method resolver as full parsing. Unsupported or malformed item
layouts conservatively fall back to a full read; sequence-bearing `moov` and
`moof` boxes also use the bounded full-read fallback because sample offsets are
source-relative and cannot safely be compacted. The range planner never
dereferences external `dref` entries.

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

## `browser-image-metadata/http`

```ts
fetchMetadata(input: RequestInfo | URL, options?: HttpMetadataOptions): Promise<MetadataResult>
```

The explicit HTTP entry point probes `Range: bytes=0-0`, validates the
identity-encoded `206` response, `Content-Range`, total size, validators, and
final response URL, then supplies later ranges to the existing bounded JPEG,
TIFF, and HEIF/AVIF readers. Its default scope is `metadata`; use
`scope: "jpeg-header"` for a JPEG preview or `scope: "full"` when a complete
response is intentional. `result.telemetry.http` reports network request
counts, response/decoded bytes, cache hits, range support, requested/final URL,
redirect details, validator, fallback reason, and transport completeness.

Range reads require an ETag or Last-Modified validator by default. A server
that ignores ranges, compresses a range response, omits a validator, or
returns an invalid range fails closed. Set `allowFullResponseFallback: true`
to permit a complete response bounded by `maxFullResponseBytes` and the
normal `maxInputBytes` limit. The fallback reason remains observable. No
credentials, CORS mode, redirect mode, or other caller `RequestInit` policy is
added or hidden; `init` is forwarded with only the adapter-managed Range and
If-Range headers.

## `browser-image-metadata/node`

```ts
parseMetadata(input: NodeMetadataInput, options?: NodeParseOptions): Promise<MetadataResult>
```

This Node-only entry accepts a filesystem path (`string` or `URL`), a
structurally compatible `fs/promises` `FileHandle`, a `SeekableFileSource`,
and a binary `AsyncIterable` such as a Node `Readable`. Existing byte views,
`Blob`, and `File` inputs are passed through to the local parser; paths are
never accepted by the root/browser entry point.

`SeekableFileSource` exposes a safe `size` and asynchronous half-open
`read(start, end, signal?)` method. Its ranges are adapted to the existing
`ByteSource` and container planners, so `scope: "metadata"` can avoid image
payload ranges for formats that support metadata-scoped reads. The adapter
closes paths it opens and closes supplied file handles and sources by default
on success, parse failure, and abort. Set `closeSource: false` only when the
caller owns a supplied source's lifecycle; a path opened by the adapter is
always closed.

Non-seekable streams are spooled into bounded memory before the local parser
runs. `limits.maxInputBytes` bounds retained bytes and `maxStreamChunks`
(defaulting to `limits.maxReadRequests`) bounds accepted chunks. A stream
therefore cannot provide true range efficiency, even when `scope: "metadata"`
is requested. Stream values must be `ArrayBuffer` or `ArrayBufferView` binary
chunks; text chunks are rejected.

## `editMetadata(input, options)`

```ts
editMetadata(input: MetadataInput, options: EditMetadataOptions): Promise<EditMetadataResult>
```

W01 defines the trust-first edit transaction contract. Operations are `set`, `delete`, `copy`, `rename`, `alias`,
`remove-group`, `remove-policy`, and `merge-sidecar`. Every operation uses a
canonical field ID or an explicit selector; copy/rename/alias use explicit
source and destination targets. Operation IDs are required and appear directly
in `result.operations` and `result.unapplied`.

Preserve rules always win over removal rules. Unknown values are preserved by
default, source ordering and duplicates are retained by default, conflicts are
preserved by default, and verification defaults to reparsing plus encoded
image-payload preservation checks. First/last selection is never implicit; use
the explicit ordering, duplicate, and conflict policy types when a different
result is wanted. Sidecar data is supplied as bounded bytes or text and is
never loaded from a path or URL by the core entry point.

The result is discriminated by `successful` and `status`. On standalone
classic TIFF and BigTIFF input, exact EXIF field identities and `field-id`
selectors for `set`, `delete`, `copy`, `alias`, and `rename` are written through
the reusable W02 TIFF graph serializer. On JPEG input, W03 also writes exact
EXIF operations and explicit standard/Extended XMP, ICC, and IPTC blocks
through a marker-only transaction. On PNG input, W04 also writes eXIf, XMP
`iTXt`, ordinary text, and ICC `iCCP` blocks. JPEG entropy-coded scans,
decoding-critical markers, and trailing bytes are copied byte-for-byte. Both
writers return freshly allocated, reparsed output with input/output and
retained-payload SHA-256 evidence. Changed types, counts, lengths, ordering,
duplicate policy, and relocated TIFF offsets are handled by the dedicated
writers. PNG IDAT and APNG image payloads, and WebP VP8/VP8L/ALPH/ANMF image
payloads, remain byte-for-byte identical. Containers without a dedicated
writer remain typed unsupported results.

The result is discriminated by `successful` and `status`. It distinguishes
`unsupported`, `invalid-value`, `unsafe-structure`, `policy-failure`,
`verification-failure`, and `mixed-failure`; each operation has a typed failure
code and evidence. Human-readable diagnostic text and parser warnings are not
used to calculate unapplied operations. See
[`W01_MUTATION_MODEL.md`](./W01_MUTATION_MODEL.md) for the complete decision
record and invariants.

## PNG metadata writing

```ts
rewritePngMetadata(input: Uint8Array, options: PngRewriteOptions): Promise<PngRewriteResult>
```

The root package and `browser-image-metadata/png-writer` export the W04 raw
PNG block writer. `PngBlockEdit` adds, replaces, or removes complete eXIf TIFF,
UTF-8 XMP `iTXt`, `tEXt`/`zTXt`/`iTXt`, and complete ICC profiles. Text and ICC
compression is bounded and asynchronous through the runtime compression
stream. Chunk order, CRCs, duplicate policy, APNG relationships, unknown
ancillary chunks, dimensions, and every IDAT/fdAT payload are validated before
output is returned. The default duplicate policy is `preserve`; physical
`blockId`, `replace-target`, `deduplicate-equivalent`, and `reject` policies
are explicit. Invalid CRCs are rejected by default; the explicit
`preserve-unknown` CRC policy is forensic-only and preserves invalid unknown
ancillary bytes without claiming normalized output. See
[`W04_PNG_WRITING.md`](./W04_PNG_WRITING.md).
The default result also exposes the independent W08 `preservation` report;
`verify: false` returns `preservation: null`.

## JPEG metadata writing

```ts
rewriteJpegMetadata(input: Uint8Array, options: JpegRewriteOptions): JpegRewriteResult
```

The root package and `browser-image-metadata/jpeg-writer` export the W03 raw
block writer. `JpegBlockEdit` adds, replaces, or removes standard XMP,
Extended XMP, complete ICC profiles, and raw IPTC-IIM data. Oversized XMP and
ICC values are split into valid JPEG segments and reassembled during output
verification. Standard XMP and Extended XMP relationships must remain valid;
orphan, overlapping, incomplete, malformed, or invalid UTF-8 Extended XMP is
rejected. IPTC replacement preserves unrelated Photoshop resources in APP13.

The default duplicate policy is `preserve`; `replace-target`,
`deduplicate-equivalent`, and `reject` are explicit alternatives for standard
XMP/IPTC physical blocks. Extended XMP and ICC are treated as logical
sequences because their chunks are interdependent. `byteChanges` reports output marker ranges, and
`preservedPayloads` reports every entropy-coded scan copied for comparison.
The default result also exposes the independent W08 `preservation` report;
`preservation` options make color/orientation policy explicit and
`verify: false` returns `preservation: null`.
Default verification reparses the JPEG, checks frame dimensions and scan bytes,
checks Extended XMP references, and checks non-target markers. MPF secondary
images, Ultra HDR gain maps, JUMBF/C2PA/APP11 offset-bearing structures, DNL
height-deferred codestreams, malformed resources, and over-limit output fail
closed without exposing partial bytes. See
[`W03_JPEG_WRITING.md`](./W03_JPEG_WRITING.md) for the complete boundary and
operation model.

JPEG APP13 Photoshop resources are available through `result.photoshop` as a
bounded, source-ordered `8BIM` inventory. The root package exports
`parsePhotoshopResources()` and `inspectPhotoshopResourceSpans()` for direct
inspection; TIFF tag 34377 is inventoried using the same model. Each resource
retains its exact ID, Pascal name bytes and padding, payload range and padding,
parent block, duplicate position, bounded payload copy, and decoded resolution,
thumbnail, path, clipping-name, XMP, IPTC-link, or caption-digest facts where
the fixed structure is recognized. Unknown and malformed resources remain
explicit and do not count as complete inspection. The only Photoshop write
operation currently supported is exact removal of one or more selected JPEG
resources through the `photoshop-resource` selector; it preserves unrelated
resource bytes and refuses malformed or over-limit structures atomically.
There is no TIFF Photoshop-resource writer claim. See
[`B06_PHOTOSHOP_RESOURCES.md`](./B06_PHOTOSHOP_RESOURCES.md).

## WebP metadata writing

```ts
rewriteWebpMetadata(input: Uint8Array, options: WebpRewriteOptions): WebpRewriteResult
```

The root package and `browser-image-metadata/webp-writer` export the W05 raw
WebP writer. It selectively edits complete EXIF, XMP, and ICC chunks; the
`editMetadata()` adapter additionally sets and deletes normalized EXIF fields
through the W02 TIFF serializer. VP8/VP8L files are promoted to VP8X when
metadata is added. RIFF lengths, odd padding, VP8X metadata flags, dimensions,
alpha/animation relationships, duplicate policy, and unknown chunks are
validated. VP8, VP8L, ALPH, and ANMF image payload chunks are returned as exact
preservation evidence and must remain byte-identical. The default result also
exposes the independent W08 `preservation` report; `verify: false` returns
`preservation: null`. See
[`W05_WEBP_WRITING.md`](./W05_WEBP_WRITING.md).

## Preservation verification

```ts
verifyPreservation(before: MetadataInput, after: MetadataInput, options?: PreservationVerifierOptions): Promise<PreservationReport>
verifyPreservationSync(before: Uint8Array, after: Uint8Array, options?: PreservationVerifierOptions): PreservationReport
```

The root package and `browser-image-metadata/preservation` expose the W08
independent preservation verifier. It hashes every bounded JPEG scan, PNG
`IDAT`/`fdAT` range, and WebP `VP8 `, `VP8L`, `ALPH`, and `ANMF` range before
and after editing, while comparing dimensions and image/animation
relationships. Reports are JSON-safe and contain explicit matched,
mismatched, missing, and non-comparable counts, source offsets, lengths,
hashes, diagnostics, and configured color/orientation policy outcomes.
`pixelEquivalence` is always `not-claimed`; no decoder or pixel comparison is
performed. Unsupported container payload extraction is reported as incomplete.
The existing JPEG, PNG, and WebP writers run this verifier by default and
return their report in `result.preservation`; `verify: false` is an explicit
raw-writer opt-out.

See [`W08_PRESERVATION_VERIFIER.md`](./W08_PRESERVATION_VERIFIER.md).

## TIFF graph serialization

```ts
parseTiffGraph(input: Uint8Array, options?: TiffSerializeOptions): TiffGraph
serializeTiff(graph: TiffGraph, options?: TiffSerializeOptions): Uint8Array
rewriteTiff(input: Uint8Array, options: TiffRewriteOptions): Uint8Array
```

The `browser-image-metadata/tiff` entry point exposes these APIs as well. A
graph retains ordered directories and entries, raw unknown values, typed
directory references, and relocatable standard payloads including thumbnails.
Serialization supports classic TIFF in II/MM byte order and BigTIFF with
checked 64-bit fields. It rejects contradictory definitions, unsafe arithmetic,
truncated structures, unresolved references, over-limit counts/values, and
output larger than the configured bound before returning bytes. `rewriteTiff`
is immutable and performs a bounded fixed-point reparse by default.

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

W06 adds `serializeStructuredXmp()` (also exported as `serializeXmp`) for
deterministic RDF/XML serialization of the complete model. It preserves
namespace URI/local-name identity, lexical literals, arrays and ordering,
language alternatives, resources, blank nodes, typed resources, qualifiers,
duplicate properties, and unknown properties. XML text and attributes are
escaped and XML 1.0-invalid code points are rejected. `chunkExtendedXmp()`
returns bounded, deterministic Adobe Extended XMP payloads with a SHA-256
derived or caller-supplied GUID; the payloads can be checked with
`parseExtendedXmpChunk()` and `reassembleExtendedXmp()`.

`serializeIptcIim()` and `serializePhotoshopIptcResources()` are available from
the root package and `browser-image-metadata/iptc`. The former preserves input
dataset order, repetitions, and raw bytes, supports UTF-8/Latin-1/binary
values, and emits safe ordinary or extended IIM lengths. The latter emits
padded Photoshop 3.0 `8BIM` resource blocks and supports multiple IPTC
resources. Strict validation is the default; callers reserializing an
intentionally invalid raw value must request `invalidValuePolicy:
"preserve-raw"`.

`synchronizeIptcXmp()` maps only generated namespace/local-name and IIM
record/dataset pairs. Its default `preserve-all` policy reports conflicts and
does not overwrite either side. `prefer-iim` and `prefer-xmp` are explicit
projection policies, while `reject-conflict` throws before output is emitted.
The standards sources and focused evidence are documented in
[`W06_IPTC_SERIALIZATION.md`](./W06_IPTC_SERIALIZATION.md).

The explicit `browser-image-metadata/xmp/sidecar` entry point (also exported
from the root) provides `parseXmpSidecar()`, `mergeMetadataWithXmpSidecar()`,
`mergeXmpSources()`, and `serializeXmpSidecar()`. Sidecar bytes are
caller-supplied and are never fetched from a path or URL. Parsing returns a
stable SHA-256 source identity, a standalone XMP block range, packet
provenance, bounded RDF values, unknown properties, coverage, and typed
diagnostics. `preserve-all` is the default merge policy;
`embedded-first`, `sidecar-first`, and `reject-conflicts` are explicit. The
serializer returns new XMP bytes and reparses them for semantic equivalence by
default; it never changes source image bytes. See
[`B10_XMP_SIDECAR.md`](./B10_XMP_SIDECAR.md) and the retained
[`reports/sidecar-b10-evidence.md`](./reports/sidecar-b10-evidence.md).

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

`RedactOptions` also accepts typed selectors for canonical field IDs, metadata
families, sensitivities, namespace URI/local-name pairs, physical block IDs,
and associated images. Typed selectors are preflight-resolved against the
bounded parser and optional `RedactOptions.registry`; unmatched selectors
return the original bytes and an unsuccessful outcome before surgery starts.
Duplicate physical blocks are scoped independently. Preserve rules have
explicit preserve-over-remove precedence, and outcomes are computed from
resolved target identities and emitted records rather than warning text. See
[`W07_REDACTION_SELECTORS.md`](./W07_REDACTION_SELECTORS.md).

## Semantic privacy policies and C2PA

`PRIVACY_POLICY_PRESETS`, `getPrivacyPolicy()`, and `evaluatePrivacyPolicy()`
expose the immutable T02 policy definitions. `sanitizeMetadata(input, {
policy: "share-safe" })` performs policy inspection, exact-field preflight,
lossless mutation, and post-mutation inspection. Strict policies return no
output when coverage or exact targeting is insufficient. See
[`T01_PRIVACY_INSPECTION.md`](./T01_PRIVACY_INSPECTION.md) and
[`T02_PRIVACY_POLICIES.md`](./T02_PRIVACY_POLICIES.md).

`inventoryC2pa()` and `inventoryJumbfC2pa()` report bounded structural C2PA/JUMBF
inventory only. The result uses `detected`, `stores`, `relationships`, and
`mutationRisk` terminology and never represents cryptographic verification.
See [`T03_C2PA_INVENTORY.md`](./T03_C2PA_INVENTORY.md).

Official adapters are deliberately separate optional entry points:

```ts
import { verifyC2paInBrowser } from "browser-image-metadata/c2pa/browser";
import { verifyC2paInNode } from "browser-image-metadata/c2pa/node";
```

They delegate all cryptographic work to the pinned official SDK, retain its
complete result, and expose namespaced `official:*` or typed `adapter:*`
statuses. The browser entry requires a version-matched `wasmSrc`; the Node
entry loads the official native binding. See
[`T04_C2PA_ADAPTERS.md`](./T04_C2PA_ADAPTERS.md).

## Optional creator metadata and launch evidence

The optional `browser-image-metadata/creator` entry point exposes bounded
producer-convention inspection for ComfyUI, Stable Diffusion WebUI, InvokeAI,
and common XMP creator metadata. `inspectCreatorMetadata()` returns typed
model, sampler, seed, steps, prompt, negative-prompt, and workflow-reference
fields with producer parser versions, source ranges, block identities, and
diagnostics. Raw source data is retained only when the caller leaves the
explicit `includeRawData` option enabled. Graph nodes, edges, source bytes,
fields, and JSON nesting use the normal security-limit model.

`migrateCreatorMetadataToIptc()` is a data-only migration helper. It requires
`{ confirm: true }`, targets the generated IPTC Photo Metadata 2025.1 AI
properties, and never writes an image or silently discards unsupported creator
fields. See [`G01_CREATOR_METADATA.md`](./G01_CREATOR_METADATA.md).

The repository retains reproducible comparison, community-program, and launch
artifacts in `reports/g02-comparison.{json,md}`,
`reports/g03-community-evidence.{json,md}`, and
`reports/g04-launch-evidence.{json,md}`. Their commands fail on missing or
stale evidence; none of these reports contains third-party image bytes or raw
sensitive values. G04 records repository readiness for publication, not an
unsupported claim that external publication has occurred.

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
transforms, return primary-item `nclx` colour parameters when present, and
retain the complete bounded item graph in `result.heif`.
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
`MIGRATION.md` contains the conversion/loss matrix and
`R04_MIGRATION_COMPATIBILITY.md` contains pinned, executable incumbent
mappings. `queryMetadata()` supports
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
