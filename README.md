# browser-image-metadata

Parse, explain, validate, and privacy-redact image metadata locally in browsers, Web Workers, Node.js, and serverless runtimes—without network access or pixel recompression.

The package has no runtime dependencies. It accepts `ArrayBuffer`, any `ArrayBufferView` (including Node.js `Buffer`), `Blob`, and browser `File` inputs.

> **Current scope:** JPEG, PNG, TIFF, BigTIFF, WebP, GIF, JPEG XL, HEIF, AVIF, IPTC-IIM, and bounded ICC header and tag-directory inspection are implemented. JPEG, PNG, and WebP metadata removal is lossless within the documented capability matrix. HEIF/AVIF safely inspect direct EXIF/XMP boxes, standard `iinf`/`iloc` metadata items stored in-file or in their own `idat`, `cdsc` primary-image associations, and primary-item `colr` ICC or `nclx` colour data. Arbitrary metadata writing and HEIF/AVIF rewriting are not exposed.

> **Support boundaries:** Container detection is signature recognition, not a promise of full metadata support. Blob/File preview and metadata scopes are intentionally partial and report `completeness` and `coverage`; malformed, opaque, and unsupported structures remain visible through warnings and explicit outcomes. TIFF/WebP/HEIF/AVIF writing, MakerNote interpretation, image-sequence semantics, and arbitrary metadata editing are unsupported—check [the generated capability matrix](./CAPABILITIES.md) before relying on a format or operation.

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

Use `readStructuredXmp(file)` when an application needs bounded RDF properties
from retained XMP packets. It keeps packet-level failures visible instead of
discarding malformed or unsafe XML.

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

For JPEG, PNG, WebP, classic TIFF, HEIF, and AVIF `Blob` or `File` inputs, use
`scope: "metadata"` to skip image payload ranges and read only selected
metadata. JPEG follows marker lengths and reads selected APP/SOF segments;
PNG/WebP traverse chunk headers; TIFF follows bounded IFD/value offsets. The
result records `completeness.bytesRead` and
`completeness.inputBytes`. HEIF and AVIF reconstruct bounded `meta` boxes and
read only selected metadata item extents; malformed or unsupported layouts
fall back to a full read so the legacy parser can report its diagnostics.

Pass an `AbortSignal` in `ParseOptions` to stop range reads, PNG
decompression, and bounded container traversal at safe checkpoints. Worker
clients can set `terminateOnAbort: true` when immediate interruption of a
synchronous parse is required.

The result always has this stable top-level shape:

```ts
{
  format,
  mimeType,
  dimensions,
  fields,  // normalized common fields
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

`AllMetadata` means every metadata class the library can positively identify plus JPEG comments and PNG text chunks. Unknown APP markers are retained because some—such as Adobe APP14—can affect decoding. Removing `IPTC` removes the containing Photoshop APP13 resource block segment.

JPEG redaction rewrites marker segments only. Selective EXIF redaction removes directory entries, zeroes their detached value bytes, and scrubs orphaned EXIF payload bytes during broad removal; whole EXIF removal drops the APP1 segment. PNG uses the same validated selective EXIF surgery and regenerates its changed chunk CRC. WebP surgery updates RIFF length and VP8X metadata flags while copying image payloads unchanged. JPEG entropy-coded scan bytes and PNG IDAT payloads are never decoded or recompressed. Every redaction includes an explicit `outcome`; if a structure required for surgery is unsafe, the operation is atomic and reports an unsuccessful outcome. JPEGs containing MPF secondary images or Ultra HDR gain-map XMP are refused atomically until their secondary-image offsets can be rewritten safely.

For strict sharing workflows, use `sanitizeMetadata()`. It retains orientation and ICC data by default, removes recognized descriptive metadata, and returns `data: null` unless the policy is completely satisfied.

```ts
import { sanitizeMetadata } from "browser-image-metadata";

