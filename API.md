# API reference

## `parseMetadata(input, options?)`

```ts
parseMetadata(input: MetadataInput, options?: ParseOptions): Promise<MetadataResult>
```

Parses an `ArrayBuffer`, `ArrayBufferView`, `Blob`, or browser `File` entirely
locally. It returns a stable result with `format`, `mimeType`, `dimensions`,
normalized `fields`, raw `exif`, `xmp`, `iptc`, `icc`, `jfif`, `pngText`, and
bounded `warnings`. `result.completeness` explicitly records whether the full
requested inspection completed without error warnings. `ParseOptions.signal`
supports cancellation at asynchronous boundaries.

Supported metadata readers are JPEG EXIF/JFIF/XMP/IPTC/ICC, PNG EXIF/text/XMP/
ICC, classic TIFF EXIF/XMP/IPTC/ICC, WebP EXIF/XMP/ICC, and bounded HEIF/AVIF
EXIF/XMP/primary dimensions/ICC/`nclx` inspection. HEIF and AVIF use bounded
`cdsc` item references to associate metadata items with the declared primary
image. Unknown EXIF tags remain in
`result.exif.fields`.

`ParseOptions.select` accepts metadata `groups` and EXIF `tags`. JPEG, PNG,
and WebP readers skip unrequested metadata decoding; `tags` accepts names such
as `Make` and stable IDs such as `IFD0:0x010f`. The default is a complete scan.
Set `scope: "jpeg-header"` for a latency-sensitive JPEG preview. With a `Blob`
or `File`, the reader uses `slice()` and stops immediately after the
start-of-scan header, leaving entropy-coded image data unread. The result has
`completeness.scope: "partial"` and records the intentional scope reason.
Set `scope: "metadata"` for PNG and WebP `Blob`/`File` inputs to scan chunk
headers while skipping image payload chunks. Only selected metadata chunks are
read, and `completeness.bytesRead` plus `completeness.inputBytes` report the
range-read evidence. TIFF, HEIF, and AVIF currently fall back to a full read
because their metadata offsets need a separate bounded random-access reader.

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
satisfied. `RedactOptions.signal` is checked before materialization and before
surgery begins; worker clients can terminate a running worker for immediate
interruption.
JPEG MPF multi-picture files and Ultra HDR gain-map XMP are detected before
surgery. They return an `UNSUPPORTED_STRUCTURE` warning and unchanged bytes
until secondary-image offsets can be rewritten safely.

## `sanitizeMetadata(input, options?)`

```ts
sanitizeMetadata(input: MetadataInput, options?: SanitizeOptions): Promise<SanitizationResult>
```

Performs a strict sharing-oriented redaction. It keeps ICC rendering information
and EXIF orientation by default, but returns `data: null` if the requested
policy cannot be proved complete.

## `getCapabilities(format)`

```ts
getCapabilities(format: ImageFormat): FormatCapabilities
```

Returns the metadata groups and lossless redaction targets supported for a
format. The returned arrays are copies and can be used directly to build UI.

## `getMetadataSummary(result)`

```ts
getMetadataSummary(result: MetadataResult): MetadataSummary
```

Builds a typed application summary from normalized fields while retaining the
complete raw result for advanced callers. It includes timezone-aware date
companions when explicitly stored, modern sensitivity values, lens
specification, owner/serial identifiers, and decoded UserComment text.

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

## `auditPrivacy(input)`

```ts
auditPrivacy(input: MetadataInput): Promise<PrivacyAuditResult>
```

Parses locally and reports recognized metadata classes, sensitive normalized
fields, opaque blocks, thumbnails, trailing bytes, parser warnings, and known inspection gaps. `safe` is conservative: it
is true only when parsing completed without error warnings, no recognized or
opaque metadata findings remain, and no inspection gaps are reported.

## Limits and warnings

`ParseOptions.limits` and `RedactOptions.limits` accept positive safe integer
overrides for input, metadata, segment, chunk, IFD, nesting, string, per-chunk
decompression, cumulative decoded metadata, and warning budgets. Every parser warning has a stable `code`,
`message`, and `severity` (`warning` or `error`), with offsets where available.
Oversized top-level input rejects with `MetadataError` code `LIMIT_EXCEEDED`.
PNG `iTXt` text is decoded as UTF-8. PNG selective EXIF redaction uses the same
bounded TIFF-directory validation as JPEG surgery and regenerates changed CRCs.
Unknown redaction targets are reported as warnings and do not change bytes.

## Focused entry points

`browser-image-metadata/detect` contains signature detection only.
`browser-image-metadata/jpeg` contains JPEG-only parsing, including the
header-only Blob path. `browser-image-metadata/redact` contains lossless JPEG,
PNG, and WebP redaction without importing metadata readers.
`browser-image-metadata/mini` provides a small JPEG-focused reader with the
same task-oriented summary helpers as the root entry point. Its
`parseMetadata` export is an alias for `parseJpegMetadata` and rejects
non-JPEG inputs with `UNSUPPORTED_FORMAT`.
`browser-image-metadata/xmp` provides bounded structured RDF XMP decoding.
It exports string and UTF-8 byte decoders plus `parseStructuredXmpWithDecoder`
and its byte variant for applications that supply an XML decoder. The adapter
receives the same UTF-8, DTD/entity, and output-property limits; supplied
decoders must not resolve external resources.
`browser-image-metadata/xmp/rgrove` is a separate optional-peer adapter around
`@rgrove/parse-xml`; it first validates a bounded packet with that parser and
then returns the same RDF-oriented result shape.

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
