# B03 HEIF/AVIF sequences and multi-image results

B03 adds bounded structural sequence inspection to the B02 HEIF/AVIF item
graph. The parser does not decode image pixels, copy sample payloads, render
frames, or write HEIF/AVIF files.

## Authoritative references

The implementation uses the same pinned source record as B02. The repository
retains citations and derived behavior, not copies of copyrighted standards.

| Reference | Version | URL | License/provenance | Retrieved |
| --- | --- | --- | --- | --- |
| ISO/IEC 23008-12, Image File Format | 2025, edition 3 | <https://committee.iso.org/standard/89035.html> | ISO copyrighted standard; consulted under licensed access; no source bytes redistributed | 2026-09-13 |
| ISO/IEC 14496-12, ISO base media file format | 2022, edition 7 | <https://www.iso.org/standard/83102.html> | ISO copyrighted standard; consulted under licensed access; no source bytes redistributed | 2026-09-13 |
| AV1 Image File Format (AVIF) | v1.2.0, 2025-10-16 | <https://aomediacodec.github.io/av1-avif/v1.2.0.html> | Alliance for Open Media, linked specification; license notice at <https://aomedia.org/license/> | 2026-09-13 |

The complete source metadata, including hashes and the policy for uncopied
copyrighted standards, is [data/heif/sources.json](data/heif/sources.json).

## Result model

`MetadataResult` keeps its existing primary view (`dimensions`, `details`, and
the common fields) and adds `heifSequences` when one or more `moov`/`moof`
sequence structures are present. The B02 `heif` item graphs are never merged
into tracks.

Each `HeifSequence` retains:

- source byte range, movie timescale/duration, fragmentation state, and
  completion state;
- every bounded track with ID, handler type/name, kind (`picture`,
  `auxiliary`, `metadata`, or `unknown`), timescale, duration, language,
  dimensions, transformation matrix/orientation, edit list, and source range;
- sample descriptions with format, data-reference index, dimensions, codec
  configuration child types, and source range;
- samples with source table/fragment provenance, description index, byte
  length, source-relative offset when safely resolvable, decode and composition
  times, duration, and sync status;
- ordered track references and resolved associated-track IDs;
- explicit item-graph and track metadata associations; and
- primary picture-track candidates and the reason for selection.

The top-level primary policy is deliberately conservative. A sequence gets a
`primaryTrackId` only when it has exactly one picture track. Multiple picture
tracks remain independently addressable in `tracks`, have all candidate IDs in
`primaryTrackCandidates`, and report `ambiguous-picture-tracks`. No sequence
primary is represented by `no-picture-track`. The top-level dimensions and
image-detail primary view use a sequence track only when exactly one sequence
has an unambiguous picture track; existing item-property dimensions retain
precedence.

Track `cdsc` and `meta` references are retained as references and are also
reverse-linked from the referenced picture track through `metadataTrackIds`.
The existing item-graph `describes` relationships remain separate and are
reported in `metadataAssociations` with null track IDs. This preserves the
distinction between item metadata and timed metadata tracks.

## Validation and limits

All box sizes, offsets, durations, fixed-point values, table counts, sample
counts, relationship counts, and expanded timing runs use safe-integer
arithmetic. Box traversal, nested sample-entry children, tracks, sample
descriptions, edit entries, timing entries, samples, relationships, and
warnings are bounded by the repository security limits. A sample payload is
never allocated for sequence inspection. Unsafe offsets are retained as
reported lexical numeric facts but produce `UNSAFE_OFFSET` and make the
sequence incomplete. Malformed, truncated, unsupported, duplicate, or
over-limit structures remain visible with stable warning codes and
`complete: false`.

Unfragmented tables cover `stts`, signed `ctts`, `stsc`, `stsz`/`stz2`,
`stco`/`co64`, and `stss`. Fragmented tables cover `mvex`/`trex`, `tfhd`,
`tfdt`, and `trun`, including fragment offsets, per-sample duration/size/
flags/composition offsets, and default values. Version 0 and version 1 movie,
track, media, edit, and decode-time fields are bounds-checked. Matrix
orientation is exposed only for recognized orthogonal transforms; the full
matrix remains available when present.

Metadata-scoped `Blob`/`File` range materialization falls back to a bounded
full read when it sees `moov` or `moof`. Sequence sample offsets are relative
to the original source, so compacting only metadata boxes would make those
offsets untrustworthy. The fallback preserves sequence provenance and the
existing completeness/telemetry contract.

## Evidence

The focused suite [tests/heif-b03.test.ts](tests/heif-b03.test.ts) uses
deterministic, repository-authored structural bytes and verifies independent
picture/metadata tracks, sample order and timing, matrix orientation,
fragmented samples and fragment provenance, item-versus-track associations,
ambiguous primary selection, duplicate IDs, unsafe offsets, missing data,
sample limits, truncation, and bounded JSON exposure.

The executable evidence gate is:

```sh
npm run test:heif-sequences
```

It builds the package and runs
`scripts/heif-b03-evidence.mjs`. The command fails on any incomplete positive
case, missing warning for malformed or over-limit input, guessed ambiguous
primary, lost association/timing/provenance, or incomplete report. It writes
the redistribution-safe [JSON report](reports/heif-b03-evidence.json) and
[Markdown report](reports/heif-b03-evidence.md), containing fixture paths,
byte lengths, SHA-256 values, package/source-manifest identity, standards,
limits, model policies, result summaries, and warning codes. The generated
fixtures are not written and no third-party image bytes are copied.

HEIF/AVIF image writing and pixel decoding remain outside B03.
