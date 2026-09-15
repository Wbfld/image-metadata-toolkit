# R04 migration and compatibility guide

This guide is the executable migration companion to [MIGRATION.md](./MIGRATION.md).
It covers exifr 7.1.3, ExifReader 4.45.0, exif-js 2.3.0, and piexifjs 1.0.6.
Their official documentation and licenses, the exact package versions, fixture
hashes, and generated side-by-side outputs are retained in
[`data/r04-compatibility-sources.json`](./data/r04-compatibility-sources.json)
and [`reports/r04-compatibility.md`](./reports/r04-compatibility.md). Competitor
libraries are independent output oracles only; their source code and metadata
tables are not used by this package.

## Input and import mappings

| Existing use | Copy/paste replacement | Important difference |
| --- | --- | --- |
| `exifr.parse(file, tags)` | `parseMetadata(bytes, { select: { tags } })` | Supply `Uint8Array`, `ArrayBuffer`, `Blob`, or `File`; paths, URLs, and DOM image elements are never accepted by the core parser. |
| `exifr.gps/orientation/rotation/thumbnail` | `readGps/readOrientation/readRotation/readThumbnail(bytes)` | Each result is typed and may be `null`; it never triggers a network or path read. |
| `ExifReader.load(file, { expanded: true })` | `parseMetadata(bytes)` plus `toExifReaderCompatible(result)` when an incumbent grouped display shape is necessary | The compatibility adapter is deliberately lossy and caller-selectable for duplicates. |
| `EXIF.getData(image, callback)` and `EXIF.getTag` | `await parseMetadata(bytes)` then find an exact normalized field | The replacement is promise-based and does not attach metadata to a DOM object. |
| `piexif.load/dump/insert/remove` | `await editMetadata(bytes, { operations })` | Writes use exact selectors, produce a new byte array, and are reparse/payload verified; broad EXIF-object replacement has no equivalent. |

## Field and metadata-family mapping

| Concern | Toolkit replacement | Compatibility/loss rule |
| --- | --- | --- |
| Common field access | `result.fields.find((field) => field.name === "Make")` or `indexMetadataFields(result).byId` | Prefer a canonical ID such as `IFD0:0x010f` when an exact source tag matters; names can occur more than once. |
| EXIF groups | `result.exif.fields` and `toExifReaderCompatible(result, { duplicate: "array" })` | The latter is for incumbent UI shape only; it does not retain complete source provenance. |
| Dates and timezones | `getCaptureTime(result)` or `readCaptureTime(bytes)` | Read `raw`/lexical source values where byte-faithful display matters; no timezone is inferred. |
| GPS | `readGps(bytes)` plus source fields for DMS/reference | Signed decimals are a semantic projection, not a replacement for DMS source values. |
| Rationals | normalized `field.value` plus exact `field.raw` | Do not round-trip a decimal when an exact numerator/denominator is required. |
| Duplicate and unknown tags | `result.fields`, `result.exif.fields`, `result.blocks`, and `result.warnings` | Preserve source order and unknown values; do not flatten into one object property unless an explicit adapter policy is chosen. |
| XMP | `result.xmp` / `readStructuredXmp()` / `toJsonSafeResult()` | Match namespace URI and local name, never a prefix alone; qualifiers, language alternatives, and repeats need the RDF model. |
| IPTC | `result.iptc`, `result.iptcSemantic`, and `readIptcSemantic()` | Keep IIM and XMP candidates/conflicts distinct rather than picking precedence implicitly. |
| ICC | `result.icc`, `queryIccTags()`, and `toJsonSafeResult()` | ICC signatures and profile-relative provenance remain separate from EXIF/XMP values. |
| Thumbnails | `readThumbnail(bytes)` or `getThumbnail(result)` | Returns copied bytes or `null`; callers own Blob/Object URL creation and revocation. |
| Errors and warnings | `result.completeness`, `result.coverage`, `result.warnings`, and typed mutation `status` | `undefined`, `null`, exceptions, and warnings from incumbent libraries are not interchangeable success states. |
| Privacy | `auditPrivacy(bytes)` then `sanitizeMetadata(bytes, { policy })` | Audit reports are safe by default; strict policy refusal returns no output bytes. |
| Writing | `editMetadata(bytes, { operations })` / explicit container writers | Only documented JPEG/PNG/WebP/TIFF operations are supported; unsupported containers and unsafe edits fail atomically. |

<!-- r04-snippet: exifr-common -->
```js
import { readFile } from "node:fs/promises";
import { parseMetadata, readCaptureTime, readGps, readOrientation, readRotation, readThumbnail } from "browser-image-metadata";

const path = process.argv[2];
if (!path) throw new Error("Pass an image path.");
const bytes = new Uint8Array(await readFile(path));
const result = await parseMetadata(bytes, { select: { tags: ["Make", "Model", "Orientation", "GPSLatitude", "GPSLongitude"] } });
const [gps, orientation, rotation, captureTime, thumbnail] = await Promise.all([readGps(bytes), readOrientation(bytes), readRotation(bytes), readCaptureTime(bytes), readThumbnail(bytes)]);
console.log(JSON.stringify({ fields: result.fields, gps, orientation, rotation, captureTime, thumbnailBytes: thumbnail?.byteLength ?? 0 }));
```

<!-- r04-snippet: exifreader-grouped -->
```js
import { readFile } from "node:fs/promises";
import { parseMetadata, toExifReaderCompatible } from "browser-image-metadata";

const path = process.argv[2];
if (!path) throw new Error("Pass an image path.");
const result = await parseMetadata(new Uint8Array(await readFile(path)));
const grouped = toExifReaderCompatible(result, { duplicate: "array" });
console.log(JSON.stringify({ grouped, dimensions: result.dimensions, completeness: result.completeness }));
```

