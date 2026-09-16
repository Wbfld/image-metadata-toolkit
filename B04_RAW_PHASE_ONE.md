# B04 RAW phase one

The package recognizes seven TIFF-derived camera-file variants while retaining the physical TIFF container identity:

| `fileKind` | `container` | Structural evidence |
| --- | --- | --- |
| `dng` | `tiff` | DNG `DNGVersion` tag 50706 in the bounded directory graph |
| `cr2` | `tiff` | Canon `CR`/version marker at TIFF offset 8 |
| `nef` | `tiff` | Nikon `Make` plus a bounded RAW directory |
| `arw` | `tiff` | Sony `Make` plus a bounded RAW directory |
| `orf` | `tiff` | Olympus `IIRO` header |
| `rw2` | `tiff` | Panasonic `IIU\0` header |
| `iiq` | `tiff` | Phase One/Leaf `IIII` and `CwaR` marker |

`MetadataResult.format` remains `"tiff"` for compatibility. `MetadataResult.container` reports `"tiff"` or `"bigtiff"`, and `MetadataResult.fileKind` reports the camera variant or ordinary `"tiff"`. A standard TIFF with no structural variant evidence is never classified from a filename or MIME type.

## Inventory model

The existing bounded TIFF/BigTIFF directory graph remains the source of truth for byte order, directory identities, parent and next-directory relationships, shared offsets, duplicate candidates, recognized fields, unknown fields, and source ranges. RAW inspection adds `result.raw`:

- `rawPayloads` contains validated sensor-data ranges when the TIFF graph exposes a safe offset/count pair. The format is deliberately `raw`; no sensor samples are decoded.
- `previews` and `thumbnails` contain validated embedded payload ranges with a bounded format probe (`jpeg`, `tiff`, `bigtiff`, or `unknown`), dimensions when the source directory provides them, source tag IDs, directory identity, role, and status.
- `opaquePayloads` retains unknown/vendor ranges and MakerNote references without interpreting their contents.
- `diagnostics` uses stable codes. `AMBIGUOUS_VARIANT` means a recognized vendor format has sensor storage outside the standard addressable TIFF ranges; it never creates an invented offset.
- Payload bytes are not copied into `RawContainerData`. The normal EXIF thumbnail API remains separately bounded and opt-in through the existing parser behavior.

ORF and RW2 proprietary classic-TIFF header magics are normalized only in a bounded parser copy; source offsets and bytes remain unchanged. Blob/File metadata reads use the existing TIFF range planner and return source-relative provenance, including ranges that were indexed but not fetched. All arithmetic, directory counts, value reads, warning counts, and retained output remain governed by `SecurityLimits`.

## Mutation boundary

RAW files are read-only in this phase. `editMetadata()` and `rewriteTiff()` reject structurally recognized RAW variants with a typed `UNSUPPORTED_OPERATION`/`UNSUPPORTED_STRUCTURE` result before allocating output. Ordinary standalone classic TIFF and BigTIFF behavior is unchanged. This phase does not decode RAW pixels, interpret MakerNotes, produce sidecars, or claim camera-vendor metadata completeness.

## Reproducible evidence

`data/raw/raw-b04-sources.json` records the seven lawful CC0 raw.pixls.us source entries, pinned URLs, source IDs, retrieval date, and verified SHA-256 values. The binaries are downloaded only to a temporary untracked directory. `npm run test:raw` requires `RAW_B04_CORPUS_DIR`; it fails when the directory or any fixture is missing, when a hash differs, when fewer than seven files participate, when independent semantic comparisons mismatch, or when the pinned ExifTool oracle is unavailable or has the wrong version.

The evidence command compares the standards-based TIFF graph with pinned ExifTool 13.59 only as a secondary output oracle for file kind, common dimensions where both representations are comparable, make/model, and addressable preview/thumbnail ranges. It records non-comparable vendor values explicitly and never treats them as matches. Reports contain hashes, byte lengths, parser ranges, oracle facts, normalization rules, thresholds, warnings, and diagnostics but no third-party image bytes:

