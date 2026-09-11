# Changelog

## 2.0.0-alpha.3 — unreleased

- added bounded `ByteSource` adapters for byte views and Blob/File ranges with
  overlap coalescing, an LRU cache, aborts, read budgets, and telemetry;
- preserved original JPEG source offsets and provenance when metadata-scoped
  reads fetch only selected marker ranges;
- replaced the external corpus smoke check with a registry-driven differential
  report, per-tag/per-producer counters, SHA-256 fixture identities, reviewed
  allowlist validation, and a strict missing-local gate;
- added fair ExifReader/exifr competitor benchmarks with equal-output semantic
  gates, separate cold/warm timing, fixture hashes, and instrumented range
  request/byte telemetry;
- aligned the public `browser-image-metadata` identity with a generated
  capability manifest, explicit support-boundary documentation, evidence checks,
  and a clean-tree release preflight/checklist;
- added explicit requested-scope and whole-file coverage states for every
  metadata result, including block-level selection, malformed, opaque, and
  unsupported reason codes;
- made privacy audits fail closed from block coverage and emit machine-readable
  policy reason codes; strict sanitization now rejects unclassified metadata;
- added root-level structured-XMP helpers that preserve one result per original
  packet, including bounded decode failures.
- added bounded BigTIFF parsing for both byte orders, including 64-bit IFD
  pointers, safe legacy EXIF decoding, and exact out-of-range integer values.
- added GIF dimensions, comments, animation loop/frame metadata, and bounded
  XMP application-extension parsing.
- added bounded JPEG XL container Exif and XML metadata parsing, with explicit
  raw-codestream inspection limits.
- added validated ICC profile-tag directory entries, including signatures,
  byte ranges, and invalid-range status without exposing unbounded profile data.

## 2.0.0-alpha.2

- added `parseMetadataMany()` for ordered, bounded-concurrency local batch parsing;
- added an explicit, input-bounded `browser-image-metadata/fetch` adapter;
- preserve Blob and File inputs across worker messages, so metadata-scoped
  worker parsing can range-read with `Blob.slice()` without a client-side full copy.

## 2.0.0-alpha.1

- added direct input helpers for GPS, orientation, rotation, thumbnails,
  capture time, selected tags, typed summaries, and common metadata presets;
- added duplicate-preserving field indexes for repeat application lookup;
- removed the misleading public `MetadataField.editable` flag;
- made strict sanitization a discriminated success/failure result and added
  audit limits plus cancellation;
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
- extended metadata-family and EXIF-tag selection to classic TIFF, HEIF, and
  AVIF parsing, so unrequested decoded metadata is skipped consistently.
- added bounded classic TIFF metadata range reads for Blob/File inputs, with
  compacted IFD/value views and bytes-read completeness evidence.
- added bounded HEIF/AVIF metadata range reads for Blob/File inputs, compacting
  `meta` structures and remapping selected direct, `iloc`, and `idat` item
  payloads without reading image data.
- added marker-level JPEG metadata range reads for Blob/File inputs, retaining
  selected APP/SOF segments and the SOS header while skipping opaque headers
  and entropy-coded image data.
- extended `AbortSignal` checks through Blob range reads, PNG decompression, and
  bounded JPEG/WebP/TIFF/HEIF traversal so long metadata operations can stop at
  safe checkpoints.
- aligned the focused JPEG entry point with the root metadata scope so
  `browser-image-metadata/jpeg` and `/mini` also skip JPEG image payloads for
  Blob/File metadata reads and report range completeness.
- expanded the reproducible benchmark matrix to cover selected metadata-only
  Blob reads for all six supported image containers.
- exposed supported `readScopes` through `getCapabilities()` so browser UIs can
  select full, metadata-only, and JPEG-header workflows without format tables.

## Internal 1.0 stabilization

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
