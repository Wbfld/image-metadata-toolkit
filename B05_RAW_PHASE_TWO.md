# B05 RAW phase two: CR3 and RAF

B05 adds read-only, bounded structural inventory for Canon CR3 and Fujifilm RAF
files. The two formats have separate public result models because their container
semantics are different:

- CR3 is exposed as an ISO-BMFF container with the existing bounded item and
  sequence views plus `result.cr3`. CR3 keeps every discovered box, item extent,
  track sample, metadata association, preview, RAW range, opaque UUID structure,
  and primary-selection candidate. Multiple picture tracks produce an explicit
  `primarySelection: "ambiguous"`; they are never merged into one image.
- RAF is exposed as a fixed-identity RAF container with `result.raf`. The
  directory's preview, proprietary metadata, and CFA/RAW ranges retain exact
  source-file offsets and lengths. A thumbnail referenced by embedded preview
  EXIF is retained as a nested associated-image range with its parent RAF
  provenance.

Neither implementation decodes pixels or a RAW/CFA mosaic. Range objects are
bounded references and contain no payload bytes. Unsupported Canon UUID,
MakerNote, RAF proprietary metadata, and unknown offset-bearing structures remain
explicit opaque results. Malformed, truncated, overlapping, duplicate, unsafe,
or over-limit structures produce stable diagnostics and do not create invented
ranges.

## Standards and provenance

The format records used for implementation review are:

- [LibOpenRaw CR3 format record](https://libopenraw.freedesktop.org/formats/cr3/)
  (format layout and ISO-BMFF/CR3 semantics).
- [LibOpenRaw RAF format record](https://libopenraw.freedesktop.org/formats/raf/)
  (RAF identity and directory layout).
- [Canon CR3 reverse-engineering notes](https://github.com/lclevy/canon_cr3)
  (provenance for Canon-specific structures only; no implementation code or
  metadata tables are copied).
- [raw.pixls.us](https://raw.pixls.us/) (lawful public sample provenance under
  the contributor public-domain/CC0 policy).

The checked source record is
[`data/raw/raw-b05-sources.json`](./data/raw/raw-b05-sources.json). It preserves
source URLs, license statements, retrieval date, fixture names, byte lengths,
and SHA-256 values. Fixture binaries are downloaded only into temporary
untracked storage by CI and by the evidence command.

## Public model

`Cr3ContainerData` and `RafContainerData` are exported from the package root.
Their ranges include `id`, role, detected range format, source-relative offset
and length, dimensions when independently known, item/track association, source
structure, and a typed status. CR3 also exposes the bounded box list, item
graphs, sequence tracks, sample provenance, candidate primary items/tracks, and
the explicit primary-selection outcome. RAF exposes the validated fixed
directory and its directory range statuses. `getImageDetails()` includes a
bounded `formatSpecific.cr3` or `formatSpecific.raf` summary without copying
payloads.

`parseMetadata()` accepts CR3 and RAF through the same ArrayBuffer,
ArrayBufferView, Blob, File, range-backed, and abort-aware input boundaries as
the other readers. No network request is made by parsing, and no URL or path is
dereferenced by the core parser. Metadata-scoped Blob reads retain the normal
completeness and telemetry annotations; a full read is used when the structure
cannot safely be planned as a range read.

Privacy inspection treats preview, thumbnail, metadata, RAW, CFA, opaque, and
unknown ranges conservatively. The proprietary or unclassified portions remain
high-sensitivity opaque risks, and safe sharing cannot be inferred merely from
successful structural parsing.

## Evidence and acceptance

Run the real, hash-pinned corpus with:

```sh
RAW_B05_CORPUS_DIR=/temporary/raw-b05 \
RAW_B05_OUTPUT_DIR=reports \
npm run test:raw-b05
```

The command fails if the corpus directory or either fixture is missing, if a
byte length or hash differs, if either format is not independently represented,
if parsing is incomplete, if an oracle value is missing, if thresholds are not
met, or if either CR3 or RAF project fails. It emits the checked,
redistribution-safe artifacts [`reports/raw-b05-evidence.json`](./reports/raw-b05-evidence.json)
and [`reports/raw-b05-evidence.md`](./reports/raw-b05-evidence.md). The artifacts
retain no source image bytes.

The independent secondary oracle is `exiftool-vendored@33.5.0`, invoking
ExifTool 13.42 under its Artistic License 1.0/GPL-1.0-or-later distribution
terms. It is not the implementation. Evidence compares identity, dimensions,
Make, Model, orientation where ExifTool's structured output is available,
preview presence, metadata presence, RAW/CFA presence, and the RAF embedded
thumbnail range. Numeric CR3/RAF preview offsets are retained by the parser,
but ExifTool does not expose those vendor-specific source coordinates in its
stable output; those comparisons are recorded as explicit non-comparable values
and never count as matches.

The current retained run examines one CR3 and one RAF fixture, with 19
comparable values, 3 explicit non-comparable values, and zero mismatches or
missing values. The CR3 fixture is a Canon EOS R sample with 31,606,200 bytes
and SHA-256
`89bd55532b0cceb5efa360e97827ba35c2076bce0de4675f3a4413a883dac880`. The RAF
fixture is a Fujifilm X-T3 sample with 61,036,160 bytes and SHA-256
`3e877af0eba8269810ca593b3d9d775164eb3460589143ca499b35b4599c1a6b`.

CI runs the same command in the `raw-b05` interoperability job and uploads the
JSON and Markdown reports as artifacts. No third-party image is checked in or
published.

## Acceptance matrix

| Requirement | Implementation | Executable evidence |
| --- | --- | --- |
| Separate CR3 conformance model | `src/parsers/raw-phase-two.ts`, `Cr3ContainerData` | `tests/raw-b05.test.ts`, `reports/raw-b05-evidence.*` |
| Existing ISO-BMFF items/tracks retained | B02/B03 parser graph normalization in `parseCr3()` | CR3 evidence track/range inventory and B03 regression suite |
| CR3 candidates, transformations, samples, associations | `result.cr3.sequences`, `itemGraphs`, primary-selection fields | `tests/raw-b05.test.ts`, report parser facts |
| Canon/UUID/offset structures remain opaque and bounded | CR3 UUID inventory and `opaqueStructures` | malformed/limit tests and report diagnostics |
| Separate RAF conformance model | RAF fixed-header/directory parser and `RafContainerData` | `tests/raw-b05.test.ts`, RAF report project |
| Exact RAF preview, metadata, CFA and nested thumbnail ranges | `parseRaf()` and source-offset remapping | RAF test and independent ExifTool thumbnail comparison |
| No RAW pixel decoding | range-only payload policy; no pixel decoder dependency | source audit, serialization test, real report payload policy |
| Malformed, overlap, truncation, duplicates, limits | bounded box/directory validation and typed diagnostics | `tests/raw-b05.test.ts` negative/limit cases |
| Abort and no-network behavior | existing abort path and synchronous byte parsing | `tests/raw-b05.test.ts` cancellation/no-network regression |
| Public adapters and package boundaries | root exports, JSON-safe inventories, capabilities, package smoke | capability contract, integration suite, package smoke |
| Real lawful fixture participation | hash-pinned source manifest and temporary corpus | `scripts/raw-b05-evidence.mjs`, CI `raw-b05` job |
| Independent identity/dimension/metadata evidence | standards-based parser compared with ExifTool output oracle | `reports/raw-b05-evidence.json/.md` |