- `reports/raw-b04-evidence.json`
- `reports/raw-b04-evidence.md`

The checked capability matrix records each variant and its positive, malformed/limit, and selection test anchors. The CI interoperability workflow executes the same command against runner-local temporary downloads and uploads the full reports.

## Acceptance matrix

| Roadmap requirement | Implementation | Executable evidence | Retained documentation/evidence |
| --- | --- | --- | --- |
| Recognize DNG, CR2, NEF, ARW, ORF, RW2, and IIQ without extension-only detection | `src/raw.ts` structural signatures and bounded TIFF-directory classification; `src/detect-format.ts` and `src/parsers/tiff.ts` retain the TIFF path | `tests/raw-b04.test.ts` enumerates all seven kinds; the real corpus gate requires the exact seven manifest entries | `data/raw/raw-b04-sources.json`, `CAPABILITIES.md`, `reports/raw-b04-evidence.{json,md}` |
| Preserve physical container and distinct camera-file identity | `MetadataResult.container`, `MetadataResult.fileKind`, and `RawContainerData`; ordinary TIFF remains `fileKind: "tiff"` | Synthetic RAW and existing generic-TIFF tests assert all identities and `format: "tiff"` | `API.md`, `README.md`, `CAPABILITIES.md` |
| Reuse bounded TIFF/BigTIFF graph and preserve directory provenance | `parseTiffMetadata()` normalizes only proprietary classic magic and passes the existing parsed graph into `inspectRawTiff()`; source offsets are remapped for Blob/File reads | RAW Blob metadata-scope test asserts source-relative payload provenance and bounded reads; parser tests cover malformed/out-of-bounds ranges | This document and per-fixture parser ranges in the JSON report |
| Inventory RAW payloads, previews, thumbnails, and opaque vendor data without pixel decoding | `inspectRawTiff()` records role, format probe, dimensions, source directory, tags, offset, length, provenance, and status while retaining no payload bytes | Tests assert role/format/range behavior, limit handling, and absence of payload bytes; real fixtures exercise standard preview/thumbnail ranges | Report `parser.rawPayloads`, `previews`, `thumbnails`, and `opaquePayloads` |
| Keep RAW privacy fail-closed | `auditPrivacy()` classifies sensor and opaque vendor ranges as `opaque-risk` and bounded embedded images as `embedded-preview` findings with stable reason codes | B04 privacy test asserts unsafe result, opaque finding, coverage state, and no payload leakage | `README.md` support boundary and the JSON report's ambiguity/opaque policy |
| Integrate selection, cancellation, details, JSON, and public runtime types | RAW range tags are forced into the bounded TIFF selection plan; public result, `getImageDetails()`, `toJsonSafeResult()`, Blob/File range path, and abort path retain the model | `tests/raw-b04.test.ts` covers selected Blob reads, abort, details, JSON, and all seven runtime identities; `npm run typecheck` covers declarations | `API.md`, generated `dist` declarations from the verified build |
| Keep mutation unsupported and atomic | `editMetadata()` and `rewriteTiff()` perform typed RAW detection before invoking a writer or allocating output | Tests assert `unsupported`/`UNSUPPORTED_STRUCTURE`, null output, and the typed serialization error | Mutation boundary above; `CHANGELOG.md` |
| Produce reproducible independent real-file evidence | `scripts/raw-b04-evidence.mjs` verifies manifest hashes, seven-file participation, ExifTool 13.59 secondary output, thresholds, and redistribution-safe reports; CI downloads only to `$RUNNER_TEMP` and uploads reports | `RAW_B04_CORPUS_DIR=/private/tmp/image-metadata-toolkit-b04-corpus npm run test:raw` passed with 7 fixtures, 31 matches, 11 explicit non-comparables, 0 mismatches, and 0 missing values | `reports/raw-b04-evidence.{json,md}`, `.github/workflows/interoperability.yml`, `data/raw/raw-b04-sources.json` |
