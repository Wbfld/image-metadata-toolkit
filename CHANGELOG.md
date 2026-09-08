# Changelog

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
