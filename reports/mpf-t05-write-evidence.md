# T05 MPF metadata-only write evidence

- Status: **pass**
- Package: `browser-image-metadata@2.0.0-alpha.3`
- Fixture: `temporary-t05-corpus/pillow-frame-size.mpo`, 14574 bytes, SHA-256 `52e7358095494ba0bd0f3fce9705cc7d126c3e9211d40c87f99b199f3e97c606`
- Policy: `mpf: { mode: "preserve" }` (default refusal remains covered by the focused tests)
- Output: 14574 -> 14634 bytes; package reparse complete=true; relationships verified=true
- Protected encoded scan payloads: 2; all SHA-256 comparisons matched
- Secondary metadata oracle: ExifTool 13.59; MPF image count matched 2
- Image-decoder evidence: the retained browser test covers every edited primary and secondary JPEG in Chromium and Firefox; unsupported browser launchers are never treated as passes.
- Redistribution: temporary fixture and derived output only; no image bytes are present in this report.

## Normalization and limits

- MPF stored offsets remain distinct from resolved absolute offsets. TIFF numeric fields are compared as unsigned integers in the source byte order. Protected JPEG scan ranges are compared byte-for-byte and by SHA-256. Secondary complete JPEG ranges are additionally compared by SHA-256. No image bytes are retained in this report.
- The writer and parser apply SecurityLimits to input bytes, marker segments, metadata totals, IFD entries, image counts, ranges, nested metadata, and output. All MPF arithmetic is safe-integer checked; malformed, ambiguous, overlapping, unsupported, and out-of-range relationships fail before output is exposed.

The JSON artifact retains the complete byte-change map, input/output hashes, MPF image ranges, protected scan-range hashes, package reparse result, ExifTool comparison, fixture provenance, and typed policy diagnostics without retaining image payloads.
