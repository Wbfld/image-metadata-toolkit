# Migrating to browser-image-metadata

`browser-image-metadata` accepts in-memory browser-friendly bytes and returns a typed inspection result. It deliberately does not accept URL strings, local file paths, or image elements: obtaining an image remains the application's responsibility, which keeps metadata inspection local and avoids unexpected network or filesystem reads.

Use `result.fields` for normalized application-facing values and retain `result.exif`, `result.xmp`, `result.iptc`, and `result.icc` when source-level detail matters. `result.warnings` and `result.completeness` are part of normal control flow for untrusted images.

## From exifr

Where an application previously requested a small tag set, pass it through `select.tags`. For a JPEG preview from a browser `File`, add the explicit header scope.

```ts
import { parseMetadata } from "browser-image-metadata";

const result = await parseMetadata(file, {
  scope: "jpeg-header",
  select: { tags: ["Make", "Model", "Orientation", "GPSLatitude", "GPSLongitude"] },
});
const make = result.fields.find((field) => field.name === "Make")?.value;
```

Use `getMetadataSummary(result)` when an application needs camera, capture, location, exposure, or orientation values. It preserves source ambiguity in `summary.conflicts` instead of picking an arbitrary duplicate.

For exifr-style one-call helpers, use `readGps(file)`, `readOrientation(file)`,
`readRotation(file)`, `readThumbnail(file)`, or `readCaptureTime(file)`.

## From ExifReader

Replace a flat tag object with the normalized `fields` array or the typed summary. The raw EXIF directory stays available under `result.exif.fields`, where every entry has a stable identifier such as `IFD0:0x010f`.

```ts
import { getMetadataSummary, parseMetadata } from "browser-image-metadata";

const result = await parseMetadata(file, { select: { groups: ["EXIF", "Dimensions"] } });
const summary = getMetadataSummary(result);
console.log(summary.camera.make, summary.camera.model, result.dimensions);
```

The package treats parsing warnings as data rather than silently flattening values that disagree. If an interface needs the original family boundaries, read `result.exif`, `result.xmp`, `result.iptc`, or `result.icc` directly.

## From exif-js

Replace callback-based image mutation with an awaited call on the selected `File` or an `ArrayBuffer`. No metadata is attached to a DOM image object.

```ts
import { parseMetadata } from "browser-image-metadata";

const result = await parseMetadata(file, { select: { tags: ["Make", "Model"] } });
const model = result.fields.find((field) => field.name === "Model")?.value;
```

## Privacy workflows

Reading metadata does not remove it. Use `auditPrivacy()` before presenting a sharing choice, and use `sanitizeMetadata()` only after checking its strict outcome. For an application-specific choice, use `redactMetadata()` and inspect both `outcome.successful` and `outcome.unapplied`.

```ts
import { sanitizeMetadata } from "browser-image-metadata";

const sanitized = await sanitizeMetadata(file);
if (sanitized.successful && sanitized.data) upload(sanitized.data);
else showSanitizationProblem(sanitized.reasons);
```

