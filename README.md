# browser-image-metadata

Parse, explain, validate, and privacy-redact image metadata locally in browsers, Web Workers, Node.js, and serverless runtimes—without network access or pixel recompression.

The package has no runtime dependencies. It accepts `ArrayBuffer`, any `ArrayBufferView` (including Node.js `Buffer`), `Blob`, and browser `File` inputs.

> **Current scope:** JPEG, PNG, classic TIFF, WebP, IPTC-IIM, and bounded ICC header inspection are implemented. JPEG metadata removal and selected PNG chunk removal are lossless. HEIF/AVIF provide experimental, bounded inspection of direct EXIF/XMP boxes and common `iinf`/`iloc` metadata items; TIFF/WebP/IPTC/ICC/HEIF/AVIF writing or redaction is not exposed.

## Install

```sh
npm install browser-image-metadata
```

Both ESM and CommonJS builds, source maps, and TypeScript declarations are included.

## Parse metadata

```ts
import { parseMetadata } from "browser-image-metadata";

const result = await parseMetadata(fileOrBytes);

console.log(result.format, result.mimeType, result.dimensions);
for (const field of result.fields) {
  console.log(field.name, field.raw, field.value, field.display);
}
for (const warning of result.warnings) {
  console.warn(warning.code, warning.message);
}
```

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
  editable,
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
```

Whole-segment targets are `EXIF`, `XMP`, `IPTC`, `ICC`, `JFIF`, and `AllMetadata`. PNG additionally supports `PNGText` for non-XMP `tEXt`, `zTXt`, and `iTXt` chunks. Selective EXIF targets include every normalized field, `GPS`, and `SerialNumber`. A `preserve` selection wins over a conflicting `remove` selection.

`AllMetadata` means every metadata class the library can positively identify plus JPEG comments and PNG text chunks. Unknown APP markers are retained because some—such as Adobe APP14—can affect decoding. Removing `IPTC` removes the containing Photoshop APP13 resource block segment.

JPEG redaction rewrites marker segments only. Selective EXIF redaction removes directory entries, zeroes their detached value bytes, and scrubs orphaned EXIF payload bytes during broad removal; whole EXIF removal drops the APP1 segment. PNG redaction removes selected ancillary chunks while copying IHDR, IDAT, and IEND bytes byte-for-byte. JPEG entropy-coded scan bytes and PNG IDAT payloads are never decoded or recompressed. If a structure required for the selected surgery is unsafe, redaction is atomic: the original bytes are copied to the result and an error warning explains why nothing was changed.

## Normalized EXIF fields

- `Make`, `Model`, `Orientation`
- `DateTime`, `DateTimeOriginal`
- `ExposureTime`, `FNumber`, `ISOSpeedRatings`, `Flash`, `FocalLength`
- `GPSLatitude`, `GPSLongitude`, `GPSAltitude`
- `Copyright`, `Artist`, `Software`

GPS degrees/minutes/seconds and hemisphere references are validated together. Altitude sign follows `GPSAltitudeRef`. Flash is decoded as a bitmask. EXIF APEX shutter speed, aperture, brightness, and exposure-bias entries retain the exact encoded rational and include their computed interpretation. Invalid ASCII, dates, ranges, references, offsets, and zero denominators produce warnings rather than guessed values.

Unknown EXIF tags are retained in `result.exif.fields` with their numeric tag, TIFF type, count, exact raw value, and a generated name.

Photoshop APP13 IPTC-IIM datasets are exposed as `result.iptc.fields` and in `result.fields` with stable `IPTC:record:dataset` identifiers. Repeated datasets such as `Keywords` are preserved as separate entries. The declared IPTC coded character set is honored for UTF-8 (`ESC % G`); each field retains exact raw bytes, and unsupported encodings remain raw with warnings. Urgency, dates, times, and country codes are validated.

Complete JPEG APP2, PNG iCCP, and WebP ICCP profiles expose bounded header fields through `result.icc.fields` and `result.fields` (profile size, version, device class, color space, PCS, and rendering intent). Tag payloads and color transforms are intentionally not interpreted.

## Format status

| Format | Signature detection | Dimensions | Metadata parsing | Lossless redaction |
| --- | --- | --- | --- | --- |
| JPEG | Yes | SOF markers | EXIF; bounded JFIF/XMP/IPTC/ICC parsing | Yes |
| PNG | Yes | IHDR | eXIf EXIF; iCCP ICC; tEXt, zTXt, iTXt text and XMP | Selected chunks |
| TIFF (classic) | Yes | EXIF ImageWidth/ImageLength when present | EXIF/IFD metadata; XMP tag 700; IPTC tag 33723; ICC tag 34675 | Not yet |
| BigTIFF | Yes | Not yet | Not yet (explicitly warned) | Not yet |
| WebP | Yes | VP8, VP8L, VP8X | EXIF, XMP, and ICCP chunks | Not yet |
| HEIF | Yes | Experimental `ispe` scan | Experimental direct EXIF/XMP boxes and common `iinf`/`iloc` items | Not yet |
| AVIF | Yes | Experimental `ispe` scan | Experimental direct EXIF/XMP boxes and common `iinf`/`iloc` items | Not yet |

Detection means signature/container-brand recognition, not full pixel decoding. A detected format without a metadata parser returns `UNSUPPORTED_FORMAT`; experimental HEIF/AVIF inspection is explicitly bounded and does not claim complete item/property association or pixel decoding. Only common `iinf`/`iloc` Exif and MIME RDF/XML items using supported construction methods are resolved; unsupported methods and associations produce warnings. Fixture provenance and independent decoder validation are release requirements for promoting experimental formats to stable support.

## Runtime examples

### Browser or Web Worker

```ts
import { parseMetadata } from "browser-image-metadata";

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (file) console.log(await parseMetadata(file));
});
```

The runnable browser examples are in [`examples/browser`](./examples/browser), including [`worker.html`](./examples/browser/worker.html) for off-main-thread parsing. They parse the selected local `File`; they do not upload it. The checked Node worker transferable-buffer smoke test is `node examples/worker-smoke.mjs`.

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
import { parseMetadata } from "npm:browser-image-metadata@0.1.0";
const result = await parseMetadata(await Deno.readFile("photo.jpg"));
```

