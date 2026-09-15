# G02 reproducible comparison report

- Status: **passed**
- Report version: g02-comparison/1
- Package: browser-image-metadata 2.0.0-alpha.3
- Core benchmark: [reports/g02-benchmark.json](./g02-benchmark.json)
- Core benchmark SHA-256: `3e699ce97fd9c160c6968846835385f0b082043c17895f89e7a2a3627413abea`

## Fixture identities

- `jpeg-exif-little-endian.jpg` — 6727e301428933a6accd496168a6c3b6fbf0c800f2a0e026afe384799c58f27e

## Semantic correctness

| Scenario | Contract passed | Failures |
| --- | --- | ---: |
| detection | yes | 0 |
| orientation | yes | 0 |
| gps | yes | 0 |
| camera-date | yes | 0 |
| all-common-exif | yes | 0 |
| all-documented-metadata | yes | 0 |
| remote-range-simulation | yes | 0 |

## Measured winner rows

| Scenario | Metric | Values | Winner | Comparable |
| --- | --- | --- | --- | --- |
| detection | warm-median-ms | toolkit=0.019, exifreader=0.307, exifr=0.26 | toolkit | yes |
| orientation | warm-median-ms | toolkit=0.867, exifreader=0.225, exifr=0.092 | exifr | yes |
| gps | warm-median-ms | toolkit=0.5, exifreader=0.171, exifr=0.099 | exifr | yes |
| camera-date | warm-median-ms | toolkit=0.255, exifreader=0.113, exifr=0.092 | exifr | yes |
| all-common-exif | warm-median-ms | toolkit=0.483, exifreader=0.089, exifr=0.089 | exifreader, exifr | yes |
| all-documented-metadata | warm-median-ms | toolkit=0.836, exifreader=0.092, exifr=0.123 | exifreader | yes |
| remote-range-simulation | warm-median-ms | toolkit=0.806, exifreader=0.099, exifr=0.089 | exifr | yes |
| detection | actual-bytes-read-median | toolkit=0, exifreader=1332, exifr=1332 | toolkit | yes |
| orientation | actual-bytes-read-median | toolkit=0, exifreader=1332, exifr=1332 | toolkit | yes |
| gps | actual-bytes-read-median | toolkit=0, exifreader=1332, exifr=1332 | toolkit | yes |
| camera-date | actual-bytes-read-median | toolkit=0, exifreader=1332, exifr=1332 | toolkit | yes |
| all-common-exif | actual-bytes-read-median | toolkit=0, exifreader=1332, exifr=1332 | toolkit | yes |
| all-documented-metadata | actual-bytes-read-median | toolkit=0, exifreader=1332, exifr=1332 | toolkit | yes |
| remote-range-simulation | actual-bytes-read-median | toolkit=645, exifreader=1332, exifr=1332 | toolkit | yes |

## Memory and malformed-input observations

- Memory fixture: `jpeg-exif-little-endian.jpg` (6727e301428933a6accd496168a6c3b6fbf0c800f2a0e026afe384799c58f27e); all three readers executed three samples.
- Malformed cases executed: 4; returned and thrown outcomes remain distinct.
- Ordinary bundle C2PA SDK import count: 0.

## Reproduction

```sh
npm ci
npm run g02:run
```

The report is repository-hosted evidence. It does not publish a performance superlative, and it includes the scripts, pinned package versions, and fixture hashes needed to reproduce or challenge each row.
