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

The corresponding upstream APIs are documented by [exifr](https://github.com/MikeKovarik/exifr), [ExifReader](https://github.com/mattiasw/ExifReader), and [exif-js](https://github.com/exif-js/exif-js). Confirm feature-specific behavior against the version your application currently uses before migrating.
