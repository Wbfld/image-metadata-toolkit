# B05 RAW phase-two evidence

- Status: **pass**
- Package: `browser-image-metadata@2.0.0-alpha.3`
- Projects: CR3 1/1; RAF 1/1; total 2/2
- Independent oracle: `exiftool-vendored@33.5.0`, ExifTool 13.42
- Comparable values: 19; non-comparable: 3; mismatched: 0
- Normalization policy: Text comparisons trim NULs and collapse whitespace; file identity is lower-cased; dimensions and offsets require safe non-negative integers; booleans compare presence only; non-numeric vendor ranges are explicitly non-comparable and never matches.
- Thresholds: at least 2 fixtures and 12 comparable values; at most 0 mismatches and 0 missing values
- Redistribution policy: only hashes, source metadata, parser facts, and comparison results are retained; no CR3 or RAF image bytes are copied into the repository.

## Project acceptance

| Project | Fixtures | Comparable | Non-comparable | Mismatched | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| Canon CR3 ISO-BMFF conformance | 1 | 9 | 2 | 0 | passed |
| Fujifilm RAF conformance | 1 | 10 | 1 | 0 | passed |

## Fixtures

| Project | Fixture | Bytes | SHA-256 | Dimensions | Preview ranges | Metadata ranges | RAW/CFA ranges | Primary/directory | Status |
| --- | --- | ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| cr3 | `temporary/Canon_EOS_R_RAW_ISO_100.CR3` | 31606200 | `89bd55532b0cceb5efa360e97827ba35c2076bce0de4675f3a4413a883dac880` | 6720×4480 | 2 | 3 | 2 | 4 tracks; ambiguous | passed |
| raf | `temporary/AFXT2720.RAF` | 56087360 | `24abd27b4a200f3170ea1579672944b807d0eb35bf21422a3937bb644f27f2eb` | 4416×2944 | 2 | 1 | 1 | complete directory | passed |

## Comparison counts

Overall: {"found":21,"matched":13,"normalized-match":6,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":3,"byField":{"dimensions":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"identity":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"make":{"found":2,"matched":0,"normalized-match":2,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"metadata-range-present":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"model":{"found":2,"matched":0,"normalized-match":2,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"orientation":{"found":2,"matched":0,"normalized-match":2,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"preview-count-positive":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"preview-present":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"preview-range":{"found":2,"matched":0,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":2},"raw-range-present":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"thumbnail-range":{"found":1,"matched":1,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":1}},"byProducer":{"EXIF":{"found":7,"matched":1,"normalized-match":6,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":1},"file-type":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"image-header":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"metadata-inventory":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0},"preview-inventory":{"found":6,"matched":4,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":2},"raw-inventory":{"found":2,"matched":2,"normalized-match":0,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":0}},"byFormat":{"cr3":{"found":10,"matched":6,"normalized-match":3,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":2},"raf":{"found":11,"matched":7,"normalized-match":3,"mismatched":0,"missing-local":0,"missing-reference":0,"non-comparable":1}}}. Every non-comparable comparison is retained with a reason and is excluded from the comparable-match threshold; null or unsupported values never count as a match.

The standards-based parser is the implementation under test. ExifTool is used only as a secondary output oracle for identity, dimensions, stable EXIF values, and presence/range facts where its output is available.

Source manifest SHA-256: `d7a4eb33e001ce308e2132b219bcd97f55470081fdffda125156d2e974441e39`; corpus storage: temporary and untracked; reports contain no source image bytes.