## Security limits

All offsets and lengths are checked before reads or slices. PNG IDAT image data is never decompressed. zTXt and compressed iTXt text are decompressed only through a bounded `DecompressionStream`; the library never makes a network request.

| Limit | Default |
| --- | ---: |
| Input bytes | 256 MiB |
| Total metadata bytes | 16 MiB |
| Single JPEG segment | 16 MiB |
| JPEG segments | 4,096 |
| Total IFD entries | 4,096 |
| IFD nesting depth | 8 |
| Single EXIF value | 8 MiB |
| Decoded string | 1 MiB |
| Warnings | 256 |
| PNG chunks | 4,096 |
| PNG decompressed text | 8 MiB |

Callers can tighten any limit:

```ts
const result = await parseMetadata(bytes, {
  limits: { maxInputBytes: 20 * 1024 * 1024, maxIfdEntries: 512 },
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
npm run check
```

`npm run check` runs type-checking, linting, the complete coverage suite, both package builds, package-manifest validation, and ESM/CommonJS/Blob/typed-array example smoke tests. CI runs it on Node.js 22, 24, and 26 and verifies the npm tarball.

## Known limitations

- JPEG, PNG, classic TIFF, and WebP metadata are parsed in this release; IPTC and ICC remain container-scoped inspections, HEIF/AVIF inspection is experimental, and JPEG plus selected PNG chunks can be redacted.
- XMP is UTF-8 decoded but not interpreted as XML; ICC inspection is limited to the profile header and does not interpret color transforms or tag payloads.
- Extended XMP reassembly, MakerNote interpretation, thumbnails, and complete HEIF/AVIF item-property association are not implemented. HEIF/AVIF inspection resolves only common bounded Exif and MIME RDF/XML items through `iinf`/`iloc` (or direct metadata boxes); unsupported construction methods, malformed locations, and unrelated item associations produce warnings. TIFF/WebP/HEIF/AVIF writing remains unsupported.
- EXIF date strings do not imply a timezone unless a separate offset tag exists; this release does not combine offset/subsecond companion tags into normalized dates.
- Redaction removes metadata; arbitrary metadata editing and pixel-orientation transforms are outside the first-release API.
- Height-deferred JPEG codestreams whose SOF height is supplied later by DNL are not supported in this first pass.

## License

MIT
