# browser-image-metadata

**Image metadata you can inspect, edit, and prove.**

`browser-image-metadata` is a local-first TypeScript toolkit for applications
that need more than a flat object of tags. It parses and explains metadata,
finds privacy risks, applies policy-driven redaction, performs supported edits
atomically, and verifies that encoded image payloads were preserved.

The browser-safe core has no runtime dependencies and never fetches. It accepts
`ArrayBuffer`, any `ArrayBufferView` (including Node.js `Buffer`), `Blob`, and
browser `File` inputs. Focused entry points cover workers, seekable Node files,
explicit HTTP range reads, metadata editing, and optional official C2PA SDKs.

> **Support boundaries:** Metadata support is format- and operation-specific; detection does not promise complete metadata support. Results expose bounded completeness and coverage, and malformed, opaque, or unsupported structures remain explicit outcomes. Check the generated capability matrix before relying on a format or operation.

[Get started](#install) · [See why teams choose it](#why-browser-image-metadata) ·
[Compare metadata tools](./COMPARISON.md) · [Check exact capabilities](./CAPABILITIES.md) ·
[Migrate](./MIGRATION.md) · [Read the API](./API.md)

## Why browser-image-metadata

- **Ship privacy decisions, not just tag extraction.** Semantic findings cover
  locations, people, identifiers, timestamps, regions, prompts, embedded
  previews, unknown XMP, and opaque metadata. Reports hide sensitive values by
  default, and strict policies refuse to emit output when coverage is
  insufficient.
- **Edit without recompressing image data.** Supported JPEG, PNG, WebP, TIFF,
  and BigTIFF operations are preflighted, atomic, reparsed, and independently
  checked against encoded-payload hashes. Unsupported or protected structures
  produce typed refusal instead of a best-effort rewrite.
- **Keep the evidence needed to trust a result.** Stable field identities,
  exact family boundaries, duplicates, conflicts, source ranges, packet/block
  provenance, completeness, and warnings remain available alongside convenient
  summaries.
- **Control I/O and hostile-input risk.** Parsing, recursion, decompression,
  collections, ranges, and retained output are bounded. Blob/File, seekable
  Node, and explicit HTTP adapters can read metadata ranges without making
  network access an implicit parser behavior.
- **Adopt it without flattening your data model.** ESM, CommonJS, TypeScript,
  browser workers, focused imports, a Node CLI, and migration views for
  ExifReader and exifr are included. The canonical result remains loss-aware.

This is not a claim that one tool wins every job. ExifTool remains the stronger
choice for maximum format/tag breadth and mature desktop batch automation;
exifr is compelling for speed-first read-only extraction; ExifReader is a
capable general JavaScript reader. This package is designed for product code
that needs bounded local parsing, semantic privacy, exact mutation, and
machine-checkable preservation in one typed API. See the
[decision guide](./COMPARISON.md) for sourced, versioned detail.

> **Current scope:** JPEG, PNG, TIFF, BigTIFF, seven TIFF-derived camera RAW variants (DNG, CR2, NEF, ARW, ORF, RW2, and IIQ), Canon CR3, Fujifilm RAF, WebP, GIF, JPEG XL, HEIF, AVIF, and bounded SVG RDF/XML metadata inventory are implemented. SVG support validates UTF-8 and the SVG namespace, retains RDF/XML packets with byte provenance, rejects DTD/entity declarations, and leaves non-RDF `metadata` opaque; it does not render, decode pixels, or write SVG. TIFF-derived RAW variants retain `format: "tiff"` for compatibility, while CR3 and RAF retain distinct format/container identities; all RAW variants expose bounded preview/thumbnail/metadata/RAW range provenance and remain read-only without sensor-pixel decoding. JPEG, PNG, and WebP metadata removal is lossless within the documented capability matrix. The W02 reusable TIFF/EXIF graph serializer writes bounded classic TIFF in both byte orders and BigTIFF after the same verified layout path; standalone TIFF/BigTIFF EXIF field transactions are atomic and reparse-verified. W03 adds atomic JPEG marker metadata writing for EXIF, standard/Extended XMP, ICC, and IPTC while preserving entropy scans and decoding-critical markers byte-for-byte. W04 adds atomic PNG eXIf, XMP, text, and ICC chunk editing while preserving IDAT and APNG image payloads. W05 adds selective WebP EXIF field and XMP/ICC editing while preserving encoded WebP image chunks. W08 adds an independent public preservation verifier with hashable encoded-payload ranges and explicit non-pixel-equivalence evidence. HEIF, AVIF, CR3, RAF, and SVG rewriting are not exposed.

> **Detailed support boundaries:** Container detection is signature recognition, not a promise of full metadata support. Blob/File preview and metadata scopes are intentionally partial and report `completeness` and `coverage`; malformed, opaque, and unsupported structures remain visible through warnings and explicit outcomes. W01 `editMetadata()` validation, W02 standalone TIFF/BigTIFF EXIF writing, W03 JPEG marker writing, and W04 PNG chunk writing are transactional and reparse-verified; other container writers remain explicit unsupported results. MakerNote interpretation is available only through explicit bounded per-operation plugins; unknown and low-confidence notes remain opaque. HEIF/AVIF sequence tracks are inspected structurally without pixel decoding or writing—check [the generated capability matrix](./CAPABILITIES.md) before relying on a format or operation.

The stable 2.0 API contract is version 1.0.0. Read the [API decision record](./R01_API_DECISION.md), [deprecation policy](./DEPRECATION_POLICY.md), and [runtime support policy](./RUNTIME_SUPPORT.md) before publishing an integration. The checked [versioned JSON Schema](./schemas/r01-api-v1.schema.json) defines JSON-safe metadata, edit, redaction, sanitization, and sidecar result discriminants; API/export and declaration drift is rejected by the R01 gate.

The generated [documentation site](./docs-site/index.html) includes searchable EXIF, IPTC, XMP, ICC, policy, selector, capability, and format registries plus a local-only playground. Build it with `npm run docs:generate`, verify it with `npm run docs:check`, and serve it on loopback with `npm run docs:serve`. The separate fetch demo is the only network-enabled example. The isolated Node `image-metadata` CLI is documented in [R03_CLI.md](./R03_CLI.md) and is not imported by browser or core bundles.

The post-GA growth packet is also reproducible in-repository: `npm run creator:g01` inspects bounded ComfyUI, Stable Diffusion WebUI, InvokeAI, and common XMP creator metadata; `npm run g02:run` refreshes comparison evidence; `npm run community:scrub` provides the bounded fixture scrubber; and `npm run g04:run` executes the five launch workflows. See [G01_CREATOR_METADATA.md](./G01_CREATOR_METADATA.md), [G02_COMPARISON_REPORTS.md](./G02_COMPARISON_REPORTS.md), [G03_COMMUNITY_PROGRAM.md](./G03_COMMUNITY_PROGRAM.md), and [G04_LAUNCH_PLAN.md](./G04_LAUNCH_PLAN.md). Reports retain hashes and derived counters only. G04 is ready for operator publication but does not claim external publication.

## Post-GA growth evidence

G01’s creator-schema pack is optional and preserves producer-specific raw data
and provenance while exposing typed creator fields and explicit IPTC 2025.1
migration. G02 compares semantic contracts, transport, measured speed, memory
observations, malformed-input behavior, and ordinary-bundle closure with
versioned fixtures. G03 supplies fixture provenance and privacy scrubbing,
isolated community tickets, tag-data and plugin contracts, review, and response
targets. G04 provides the technical article, local playground and integration
packet plus executable launch demos for lossless metadata removal, 200 MiB
metadata-range reading, IPTC AI/accessibility inspection, protected-structure
refusal, and common compatibility views.

The retained reports are `reports/g01-creator-evidence.{json,md}`,
`reports/g02-comparison.{json,md}`, `reports/g03-community-evidence.{json,md}`,
and `reports/g04-launch-evidence.{json,md}`. External article/playground/
benchmark publication and independent community review remain operator actions;
the repository does not present them as already performed.

## Install

```sh
npm install browser-image-metadata
```

Both ESM and CommonJS builds, source maps, and TypeScript declarations are included.

## Parse metadata

```ts
import { getMetadataSummary, parseMetadata } from "browser-image-metadata";

const result = await parseMetadata(fileOrBytes);
const summary = getMetadataSummary(result);

console.log(result.format, result.mimeType, result.dimensions);
console.log(summary.camera, summary.location);
for (const field of result.fields) {
  console.log(field.name, field.raw, field.value, field.display);
}
for (const warning of result.warnings) {
  console.warn(warning.code, warning.message);
}
```

Every result also exposes `coverage`: `coverage.requested` describes the
operation that was requested, while `coverage.wholeFile` stays conservative for
privacy decisions when blocks are skipped, partial, malformed, opaque, or
unsupported. Use `coverage.reasons` and `coverage.unclassifiedBlockIds` for
machine-readable policy decisions; each `result.blocks` entry carries its own
normalized coverage state.

For common UI work, the root entry point also provides focused helpers. They
retain uncertainty instead of choosing between conflicting source values:

```ts
import { getCaptureTime, getGps, getOrientation, getRotation, getThumbnail } from "browser-image-metadata";

const gps = getGps(result);
const orientation = getOrientation(result);
const rotation = getRotation(result);
const captureTime = getCaptureTime(result);
const thumbnail = getThumbnail(result);
```

`getGps()` reports whether both coordinates are complete, `getRotation()` gives
browser-friendly CSS instructions, and `getThumbnail()` returns a defensive
copy of a bounded embedded EXIF thumbnail.

For the usual one-task case, pass the image input directly. These helpers apply
the smallest safe EXIF selection needed for their result:

```ts
import { readCaptureTime, readGps, readOrientation, readRotation, readTags } from "browser-image-metadata";

const gps = await readGps(file);
const orientation = await readOrientation(file);
const rotation = await readRotation(file);
const captureTime = await readCaptureTime(file);
const camera = await readTags(file, ["Make", "Model", "LensModel"]);
```

`readPreset(file, "essential" | "camera" | "location" | "privacy" | "all")`
offers a concise starting point for application views. Use
`indexMetadataFields(result)` when repeated field lookup is needed while
preserving duplicates under `allByName`.

Use `readStructuredXmp(file)` when an application needs a bounded, lossless
RDF/XMP view of retained packets. The result preserves namespace URIs,
qualified names, ordered duplicate properties, Bag/Seq/Alt arrays, language
alternatives, typed and lexical values, nested resources, qualifiers, aliases,
and embedded/Extended-XMP packet provenance. Packet candidates are never
silently merged; call `mergeStructuredXmp()` when an explicit conflict policy
is desired. The old `namespaces`/`properties` map remains available as a
documented compatibility view, while `.rdf` is the round-trip-ready model.
Malformed or unsafe XML stays visible through per-document diagnostics.

Advanced integrations can use `createByteSource(input)` for validated seekable
ranges over byte views or Blob/File inputs. Overlapping reads are coalesced,
repeated ranges are served from a bounded LRU cache, and `source.telemetry()`
exposes request, byte, cache-hit, and coalescing evidence. Parsing results from
metadata-scoped Blob reads include the same telemetry.

For galleries and import queues, `parseMetadataMany()` preserves input order
while limiting simultaneous local work:

```ts
const results = await parseMetadataMany(files, {
  concurrency: 4,
  select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Model", "Orientation"] },
});
```

The core parser never fetches. If an application needs an explicit browser
network adapter, import it separately; response bytes are streamed under the
same input limit before parsing:

```ts
import { fetchMetadata } from "browser-image-metadata/fetch";

const result = await fetchMetadata("/images/photo.jpg", { limits: { maxInputBytes: 20 * 1024 * 1024 } });
```

For true remote range reads, use the separate HTTP entry point. It probes a
single byte, validates `Content-Range`, total size, identity encoding, a
strong ETag or Last-Modified validator, and the final URL before the existing
bounded JPEG/TIFF/HEIF readers request metadata ranges:

```ts
import { fetchMetadata } from "browser-image-metadata/http";

const result = await fetchMetadata("https://images.example/photo.heic", {
  select: { groups: ["Dimensions", "EXIF", "XMP"] },
  allowedOrigins: ["https://images.example"],
  init: { credentials: "omit", redirect: "follow", mode: "cors" },
});
console.log(result.telemetry?.http);
```

The HTTP adapter never adds credentials or changes CORS, redirect, or cache
policy supplied through `init`. A server that ignores ranges, compresses a
range response, changes its validator, or omits a validator fails closed.
Set `allowFullResponseFallback: true` only when a bounded full response is
acceptable; `maxFullResponseBytes` can tighten that fallback independently.

For a fast JPEG preview, request only header metadata. `Blob` and `File`
inputs are read with `slice()` only through the start-of-scan header; the result
records its intentionally partial scope.

```ts
const preview = await parseMetadata(file, {
  scope: "jpeg-header",
  select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Model", "Orientation"] },
});
```

The same `select` groups and EXIF tag names apply to JPEG, PNG, WebP, classic
TIFF, HEIF, and AVIF readers. Unrequested decoded metadata is skipped; TIFF,
HEIF, and AVIF follow bounded directory or box structures while they inspect
metadata.

For JPEG, PNG, WebP, classic TIFF/BigTIFF, HEIF, and AVIF `Blob` or `File` inputs, use
`scope: "metadata"` to skip image payload ranges and read only selected
metadata. JPEG follows marker lengths and reads selected APP/SOF segments;
PNG/WebP traverse chunk headers; TIFF/BigTIFF follows bounded directory and
value offsets, including SubIFDs and chained directories. The
result records `completeness.bytesRead` and
`completeness.inputBytes`. HEIF and AVIF reconstruct bounded `meta` boxes and
read only selected metadata item extents; malformed or unsupported layouts
fall back to a full read so the legacy parser can report its diagnostics.

Pass an `AbortSignal` in `ParseOptions` to stop range reads, PNG
decompression, and bounded container traversal at safe checkpoints. Worker
clients can set `terminateOnAbort: true` when immediate interruption of a
synchronous parse is required.

JPEG XL `jxlc` and ordered `jxlp` codestream headers provide bounded image
dimensions. Container `Exif` and `xml ` boxes are decoded directly; Brotli
compressed `brob` boxes use the optional `jxlBrotliDecompressor` callback or a
runtime `DecompressionStream("brotli")`. Unsupported platform Brotli support
is reported explicitly, and raw codestreams never acquire inferred container
metadata. See [B01_JPEG_XL.md](B01_JPEG_XL.md) for the standards basis and
evidence.

The result always has this stable top-level shape:

```ts
{
  format,
  mimeType,
  dimensions,
  fields,  // normalized common fields
  composites, // typed EXIF interpretations with provenance and conflicts
  exif,    // every safely decoded EXIF entry, including unknown tags
  xmp,
  iptc,
  icc,
  jfif,
  pngText,
  blocks,
  completeness,
  warnings
}
```

Every normalized field includes:

```ts
{
  id,
  ifd,
  tag,
  name,
  raw,
  value,
  display,
  description,
  type,
  sensitivity
}
```

`raw` preserves the decoded source value. TIFF `RATIONAL` and `SRATIONAL` values remain exact `{ numerator, denominator }` pairs rather than being silently rounded. `value` carries validated or interpreted semantics, while `display` is a human-readable explanation. PNG `tEXt`, `zTXt`, and `iTXt` entries are available in `pngText`; XMP `iTXt` packets are also exposed through `xmp`.

## EXIF interpretations and composites

When EXIF is present, `result.composites` contains typed `captureTime`, `gpsTime`,
`fieldOfView`, `exposureValue`, `equivalence35mm`, `orientation`, and
`primaryDisplayDimensions` values. Each composite records every source field ID,
candidate, derivation, uncertainty, conflict, and diagnostic; raw EXIF fields are
never replaced. `getExifComposites(result)` and `readExifComposites(input)` expose
the same model directly.

Normalization is lenient by default for compatibility: a usable candidate can be
returned with `partial` or `ambiguous` uncertainty while invalid inputs remain
raw and warnings are emitted. Pass `{ normalization: "strict" }` to withhold a
composite whenever a required input is invalid or conflicting; strict diagnostics
are errors and therefore make `result.completeness.complete` false. No timezone is
inferred for offset-free EXIF capture times, and field-of-view derivation requires
focal length, focal-plane resolutions, a legal resolution unit, and primary pixel
dimensions.

## Remove private metadata without recompressing pixels

```ts
import { redactMetadata } from "browser-image-metadata";

const cleaned = await redactMetadata(fileOrBytes, {
  remove: ["GPS", "SerialNumber", "DateTimeOriginal"],
  preserve: ["ICC"],
});

await saveBytes(cleaned.data);
console.log(cleaned.removed, cleaned.warnings);
console.log(cleaned.outcome.successful, cleaned.outcome.unapplied);
```

Whole-segment targets are `EXIF`, `XMP`, `IPTC`, `ICC`, `JFIF`, and `AllMetadata`. PNG additionally supports `PNGText` for non-XMP `tEXt`, `zTXt`, and `iTXt` chunks. Selective EXIF targets include every normalized field, `GPS`, and `SerialNumber`. A `preserve` selection wins over a conflicting `remove` selection.

W07 adds typed redaction selectors while retaining these string targets as a
compatibility adapter. Selectors can address canonical field IDs, metadata
families, sensitivities, namespace URI/local-name pairs, physical block IDs,
and associated-image IDs. They are resolved against the bounded parser and
optional caller-supplied registry before mutation; unmatched selectors fail
atomically. Duplicate physical blocks remain independently selectable, and
outcomes use typed identity and emitted records rather than warning text. See
[`W07_REDACTION_SELECTORS.md`](./W07_REDACTION_SELECTORS.md).

`AllMetadata` means every metadata class the library can positively identify plus JPEG comments and PNG text chunks. Unknown APP markers are retained because some—such as Adobe APP14—can affect decoding. Removing `IPTC` removes the containing Photoshop APP13 resource block segment.

Photoshop APP13 `8BIM` resources and TIFF tag 34377 resources are exposed as a
bounded `result.photoshop` inventory with source ranges, exact name/payload
padding, duplicates, unknown resources, and fixed-structure resolution,
thumbnail, path, clipping-name, XMP, IPTC-link, and digest summaries. Exact
JPEG resource removal uses the typed `photoshop-resource` selector and cannot
widen to a whole APP13 block. Malformed or over-limit resources remain visible
as incomplete/opaque evidence; TIFF resource mutation is intentionally not
claimed. See [`B06_PHOTOSHOP_RESOURCES.md`](./B06_PHOTOSHOP_RESOURCES.md).

T05 exposes bounded `result.mpf` and `result.ultraHdr` inventories plus an
explicit-policy metadata-only writer for CIPA MPF APP2 structures and Android
Ultra HDR gain-map XMP. MP Index and Attribute IFDs, stored/resolved image
ranges, image attributes, dependencies, representative flags, ordered
GContainer items, exact namespaces, lexical gain-map values, secondary JPEG
dimensions, metadata-family presence, and nested provenance are retained.
Writers still refuse these offset-bearing structures by default;
`mpf: { mode: "preserve", ultraHdr: "preserve" }` opts into safe offset/size
recalculation and encoded-payload verification. See
[`T05_MPF_ULTRA_HDR.md`](./T05_MPF_ULTRA_HDR.md).

JPEG redaction rewrites marker segments only. Selective EXIF redaction removes directory entries, zeroes their detached value bytes, and scrubs orphaned EXIF payload bytes during broad removal; whole EXIF removal drops the APP1 segment. PNG uses the same validated selective EXIF surgery and regenerates its changed chunk CRC. WebP surgery updates RIFF length and VP8X metadata flags while copying image payloads unchanged. JPEG entropy-coded scan bytes and PNG IDAT payloads are never decoded or recompressed. Every redaction includes an explicit `outcome`; if a structure required for surgery is unsafe, the operation is atomic and reports an unsuccessful outcome. JPEGs containing MPF secondary images or Ultra HDR gain-map XMP remain refused atomically by default; the typed T05 preserve policy opts into safe offset/size recalculation and encoded-payload verification.

For strict sharing workflows, use `sanitizeMetadata()`. It retains orientation and ICC data by default, removes recognized descriptive metadata, and returns `data: null` unless the policy is completely satisfied.

```ts
import { sanitizeMetadata } from "browser-image-metadata";

const sanitized = await sanitizeMetadata(file);
if (sanitized.successful && sanitized.data) await saveBytes(sanitized.data);
else console.warn(sanitized.reasons);
```

## Trust-first edit model

`editMetadata(input, options)` validates stable operation IDs, canonical fields
and explicit selectors for set, delete, copy, rename/alias, group and policy
removal, and caller-supplied sidecar merges. On standalone TIFF/BigTIFF input,
W02 executes exact EXIF field set/delete/copy/alias/rename operations through a
fresh directory graph, recalculates offsets, reparses the output, and returns
hash and payload evidence. Preserve rules win over removal rules; unknown
metadata, source order, duplicates, and conflicts are preserved by default.
The result reports typed operation evidence and distinguishes invalid values,
unsafe structures, policy failures, verification failures, and unsupported
operations without parsing warning messages. JPEG uses the W03 marker writer
for exact EXIF operations and explicit standard/Extended XMP, ICC, and IPTC
blocks; scans and decoding-critical markers are preserved byte-for-byte. PNG
block edits preserve IDAT and APNG image payloads byte-for-byte. See
[`W01_MUTATION_MODEL.md`](./W01_MUTATION_MODEL.md),
[`W02_TIFF_SERIALIZATION.md`](./W02_TIFF_SERIALIZATION.md), and
[`W03_JPEG_WRITING.md`](./W03_JPEG_WRITING.md), and
[`W04_PNG_WRITING.md`](./W04_PNG_WRITING.md).
WebP metadata transactions are documented in [`W05_WEBP_WRITING.md`](./W05_WEBP_WRITING.md).
Standards-aware RDF/XML and IPTC-IIM serialization, explicit IIM/XMP conflict
policies, and Extended XMP chunking are documented in
[`W06_IPTC_SERIALIZATION.md`](./W06_IPTC_SERIALIZATION.md). The root package,
`browser-image-metadata/xmp`, and `browser-image-metadata/iptc` expose those
serializers without reading sidecar files or publishing third-party images.
The independent encoded-payload verifier is documented in
[`W08_PRESERVATION_VERIFIER.md`](./W08_PRESERVATION_VERIFIER.md) and is also
available from `browser-image-metadata/preservation`.

For direct graph work, `parseTiffGraph()`, `serializeTiff()`, and
`rewriteTiff()` are exported from the root package and
`browser-image-metadata/tiff`. The graph retains raw values, unknown entries,
directory relationships, and relocatable standard image/thumbnail payloads;
the writer never decodes or recompresses pixels.

## Normalized EXIF fields

- `Make`, `Model`, `Orientation`
- `DateTime`, `DateTimeOriginal`
- `ExposureTime`, `FNumber`, `ISOSpeedRatings`, `Flash`, `FocalLength`
- `GPSLatitude`, `GPSLongitude`, `GPSAltitude`
- `Copyright`, `Artist`, `Software`

GPS degrees/minutes/seconds and hemisphere references are validated together. Altitude sign follows `GPSAltitudeRef`. Flash is decoded as a bitmask. EXIF APEX shutter speed, aperture, brightness, and exposure-bias entries retain the exact encoded rational and include their computed interpretation. Invalid ASCII, dates, ranges, references, offsets, and zero denominators produce warnings rather than guessed values.

Unknown EXIF tags are retained in `result.exif.fields` with their numeric tag, TIFF type, count, exact raw value, and a generated name.

`result.exif.topology` is the complete bounded TIFF directory graph. It retains
stable directory identities, source offsets, parent/pointer/next relationships,
shared offsets, cycles, and associated-image roles for primary, thumbnail, and
preview directories. The legacy `result.exif.ifds` summaries remain available;
fields additionally carry `directoryId` and `source.directoryId`, so duplicate
tags from distinct SubIFDs remain distinguishable. Directory-level block
provenance exposes the same relationships. Strip and tile offsets are treated
as encoded pixel payloads and are never followed as metadata directories.
`result.exif.associatedImages` provides bounded thumbnail/preview offset and
length references without decoding their image payloads.

Photoshop APP13 IPTC-IIM datasets are exposed as `result.iptc.fields` and in `result.fields` with stable `IPTC:record:dataset` identifiers. Repeated datasets such as `Keywords` are preserved as separate entries. The declared IPTC coded character set is honored for UTF-8 (`ESC % G`); each field retains exact raw bytes, and unsupported encodings remain raw with warnings. Urgency, dates, times, and country codes are validated.

S06 adds `result.iptcSemantic`, `getIptcSemantic(result)`, and
`readIptcSemantic(input)`. This additive view is generated from the official
IPTC Photo Metadata Standard 2025.1 TechReference and covers IPTC Core and
Extension, Dublin Core, Photoshop, PLUS, and XMP Rights. It maps by namespace
URI and local name, retaining ordered arrays, language alternatives, nested
resources, qualifiers, lexical values, unknown values, all duplicate/conflicting
IIM and XMP candidates, packet/block/offset provenance, and validation state.
The default `preserve-all` policy does not choose IIM over XMP; callers can
request an explicit `first` or `last` convenience value while candidates remain
authoritative. Privacy auditing classifies populated semantic fields
conservatively and continues to report `RAW_XMP` for retained packets.
The official 2025.1 and 2023.1 reference-image URLs, editions, retrieval dates,
licenses, SHA-256 values, expected property identities, and normalized semantic
evidence hashes are recorded in `data/iptc/reference-images.json`. Use
`IPTC_REFERENCE_CORPUS_DIR=/path/to/images npm run iptc:reference` after
downloading both official images outside the repository. The command fails for
a missing directory, either missing image, a hash mismatch, or a partial run;
it writes redistribution-safe JSON and Markdown conformance reports (no image
bytes) to `reports/`, or to `IPTC_REFERENCE_REPORT_DIR` when set.

Complete JPEG APP2, PNG iCCP, WebP ICCP, TIFF/BigTIFF, and HEIF/AVIF ICC profiles expose bounded header fields through `result.icc.fields` and typed common payloads through `result.icc.decodedTags` (text, MLUC, XYZ, curves, matrices, measurements, colorants, signatures, and LUT structure). Unknown payloads remain bounded profile-relative ranges; no color transform is applied.

The S07 ICC interoperability gate is `ICC_REFERENCE_CORPUS_DIR=/path/to/hash-pinned-profiles ICC_REFERENCE_CORPUS_OUTPUT_DIR=reports npm run icc:reference`. It requires the complete corpus listed in `data/icc/reference-corpus.json`, runs the standards-based decoder before pinned ExifTool 13.59 output, compares header and decoded ICC semantics where both tools expose them, records explicit non-comparable curve/array values, and fails on missing, partial, or mismatching evidence. The checked redistribution-safe evidence is in `reports/icc-reference-report.json` and `reports/icc-reference-report.md`; profile files are never written to the repository.

The `/http` entry point is the only network-capable metadata API. It keeps
network policy explicit, validates byte-range responses and resource
validators, uses bounded fallback only when requested, and attaches transport
evidence under `result.telemetry.http`. The core entry point and all other
browser exports remain local-only.

## Format status

The [generated capability matrix](./CAPABILITIES.md) is the source of truth for
format support, selective decode, Blob/File scopes, lossless removal, strict
sanitization, and positive/malformed/selection evidence. Detection means
signature or container-brand recognition only; it is never presented as full
metadata support. BigTIFF, HEIF, and AVIF inspection remains bounded and
conservative, with unsafe or conflicting structures reported instead of
guessed. See [`tests/fixtures/README.md`](./tests/fixtures/README.md) for
fixture provenance.

The EXIF/TIFF vocabulary is generated from an auditable, provenance-aware
[metadata registry](./METADATA_REGISTRY.md). Applications can pass immutable
custom registries per parse without changing global behavior.

## Runtime examples

### Browser or Web Worker

```ts
import { parseMetadata } from "browser-image-metadata";

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (file) console.log(await parseMetadata(file));
});
```

The runnable browser examples are in [`examples/browser`](./examples/browser), including [`worker.html`](./examples/browser/worker.html) for off-main-thread parsing. The local [playground](./examples/playground) presents summary, raw values, warnings, and strict-sanitization outcomes side by side. They parse the selected local `File`; they do not upload it. The generated [documentation playground](./docs-site/playground.html) additionally exposes bounded blocks, coverage, privacy, planned edits, byte changes, and W08 verification. The checked Node worker transferable-buffer smoke test is `node examples/worker-smoke.mjs`.

Framework integration snippets for Vite, React, Next.js client components, and Deno are in [`examples/integrations`](./examples/integrations). They import the package's ESM entry point and keep file bytes in the browser or runtime where the application already received them.

### Node.js

Node.js 22 or newer is supported. CI covers the maintained Node.js 22 and 24 LTS lines plus the current Node.js 26 line.

```ts
import { readFile } from "node:fs/promises";
import { parseMetadata } from "browser-image-metadata";

const bytes = await readFile("photo.jpg");
console.log(await parseMetadata(bytes));
```

The Node-only entry point accepts a path, an `fs/promises` `FileHandle`, or a
seekable source with `size` and an asynchronous half-open `read(start, end)`
method. Use `scope: "metadata"` to let the existing bounded container planners
read only metadata ranges from a seekable file. Paths and file handles opened
by the adapter are closed on success, parse failure, and abort; supplied
seekable sources and handles are also closed by default. Set
`closeSource: false` only when the caller owns that source's lifecycle.

```ts
import { parseMetadata } from "browser-image-metadata/node";

const result = await parseMetadata("photo.heic", {
  scope: "metadata",
  select: { groups: ["Dimensions", "EXIF", "XMP"] },
});
```

Non-seekable Node streams and async iterables are accepted as binary inputs,
but are spooled completely into memory under `limits.maxInputBytes` before
parsing. They cannot provide true range efficiency; use a path, `FileHandle`,
or seekable source when avoiding intervening image payload bytes matters.
`maxStreamChunks` bounds the number of accepted stream chunks.

CommonJS is also supported:

```js
const { parseMetadata } = require("browser-image-metadata");
const { parseMetadata: parseNodeMetadata } = require("browser-image-metadata/node");
```

Run the checked Node example with:

```sh
npm run build
node examples/node.mjs photo.jpg
```

### Deno

After publication, Deno can consume the dependency-free ESM build through its npm compatibility layer:

```ts
import { parseMetadata } from "npm:browser-image-metadata@2.0.0-alpha.3";
const result = await parseMetadata(await Deno.readFile("photo.jpg"));
```

## Capabilities and privacy audit

Use `getCapabilities(format)` to discover which metadata groups, read scopes,
and lossless redaction targets are supported before rendering controls.
`getMetadataSummary`
provides typed camera, lens, exposure, capture, location, and orientation values
without replacing the raw result; conflicts are surfaced instead of silently
chosen. `auditPrivacy(input)` parses locally and reports recognized sensitive
fields, metadata classes, opaque JPEG APP blocks, thumbnails, trailing bytes,
warnings, and inspection gaps; it never modifies the input.

```ts
import { auditPrivacy, getCapabilities, getMetadataSummary, parseMetadata } from "browser-image-metadata";

const result = await parseMetadata(file);
const summary = getMetadataSummary(result);
const audit = await auditPrivacy(file);
if (!audit.safe) console.warn(audit.findings, audit.gaps);
console.log(audit.coverage, audit.reasonCodes);
console.log(getCapabilities(result.format).redaction);
```

Each privacy finding has a stable `state` (`presence`, `decoded-finding`,
`opaque-risk`, or policy-linked `policy-violation`) and semantic `category`.
Reports omit sensitive raw values by default; pass `{ includeRawValues: true }`
only when a deliberate diagnostic workflow requires them. The named immutable
policy presets and their strict preflight behavior are documented in
[`T02_PRIVACY_POLICIES.md`](./T02_PRIVACY_POLICIES.md).

## C2PA inventory and optional verification

`inventoryC2pa(input)` and `inventoryJumbfC2pa(input)` provide bounded
presence/range/relationship inventory only. They do not verify signatures,
certificates, trust, authenticity, or cryptographic bindings. Writers refuse
C2PA-bearing or other protected offset-bearing input by default; callers must
choose an explicit supported mutation policy. See
[`T03_C2PA_INVENTORY.md`](./T03_C2PA_INVENTORY.md).

Official verification is an optional integration and is not part of the core
bundle:

```ts
import { verifyC2paInBrowser } from "browser-image-metadata/c2pa/browser";
import { verifyC2paInNode } from "browser-image-metadata/c2pa/node";
```

The browser adapter requires a version-matched official WASM source. The Node
adapter uses the official native SDK. Both retain the complete official result
and expose namespaced typed statuses. Install the optional peers and run
`npm run test:c2pa` for the real pinned integration gate. Deployment details
and provenance are in [`T04_C2PA_ADAPTERS.md`](./T04_C2PA_ADAPTERS.md).

## Focused imports and workers

Use `browser-image-metadata/detect` when only container detection is needed.
Use `browser-image-metadata/jpeg` for a JPEG-only reader with header and
metadata-only Blob scopes, and
`browser-image-metadata/mini` for a small JPEG reader plus GPS, orientation,
rotation, capture-time, thumbnail, and summary helpers. Use
`browser-image-metadata/redact` for lossless JPEG/PNG/WebP redaction without
the general metadata-reader entry point.
`browser-image-metadata/xmp` provides the opt-in bounded structured XMP decoder;
it preserves raw packets in the main parser and rejects DTDs and entity
declarations. Applications that install the optional `@rgrove/parse-xml` peer
can import `browser-image-metadata/xmp/rgrove` for standards-focused XML
validation before the same bounded RDF mapping. `browser-image-metadata/worker` exports
`createMetadataWorkerClient()` and `installMetadataWorker()` for module-worker
integration with request IDs, transferable buffers, bounded queues, and cleanup.
`browser-image-metadata/adapters` provides the dependency-free output/query
helpers without requiring callers to import the parser entry point, while the
root exports remain compatible.

## Security limits

All offsets and lengths are checked before reads or slices. PNG IDAT image data is never decompressed. zTXt and compressed iTXt text, plus JPEG XL Brotli metadata, are decompressed only through bounded streams or explicitly injected bounded decoders; per-chunk and cumulative decoded-metadata limits are enforced. The library never makes a network request.

| Limit | Default |
| --- | ---: |
| Input bytes | 256 MiB |
| Total metadata bytes | 16 MiB |
| Single JPEG segment | 16 MiB |
| JPEG segments | 4,096 |
| HEIF/AVIF scanned boxes | 4,096 |
| HEIF/AVIF item entries | 4,096 |
| Total IFD entries | 4,096 |
| IFD nesting depth | 8 |
| Single EXIF value | 8 MiB |
| Decoded string | 1 MiB |
| Warnings | 256 |
| PNG chunks | 4,096 |
| PNG decompressed text | 8 MiB |
| Cumulative decoded metadata | 16 MiB |
| ICC decoded tag payloads | 1,024 |
| ICC localized strings/curve elements | 16,384 |
| ICC retained decoded output | 4 MiB |
| Image-detail candidates | 4,096 |
| Image-detail animation frames | 4,096 |
| Image-detail relationships | 4,096 |
| Adapter output items | 8,192 |
| Adapter output bytes | 4 MiB |

Callers can tighten any limit. `maxDecompressedBytes` limits one compressed chunk, while `maxDecompressedMetadataBytes` limits decoded output across PNG text and compressed ICC chunks. `maxAdapterItems` and `maxAdapterOutputBytes` bound deterministic queries and JSON-safe/adaptor retention; truncation is represented explicitly. Image details are header-only: pixel, strip, tile, IDAT, entropy-coded, and item payload bytes are not fetched or decoded solely to populate `result.details`:

```ts
const result = await parseMetadata(bytes, {
  limits: { maxInputBytes: 20 * 1024 * 1024, maxIfdEntries: 512, maxDecompressedMetadataBytes: 2 * 1024 * 1024 },
});
```

Oversized top-level input throws `MetadataError` with code `LIMIT_EXCEEDED`; for `Blob` and `File` inputs, the declared size is checked before `arrayBuffer()` reads and materializes the bytes. Malformed nested data is isolated and reported in `warnings`. Limit overrides must be positive safe integers.

## Development

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm run publint
npm run examples
npm run test:fuzz
npm run test:browser
npm run test:deno
npm run capabilities:check
npm run benchmark
npm run check
```

`npm run check` runs type-checking, linting, the complete coverage suite, both package builds, package-manifest validation, an install-from-tarball ESM/CommonJS smoke test, and ESM/CommonJS/Blob/typed-array/worker example smoke tests. CI runs it on Node.js 22, 24, and 26. Separate CI jobs run Chromium, Firefox, WebKit, Deno, and the scheduled malformed-input property suite. `npm run benchmark` produces local reproducible latency and bundle-size evidence; it does not make a portability claim.

The [capability matrix](./CAPABILITIES.md), [migration guide](./MIGRATION.md), and [version-pinned R04 compatibility guide](./R04_MIGRATION_COMPATIBILITY.md) describe supported operations and common adoption paths. See [CONTRIBUTING.md](./CONTRIBUTING.md) for development and fixture-submission guidance, [EXTERNAL_CORPORA.md](./EXTERNAL_CORPORA.md) for the pinned external interoperability corpora and differential gates, and [PUBLISHING.md](./PUBLISHING.md) plus the [release checklist](./RELEASE_CHECKLIST.md) to configure npm trusted publishing and cut a release.

## Known limitations

- JPEG, PNG, classic TIFF, BigTIFF, DNG, CR2, NEF, ARW, ORF, RW2, IIQ, CR3, RAF, WebP, GIF, JPEG XL, HEIF, AVIF, and SVG metadata are parsed in this release. SVG only inventories bounded RDF/XML in namespace-validated `metadata` elements and records all other metadata as opaque; SVG rendering and writing are unsupported. TIFF-derived RAW variants expose bounded directory-referenced RAW, preview, thumbnail, and opaque vendor ranges through `result.raw`; CR3 and RAF expose separate read-only container inventories through `result.cr3` and `result.raf`. Sensor pixels and MakerNote payloads are not decoded by the core; MakerNote interpretation is available only through explicitly supplied bounded plugins described in [B07_MAKERNOTE_PLUGIN_CONTRACT.md](./B07_MAKERNOTE_PLUGIN_CONTRACT.md), and RAW writing remains unsupported. JPEG XL includes codestream/container dimensions and container Exif/XML (including bounded injected Brotli metadata); raw codestream metadata remains non-addressable. ICC common payloads and image/container details are additive, bounded inspections; JPEG, PNG, plus WebP metadata chunks can be redacted.
- XMP remains available as its original UTF-8 packet by default. The optional `browser-image-metadata/xmp` entry point decodes bounded RDF properties with no DTD or entity support, or applies an application's supplied decoder behind the same packet and output bounds. ICC inspection decodes common bounded payload types and exposes unknown payloads as ranges; it never applies color transforms.
- The B07 MakerNote contract is available only through explicitly supplied per-operation plugins. It preserves unknown, low-confidence, encrypted, obfuscated, malformed, and unsupported note regions as opaque fail-closed results and does not include vendor packs in the dependency-free core. JPEG extended XMP is reassembled when referenced by a standard XMP packet. HEIF/AVIF inspection exposes a bounded `result.heif` item graph and `result.heifSequences`; no pixels are decoded and HEIF/AVIF writing remains unsupported.
- EXIF date strings do not imply a timezone unless a separate offset tag exists. `getMetadataSummary()` combines valid offset/subsecond companions while retaining that uncertainty when no offset is stored.
- Redaction removes metadata; W02 adds standalone TIFF/BigTIFF EXIF graph
  writing and exact-field transactions, W03 adds transactional JPEG marker
  metadata writing, W04 adds PNG metadata editing, and W05 adds WebP metadata
  editing. HEIF and AVIF editing, sidecar I/O, and pixel-orientation
  transforms remain outside this release's writer surface.
- Height-deferred JPEG codestreams whose SOF height is supplied later by DNL are not supported in this first pass.

## License

MIT