The corresponding upstream APIs are documented by [exifr](https://github.com/MikeKovarik/exifr), [ExifReader](https://github.com/mattiasw/ExifReader), and [exif-js](https://github.com/exif-js/exif-js). The checked-in migration targets are exifr **7.1.3** and ExifReader **4.45.0** (the versions pinned in `devDependencies`); confirm feature-specific behavior against the version your application currently uses before migrating. Only their public documentation is used to describe the compatibility shape; no competitor code or tables are used.

## Structured XMP compatibility

Existing `StructuredXmpPacket.namespaces` and `.properties` consumers continue
to work as an alpha compatibility view. S05 adds `packet.rdf`, which is the
lossless model for duplicate properties, namespace URIs, ordered arrays,
language alternatives, nested resources, qualifiers, typed/lexical values,
aliases, and source offsets. Use `mergeStructuredXmp()` when combining packets;
the default `preserve-all` policy reports every candidate and conflict. Do not
use the legacy map for serialization or conflict resolution because it cannot
represent duplicate qualified properties. Sidecar records can be supplied as
provenance to the merge API, but the browser/core parser never reads sidecar
files implicitly.

## IPTC semantic view (S06)

The legacy `result.iptc.fields` and raw bytes remain compatible. New code may
use `result.iptcSemantic` or `readIptcSemantic()` for the IPTC Photo Metadata
2025.1 semantic model. It is additive and loss-preserving: use
`field.candidates` and `field.conflicts` rather than assuming a single value.
`selectionPolicy: "preserve-all"` is the default and intentionally applies no
IIM-versus-XMP precedence. `first` and `last` are explicit convenience policies
only. Candidate sources identify IIM record/dataset/occurrence or XMP
namespace/local name, packet and block provenance, offsets, raw/lexical value,
and validation. Unknown or invalid values remain inspectable with diagnostics.

## Output adapters (S09)

Use `toFlatObject(result)` for a deterministic convenience object. Its default
preserves duplicate names as source-ordered arrays; `{ collision: "first" }`
and `{ collision: "last" }` are deliberately lossy. `toExifrCompatible()` is
equivalent to the lossy last-value policy. `toExifReaderCompatible()` retains
IFD grouping and wraps fields in `{ value, description }`, but cannot preserve
all provenance in the incumbent shape. Neither migration adapter represents
RDF qualifiers, language alternatives, duplicate packets, IPTC structures,
exact binary provenance, or conflict diagnostics completely.

Use `toJsonSafe()` before JSON serialization when results include binary data,
BigInt-like values, non-finite numbers, or exact values. It uses tagged values
for those cases rather than silently rounding or expanding binary bytes.

`toJsonSafeResult(result)` is the explicit lossless-result view. It includes
the canonical EXIF/composite, RDF/XMP, IPTC semantic, ICC, image-details,
block, coverage, diagnostic, and telemetry families; `fromJsonSafe()` restores
tagged binary, BigInt, exact integer64, rational (including denominator-zero),
and non-finite values. Arrays and duplicate candidates retain source order.
The adapter has cumulative `maxAdapterItems` (8,192) and
`maxAdapterOutputBytes` (4 MiB) defaults, and emits a deterministic truncation
marker rather than allocating without a bound. Tighten them through the
`limits` or `maxItems` options.

`toLosslessFamilyGroups()` is the structured family view. The older
`toFamilyGroups()` remains source-compatible and groups legacy fields by IFD;
`queryMetadata()`, `queryImageDetails()`, `queryIptcSemantic()`, and
`queryIccTags()` query stable identities in source order with bounded output.
Queries match directory/block/offset, namespace URI plus local name, semantic
field IDs, ICC signatures, and zero-based occurrences. An invalid query returns
an empty result; no query silently selects a conflicting candidate.
All adapter functions are also available from the dependency-free opt-in
`browser-image-metadata/adapters` entry; the root exports remain for backwards
compatibility.

The compatibility matrix is intentionally explicit:

| Source model | Adapter | Directly representable | Loss or policy |
| --- | --- | --- | --- |
| Canonical fields | `toFlatObject` | names and values | duplicate names are ordered arrays by default; `first`/`last` are opt-in |
| Canonical fields | `toExifReaderCompatible` | IFD/name/value/description | directory provenance, raw values, conflicts, and structured families are not representable; duplicate `array` is the default, `first`/`last` are opt-in |
| Canonical fields | `toExifrCompatible` | common flat scalar reads | last-value collision policy by default; use `first` explicitly; no promise of drop-in parity |
| RDF/XMP | `toJsonSafeResult` | URI/local names, order, arrays, language, qualifiers, lexical values, packets | none in the tagged JSON-safe model; flat/migration views intentionally omit these families |
| IPTC semantic | `toJsonSafeResult` | candidates, IIM occurrence, XMP source, validation, conflicts | none in the tagged JSON-safe model; migration views do not claim IPTC parity |
| ICC and image details | `toJsonSafeResult` | decoded values, profile-relative ranges, candidates, relationships, conflicts | profile-relative offsets remain labeled; migration views do not flatten them |
| Binary/rational/64-bit | `toJsonSafe` | tagged reversible encodings | only an explicitly chosen lossy migration can round or stringify them |

No optional synchronous JPEG/TIFF parser is shipped: the evidence did not
justify a second parser or a separate security contract. Callers that need
synchronous behavior should use the existing in-memory parser through an
application-managed async boundary; the canonical parser remains the single
implementation.