<!-- r04-snippet: exif-js-callback -->
```js
import { readFile } from "node:fs/promises";
import { parseMetadata } from "browser-image-metadata";

const path = process.argv[2];
if (!path) throw new Error("Pass an image path.");
const result = await parseMetadata(new Uint8Array(await readFile(path)), { select: { tags: ["Make", "Model", "DateTimeOriginal", "Orientation"] } });
const get = (name) => result.fields.find((field) => field.name === name)?.value ?? null;
console.log(JSON.stringify({ make: get("Make"), model: get("Model"), dateTimeOriginal: get("DateTimeOriginal"), orientation: get("Orientation") }));
```

<!-- r04-snippet: piexifjs-write -->
```js
import { readFile } from "node:fs/promises";
import { editMetadata } from "browser-image-metadata";

const path = process.argv[2];
if (!path) throw new Error("Pass an image path.");
const result = await editMetadata(new Uint8Array(await readFile(path)), {
  operations: [{ op: "set", operationId: "set-software", target: { kind: "field", fieldId: "EXIF:IFD0:0x0131" }, value: "My application" }],
});
if (!result.successful || result.data === null) throw new Error(`Write refused: ${result.status}`);
console.log(JSON.stringify({ byteLength: result.data.byteLength, status: result.status, operations: result.operations }));
```

<!-- r04-snippet: metadata-families -->
```js
import { readFile } from "node:fs/promises";
import { parseMetadata, toJsonSafeResult } from "browser-image-metadata";

const path = process.argv[2];
if (!path) throw new Error("Pass an image path.");
const result = await parseMetadata(new Uint8Array(await readFile(path)));
console.log(JSON.stringify(toJsonSafeResult({ exif: result.exif, xmp: result.xmp, iptc: result.iptc, iptcSemantic: result.iptcSemantic, icc: result.icc, blocks: result.blocks, warnings: result.warnings })));
```

<!-- r04-snippet: privacy -->
```js
import { readFile } from "node:fs/promises";
import { auditPrivacy, sanitizeMetadata } from "browser-image-metadata";

const path = process.argv[2];
if (!path) throw new Error("Pass an image path.");
const bytes = new Uint8Array(await readFile(path));
const audit = await auditPrivacy(bytes);
const sanitized = await sanitizeMetadata(bytes, { policy: "share-safe" });
console.log(JSON.stringify({ audit, sanitationSucceeded: sanitized.successful, reasonCodes: sanitized.reasonCodes }));
```

## Semantic differences

| Area | Toolkit behavior | Incumbent compatibility consequence |
| --- | --- | --- |
| Dates and timezones | Normalized EXIF date values use `YYYY-MM-DD HH:mm:ss`; `getCaptureTime()` preserves an actual EXIF offset but never invents one from the runtime. Raw lexical values remain attached to source fields. | exifr may expose a `Date`/UTC conversion; ExifReader preserves an EXIF lexical string/array. Do not compare rendered local times as an equality test. |
| Rationals | Normalized fields provide a numeric value and source fields retain exact numerator/denominator pairs. | exifr commonly returns a decimal; ExifReader exposes a pair. A decimal cannot recover an arbitrary exact rational. |
| GPS | `readGps()` returns signed decimal coordinates while the EXIF source field retains DMS components and reference. | exifr exposes DMS components for ordinary parsing; other readers may flatten to signed decimals. |
| Duplicates and ordering | `fields`, RDF properties, IPTC candidates, blocks, and conflicts retain source order. `toFlatObject`, `toExifrCompatible`, and `toExifReaderCompatible` require an explicit collision/duplicate policy. | Flat object maps have one property per key and cannot faithfully represent duplicate field candidates, RDF qualifiers, or conflict provenance. |
| Raw and semantic values | Results retain raw, lexical, normalized, and semantic models with provenance. | Flat incumbent values are a convenience projection, not a round-trip model. |
| Warnings and errors | `warnings`, `coverage`, `completeness`, typed mutation status, and stable reason codes are normal control-flow data. | Missing, `undefined`, `null`, thrown errors, callbacks, and warning shapes differ by library. Never map them to a successful parse or write. |
| XMP, IPTC, and ICC | URI/local-name XMP, IPTC semantic candidates, and decoded ICC inventory remain separate families. | exifr/ExifReader output layouts are library-specific; exif-js and piexifjs do not provide a full equivalent model. See the generated report for fixture participation. |
| Thumbnails | `readThumbnail()` returns a defensive byte copy or `null`; `getThumbnail()` works on an existing result. | Object URLs and DOM attachment are caller lifecycle work; the parser never creates a URL. |
| Writing | Exact `editMetadata()` operations either succeed atomically with reparse/payload evidence or return a typed refusal. | exifr, ExifReader, and exif-js are not writer replacements. piexifjs broad-object writing is intentionally not mirrored because it can omit unrelated metadata. |

## Unsupported or intentionally non-equivalent mappings

No mapping is claimed for implicit URL/path/image-element loading, callback data
attachment, object-URL thumbnail creation, wholesale EXIF dictionary rewriting,
or treating a flat object as a lossless XMP/IPTC/ICC representation. The package
does not add those behaviors for migration convenience. Use the explicit
adapters only when their documented loss policy fits the application.

## Codemod decision

No codemod is shipped. The reasons and future acceptance requirements are in
[R04_CODEMOD_DECISION.md](./R04_CODEMOD_DECISION.md). This is a deliberate
compatibility decision, not an unimplemented feature.
