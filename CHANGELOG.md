# Changelog

## Unreleased — 2.0 convenience layer

- added typed `getGps`, `getOrientation`, `getRotation`, `getThumbnail`, and
  `getCaptureTime` helpers for common browser workflows;
- preserved source conflicts and incomplete GPS state instead of silently
  selecting ambiguous values;
- added defensive embedded-thumbnail copies and browser-friendly rotation
  instructions.
- added a small JPEG-focused `browser-image-metadata/mini` entry point with
  convenience helpers for common browser workflows.
- added a metadata-only parsing scope for PNG and WebP Blob/File inputs with
  chunk-header traversal, selected metadata reads, and bytes-read reporting.

## Unreleased — 1.0 stabilization

- added a precise capability matrix, migration guidance, a local-only metadata playground, and framework integration snippets;
- added contributor, fixture-provenance, issue-triage, and npm trusted-publishing guidance;
- added a release workflow that runs the package gate before provenance-backed npm publication.
- added pinned ExifReader and ExifTool differential checks, scheduled property-based malformed-input testing, browser-engine and Deno smoke suites, and a reproducible benchmark harness.
- added a pinned, non-redistributed 108-sample external camera corpus gate with independent ExifTool comparisons and recorded source provenance.

## 0.5.0 — 2026-09-11

- added `ParseOptions.select` metadata-family and EXIF-tag selection; JPEG, PNG, and WebP readers skip unrequested metadata decoding;
- added explicit `jpeg-header` parsing scope, including Blob/File slice reads that stop before JPEG entropy data;
- added focused JPEG-only and redaction entry points alongside the existing detection, XMP, and worker entries.

## 0.4.0 — 2026-09-11

- added bounded EXIF thumbnail extraction with MIME detection;
- normalized additional date, ISO, lens, camera-owner, serial-number, description, and UserComment fields;
- added lens specification and modern sensitivity values to `getMetadataSummary()`;
- exposed bounded UTF-8 structured-XMP decoding, injected-decoder adapters, and an optional `@rgrove/parse-xml` entry point;
- associated HEIF/AVIF rotation and mirror properties with primary-item display dimensions;
- selected HEIF/AVIF metadata through bounded `cdsc` primary-image references and exposed primary-item `nclx` colour parameters.

## 0.3.0 — 2026-09-11

- expanded strict privacy audit evidence to identify MPF secondary images and Ultra HDR gain maps alongside opaque JPEG blocks and trailing bytes;
- refused JPEG surgery for MPF and Ultra HDR gain-map structures until secondary-image offsets can be rewritten safely;
- added regression coverage for unsupported-structure detection and atomic failure.

## 0.2.0 — 2026-09-11

- added explicit parse completeness and redaction outcomes, cancellation at public API boundaries, and strict `sanitizeMetadata()` results;
- added shared selective TIFF EXIF surgery for PNG `eXIf` chunks, strict privacy audit evidence, and lossless preservation of PNG orientation;
- added extended JPEG XMP reassembly and the opt-in structured XMP entry point;
- added focused detection and worker entry points, including a request-ID worker client with transferable buffers and cancellation;
- added package and worker regression coverage.

## 0.1.1 — 2026-09-10

- fixed PNG redaction when `preserve` is omitted and made `AllMetadata` preservation authoritative;
- retained whole PNG EXIF chunks when a requested child field must be preserved, with an explicit warning;
- decoded PNG `iTXt` text as UTF-8 and enforced cumulative decoded-metadata limits;
- corrected ICC rendering-intent offset and exposed its standard interpretation;
- validated unknown redaction targets without mutating input bytes;
- added lossless WebP EXIF/XMP/ICCP chunk redaction with RIFF-size and VP8X flag updates;
- added `getCapabilities`, `getMetadataSummary`, and local `auditPrivacy` APIs;
- added regression coverage for PNG preservation, decompression budgets, Unicode text, and ICC profiles.

## 0.1.0 — 2026-09-08

Initial public release:

- bounded local parsing for JPEG, PNG, classic TIFF, WebP, HEIF, and AVIF;
- normalized EXIF fields with raw values, descriptions, sensitivity, and
  validation warnings;
- XMP, IPTC-IIM, JFIF, PNG text, and bounded ICC header inspection;
- lossless JPEG metadata removal and selected PNG metadata-chunk removal;
- ESM, CommonJS, browser, Web Worker, Node.js, and Deno-compatible APIs;
- no runtime dependencies and no network access from the parser;
- MIT licensing, TypeScript declarations, CI checks, and release smoke tests.

Known limitations are documented in [`README.md`](./README.md), including
unsupported metadata writing, HEIF/AVIF redaction, image sequences, and full
colour-transform interpretation.