const sanitized = await sanitizeMetadata(file);
if (sanitized.successful && sanitized.data) await saveBytes(sanitized.data);
else console.warn(sanitized.reasons);
```

## Normalized EXIF fields

- `Make`, `Model`, `Orientation`
- `DateTime`, `DateTimeOriginal`
- `ExposureTime`, `FNumber`, `ISOSpeedRatings`, `Flash`, `FocalLength`
- `GPSLatitude`, `GPSLongitude`, `GPSAltitude`
- `Copyright`, `Artist`, `Software`

GPS degrees/minutes/seconds and hemisphere references are validated together. Altitude sign follows `GPSAltitudeRef`. Flash is decoded as a bitmask. EXIF APEX shutter speed, aperture, brightness, and exposure-bias entries retain the exact encoded rational and include their computed interpretation. Invalid ASCII, dates, ranges, references, offsets, and zero denominators produce warnings rather than guessed values.

Unknown EXIF tags are retained in `result.exif.fields` with their numeric tag, TIFF type, count, exact raw value, and a generated name.

Photoshop APP13 IPTC-IIM datasets are exposed as `result.iptc.fields` and in `result.fields` with stable `IPTC:record:dataset` identifiers. Repeated datasets such as `Keywords` are preserved as separate entries. The declared IPTC coded character set is honored for UTF-8 (`ESC % G`); each field retains exact raw bytes, and unsupported encodings remain raw with warnings. Urgency, dates, times, and country codes are validated.

Complete JPEG APP2, PNG iCCP, and WebP ICCP profiles expose bounded header fields through `result.icc.fields` and `result.fields` (profile size, version, device class, color space, PCS, and rendering intent). `result.icc.tags` exposes each bounded tag-directory signature and range without decoding tag payloads or color transforms.

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

The runnable browser examples are in [`examples/browser`](./examples/browser), including [`worker.html`](./examples/browser/worker.html) for off-main-thread parsing. The local [playground](./examples/playground) presents summary, raw values, warnings, and strict-sanitization outcomes side by side. They parse the selected local `File`; they do not upload it. The checked Node worker transferable-buffer smoke test is `node examples/worker-smoke.mjs`.

Framework integration snippets for Vite, React, Next.js client components, and Deno are in [`examples/integrations`](./examples/integrations). They import the package's ESM entry point and keep file bytes in the browser or runtime where the application already received them.

### Node.js

Node.js 22 or newer is supported. CI covers the maintained Node.js 22 and 24 LTS lines plus the current Node.js 26 line.

```ts
import { readFile } from "node:fs/promises";
import { parseMetadata } from "browser-image-metadata";

const bytes = await readFile("photo.jpg");
console.log(await parseMetadata(bytes));
```

CommonJS is also supported:

```js
const { parseMetadata } = require("browser-image-metadata");
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

## Security limits

All offsets and lengths are checked before reads or slices. PNG IDAT image data is never decompressed. zTXt and compressed iTXt text are decompressed only through a bounded `DecompressionStream`; per-chunk and cumulative decoded-metadata limits are enforced. The library never makes a network request.

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

Callers can tighten any limit. `maxDecompressedBytes` limits one compressed chunk, while `maxDecompressedMetadataBytes` limits decoded output across PNG text and compressed ICC chunks:

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

The [capability matrix](./CAPABILITIES.md) and [migration guide](./MIGRATION.md) describe supported operations and common adoption paths. See [CONTRIBUTING.md](./CONTRIBUTING.md) for development and fixture-submission guidance, [EXTERNAL_CORPORA.md](./EXTERNAL_CORPORA.md) for the pinned 100-plus-sample interoperability corpus, and [PUBLISHING.md](./PUBLISHING.md) plus the [release checklist](./RELEASE_CHECKLIST.md) to configure npm trusted publishing and cut a release.

## Known limitations

- JPEG, PNG, classic TIFF, WebP, HEIF, and AVIF metadata are parsed in this release; IPTC and ICC remain container-scoped inspections, and JPEG, PNG, plus WebP metadata chunks can be redacted.
- XMP remains available as its original UTF-8 packet by default. The optional `browser-image-metadata/xmp` entry point decodes bounded RDF properties with no DTD or entity support, or applies an application's supplied decoder behind the same packet and output bounds. ICC inspection is limited to the profile header and does not interpret color transforms or tag payloads.
- MakerNote interpretation, image sequences, and complete HEIF/AVIF item-property semantics are not implemented. JPEG extended XMP is reassembled when referenced by a standard XMP packet. HEIF/AVIF inspection uses bounded primary-item `pitm`/`ipma` associations for `ispe` dimensions, `irot`/`imir` transforms, `colr` `prof`/`rICC` profiles, and `nclx` parameters. It follows `cdsc` references from metadata items to the primary image when selecting Exif and MIME RDF/XML metadata; without such references it preserves the legacy all-recognized-item behavior. It resolves bounded metadata through `iinf`/`iloc` construction method 0 (this file) or method 1 (the same `meta` box's `idat`), or direct metadata boxes. TIFF/WebP/HEIF/AVIF writing remains unsupported.
- EXIF date strings do not imply a timezone unless a separate offset tag exists. `getMetadataSummary()` combines valid offset/subsecond companions while retaining that uncertainty when no offset is stored.
- Redaction removes metadata; arbitrary metadata editing and pixel-orientation transforms are outside the first-release API.
- Height-deferred JPEG codestreams whose SOF height is supplied later by DNL are not supported in this first pass.

## License

MIT
