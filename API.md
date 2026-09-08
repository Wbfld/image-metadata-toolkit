# API reference

## `parseMetadata(input, options?)`

```ts
parseMetadata(input: MetadataInput, options?: ParseOptions): Promise<MetadataResult>
```

Parses an `ArrayBuffer`, `ArrayBufferView`, `Blob`, or browser `File` entirely
locally. It returns a stable result with `format`, `mimeType`, `dimensions`,
normalized `fields`, raw `exif`, `xmp`, `iptc`, `icc`, `jfif`, `pngText`, and
bounded `warnings`.

Supported metadata readers are JPEG EXIF/JFIF/XMP/IPTC/ICC, PNG EXIF/text/XMP/
ICC, classic TIFF EXIF/XMP/IPTC/ICC, WebP EXIF/XMP/ICC, and bounded HEIF/AVIF
EXIF/XMP/primary dimensions/ICC inspection. Unknown EXIF tags remain in
`result.exif.fields`.

## `redactMetadata(input, options)`

```ts
redactMetadata(input: MetadataInput, options: RedactOptions): Promise<RedactionResult>
```

JPEG metadata and selected PNG ancillary chunks can be removed without
decoding or recompressing pixels. `remove` accepts `AllMetadata`, whole
metadata classes (`EXIF`, `XMP`, `IPTC`, `ICC`, `JFIF`, `PNGText`), and the
normalized EXIF privacy targets. `preserve` wins over a conflicting removal.
Unsafe or malformed surgery is atomic: the original bytes are returned with an
error warning and no removal record.

## Limits and warnings

`ParseOptions.limits` and `RedactOptions.limits` accept positive safe integer
overrides for input, metadata, segment, chunk, IFD, nesting, string,
decompression, and warning budgets. Every parser warning has a stable `code`,
`message`, and `severity` (`warning` or `error`), with offsets where available.
Oversized top-level input rejects with `MetadataError` code `LIMIT_EXCEEDED`.

## Types and compatibility

All public types are exported from the package root. `MetadataField.raw`
preserves source values, including exact rational numerator/denominator pairs;
`value` is validated/interpreted metadata and `display` is human-readable.
The package has ESM and CommonJS exports, browser/Web Worker-compatible ESM,
and no runtime dependencies. It never performs network I/O.

See [`README.md`](./README.md) for field semantics, format limitations, and
complete runnable examples.
