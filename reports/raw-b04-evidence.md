# B04 RAW phase-one evidence

- Status: **pass**
- Package: `browser-image-metadata@2.0.0-alpha.3`
- Fixtures: 7 (minimum 7)
- Independent oracle: `exiftool-vendored@33.5.0`, ExifTool 13.42
- Comparable values: 31; non-comparable: 11; mismatched: 0
- Redistribution policy: only hashes, source metadata, parser facts, and comparison results are retained; no RAW image bytes are copied into the repository.

| Kind | Fixture bytes | SHA-256 | Container | Parsed dimensions | Raw ranges | Preview ranges | Thumbnail ranges | Diagnostics | Status |
| --- | ---: | --- | --- | --- | ---: | ---: | ---: | --- | --- |
| dng | 19206240 | `dab360e60b94a3f011dd154577f3e7305febd3d497d47379cc4a64b383c48e1f` | tiff | 4176×3060 | 1 | 0 | 0 | none | passed |
| cr2 | 11062629 | `3789b1ba5d880613104637c40a06619cd9f3b54b0cf62d2d95b9f9e885edcf6e` | tiff | 5184×3456 | 1 | 1 | 1 | none | passed |
| nef | 22582799 | `91657dd8e9c7a086826683f6d20799685657dd7ca2056702b145851465f57cd3` | tiff | 6080×4012 | 1 | 2 | 0 | none | passed |
| arw | 16646144 | `bf4c6d21136aa4fd626212fe72b962b6404e3fca45cdc3b6afbed8e73fee2cf8` | tiff | 4928×3276 | 1 | 1 | 1 | none | passed |
| orf | 11863288 | `540edabdd9d4e6ef8602f56443730cc3133d714dc4d3d2c607e2f0aa6be5cbcd` | tiff | 4080×3040 | 1 | 0 | 0 | none | passed |
| rw2 | 19607552 | `dace6b3818f00a5d4f7cc1cfc29744d15dcf7dd8684c882bea4a81c6ef670ad0` | tiff | 4816×3464 | 1 | 1 | 0 | none | passed |
| iiq | 35092025 | `f2b8bb81f2e3cc918cfa91637683e0ca29a79bd77e1394daa5e8868721954d37` | tiff | 608×456 | 0 | 0 | 1 | AMBIGUOUS_VARIANT | passed |

## Verification policy

- TIFF/BigTIFF physical container plus a distinct RAW fileKind; ordinary TIFF remains fileKind=tiff.
- Directory-referenced ranges are indexed with source offsets and lengths; bytes are never retained in RawContainerData and sensor pixels are never decoded.
- File type is lower-cased; text is NUL-trimmed and whitespace-normalized; dimensions use the common ImageWidth/ImageHeight pair except RW2 sensor dimensions; unavailable vendor ranges are non-comparable, never matches.
- A structurally recognized variant with no safe standard RAW range retains an AMBIGUOUS_VARIANT diagnostic and exposes no invented offset.
- Thresholds: at least 7 fixtures and 20 comparable values; zero mismatches and zero missing values permitted.

The JSON report retains per-fixture source URLs, byte lengths, SHA-256 values, parser/oracle facts, every comparison, status counts, warning/diagnostic codes, and the source-manifest hash. It contains no third-party image bytes.
