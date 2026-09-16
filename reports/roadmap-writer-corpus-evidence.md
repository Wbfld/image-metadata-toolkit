# Roadmap-wide writer corpus evidence

- Schema: `browser-image-metadata.writer-corpus-evidence.v1`
- Status: **PASS**
- Package: browser-image-metadata 2.0.0-alpha.3
- ExifTool oracle: exiftool-vendored@38.1.0, ExifTool 13.59
- Browser decoders: Chromium 153.0.8010.12 (BSD-derived Chromium license) and Firefox 155.0 (MPL-2.0) through Playwright 1.63.0 (Apache-2.0)
- Normalization: browser-image-metadata.writer-normalization.v1; No metadata-value normalization is used for acceptance. Package and ExifTool must both reparse the written output; payload ranges compare exact SHA-256 bytes; decoder dimensions compare exact positive integers; source order and unknown metadata signatures compare ordered multiset identities.

## Corpus provenance

- web-platform-tests: https://github.com/web-platform-tests/wpt.git @ `63ff666e50e7ef4c11a6885612a05951f6f63547`; BSD-3-Clause; 942 participating source fixtures
- imazen-codec-corpus: https://github.com/imazen/codec-corpus.git @ `8e10d4d765667c1c49d74413878fc4bfb46dcf8d`; Per-dataset licenses are recorded by the pinned repository README and LICENSE files; selected sets include MIT, IJG/BSD, CC0, Freeware, BSD, Apache, CC-BY-SA, LGPL, and explicitly Various sources.; 658 participating source fixtures
- ianare-exif-py: https://github.com/ianare/exif-py.git @ `a69bf74770caf6b333221658f5092ed69f99faac`; LGPL-3.0-or-later for exif-py; user-contributed sample images retain the attribution and license records documented by the pinned repository.; 95 participating source fixtures
- Derived-real policy: Only used to fill a family minimum after eligible pinned real files are exhausted. Each derived JPEG or WebP is encoded by the pinned Playwright Chromium implementation from a hash-recorded decoded WPT PNG; it is not a synthetic pixel fixture.

## Family gate

| family | fixtures | successful outputs | payloads | payloads matched | oracle passed | Chromium decoded | Firefox decoded | unknown preserved |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| jpeg | 500 | 512 | 769 | 769 | 512 | 512 | 512 | 512 |
| png | 500 | 512 | 858 | 858 | 512 | 512 | 512 | 512 |
| webp | 500 | 512 | 612 | 612 | 512 | 512 | 512 | 512 |

## Required structure participation

The selected fixtures must include each required structure; counts are participating fixtures, not merely available corpus candidates.

| family | baseline | progressive | multi-scan | comments | trailing bytes | APNG animation | compressed text | color profile | VP8 | VP8L | VP8X | alpha | animation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| jpeg | 470 | 26 | 27 | 12 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| png | 0 | 0 | 0 | 0 | 0 | 1 | 15 | 16 | 0 | 0 | 0 | 0 | 0 |
| webp | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 494 | 4 | 279 | 51 | 2 |

## Failure and protected-structure controls

- Truncated-input controls: jpeg refused (UNSAFE_STRUCTURE), png refused (UNSAFE_STRUCTURE), webp refused (UNSAFE_STRUCTURE)
- C2PA default-refusal controls: jpeg refused (UNSUPPORTED_STRUCTURE), png refused (UNSUPPORTED_STRUCTURE), webp refused (UNSUPPORTED_STRUCTURE)
- MPF/Ultra HDR default-refusal controls: android-ultra-hdr-01.jpg refused (UNSUPPORTED_STRUCTURE), android-ultra-hdr-02.jpg refused (UNSUPPORTED_STRUCTURE), pillow-frame-size.mpo refused (UNSUPPORTED_STRUCTURE)
- Orientation controls: jpeg preservation/change/deletion passed, png preservation/change/deletion passed, webp preservation/change/deletion passed

All report rows retain fixture-relative identity, byte lengths, SHA-256 values, operation results, exact byte-change ranges, payload ranges/hashes, package reparsing, oracle status, decoder dimensions, and typed failure details. Image bytes and output copies are temporary only and are not present in this report.

