# S06 coverage evidence

Status: **passed** (checked: true)

Package: browser-image-metadata@2.0.0-alpha.3; Node 22.22.2; V8 12.4.254.21-node.39; Vitest 4.1.11; @vitest/coverage-v8 4.1.11.

## Enforced result

Overall branch coverage: **85.75%** (18198/21223); required minimum: 85%.
Security-scope branch coverage: **90.02%** (8379/9308); required minimum: 90%; files: 33.
Skipped branches: 0 overall, 0 in scope.

## Scope and policy

All bounded parser/indexer, metadata-decoder, structured-input, range-I/O, decompression, JUMBF-inventory, and security-limit source files. Mutation policy, surgery, selector, HTTP, and writer code remains covered by the repository-wide threshold; optional T04 C2PA runtime adapters are outside this Stage 6 parser/indexer scope.

Source inclusion: `src/**/*.ts`; source exclusion: `src/types.ts`. Test-only exclusions are `tests/cli.test.ts", "tests/r04-compatibility.test.ts` and do not exclude source files from V8 coverage.
Any skipped branch record fails the gate; no c8 ignore or source exclusion is used for difficult code.

## Security-scope files

| File | Branches | Percent |
| --- | ---: | ---: |
| src/heif-range.ts | 361/411 | 87.83% |
| src/input.ts | 170/185 | 91.89% |
| src/jpeg-range.ts | 111/126 | 88.10% |
| src/tiff-range.ts | 455/529 | 86.01% |
| src/io/byte-source.ts | 80/84 | 95.24% |
| src/io/jpeg-byte-view.ts | 0/0 | 100.00% |
| src/metadata/exif.ts | 639/743 | 86.00% |
| src/metadata/icc.ts | 433/480 | 90.21% |
| src/metadata/iptc.ts | 320/356 | 89.89% |
| src/metadata/jfif.ts | 20/26 | 76.92% |
| src/metadata/makernote-pack-sources.ts | 0/0 | 100.00% |
| src/metadata/makernote-pack.ts | 216/255 | 84.71% |
| src/metadata/makernote.ts | 350/381 | 91.86% |
| src/metadata/mpf-ultrahdr.ts | 468/515 | 90.87% |
| src/metadata/photoshop.ts | 166/177 | 93.79% |
| src/metadata/serialization.ts | 393/422 | 93.13% |
| src/metadata/thumbnail.ts | 19/19 | 100.00% |
| src/metadata/xmp.ts | 531/578 | 91.87% |
| src/parsers/gif.ts | 96/99 | 96.97% |
| src/parsers/heif.ts | 1106/1222 | 90.51% |
| src/parsers/jpeg.ts | 522/579 | 90.16% |
| src/parsers/jxl.ts | 206/235 | 87.66% |
| src/parsers/png.ts | 275/289 | 95.16% |
| src/parsers/raw-phase-two.ts | 433/521 | 83.11% |
| src/parsers/svg.ts | 140/148 | 94.59% |
| src/parsers/tiff.ts | 349/368 | 94.84% |
| src/parsers/webp.ts | 154/164 | 93.90% |
| src/security/abort.ts | 2/2 | 100.00% |
| src/security/bounds.ts | 28/28 | 100.00% |
| src/security/limits.ts | 13/13 | 100.00% |
| src/security/sha256.ts | 0/0 | 100.00% |
| src/security/warnings.ts | 2/2 | 100.00% |
| src/trust/jumbf.ts | 321/351 | 91.45% |

The JSON report retains the complete checked per-source V8 counters and contains no source or fixture bytes.
