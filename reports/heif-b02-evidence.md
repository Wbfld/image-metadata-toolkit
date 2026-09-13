# HEIF/AVIF B02 evidence

- Status: **pass**
- Package: `browser-image-metadata@2.0.0-alpha.3`
- Source manifest: `data/heif/sources.json` (SHA-256 `ef693cbec24915982a5b30e1eb1a0c2ff13bfd210396e36daf0cd891c54ade4c`)
- Cases: 10 (all passed with complete graphs)
- Payload policy: checked repository fixtures only; no third-party image bytes or derived image copies are written by this command.

| Fixture | Format | Bytes | SHA-256 | Graphs/items | Methods | Relationships | Status |
| --- | --- | ---: | --- | ---: | --- | --- | --- |
| tests/fixtures/heif-iref-exif.heic | heif | 860 | `01e4d05f95b128c4008406fa546c60c3c42d405f1aac42b3e77691617d5828b0` | 1/3 | idat | cdsc | passed |
| tests/fixtures/heif-item-metadata.heic | heif | 830 | `45827c242151888ad23d4dcf493d53e8a161ad0d968e207db1de2afc4cb8efa5` | 1/3 | file | none | passed |
| tests/fixtures/heif-idat-item-metadata.heic | heif | 834 | `441bdac7b7f5eebca856ed9a93c69a5f2562de7d5dad4db8d22f6986f1cbdcd6` | 1/3 | idat | none | passed |
| tests/fixtures/heif-indexed-idat-item-metadata.heic | heif | 842 | `19d115037513946304499be5a1a9230f6652176f19c7805e1c223dd6b79802bb` | 1/3 | idat | none | passed |
| tests/fixtures/heif-tail-idat-item-metadata.heic | heif | 834 | `bcb9739d8f2fc8edb96dbbeaaae111902fd781961760aae455f22bc160dcc9a6` | 1/3 | idat | none | passed |
| tests/fixtures/heif-primary-icc.heic | heif | 979 | `61e007d7b3a343a9ba14c2e318bd8740705048ad17ef946082cdf918fd662aac` | 1/3 | idat | none | passed |
| tests/fixtures/avif-idat-item-metadata.avif | avif | 834 | `0ec4bd1d69f2e837d9b1509621465b71f9ee0d50936bc16aedb8ff544cfa8102` | 1/3 | idat | none | passed |
| tests/fixtures/avif-primary-nclx.avif | avif | 854 | `52d5649ac2bd6ef715e795a11576e1340c4e88b888b9ea1b2af72ea1c41b722d` | 1/3 | idat | none | passed |
| tests/fixtures/avif-primary-icc.avif | avif | 979 | `853ab0ba476ea3b2cdca5f72a3830d14d130a8f56674577ac46dc3d842593439` | 1/3 | idat | none | passed |
| tests/fixtures/libavif-paris-icc-exif-xmp.avif | avif | 21132 | `961bc38b61e60b7651fa20efa24269ae2f35e4958822a81c908c9bbf9b3f66e1` | 1/3 | file | cdsc | passed |

## Executed policies

- Construction methods: file (iloc method 0); idat (iloc method 1); item-offset (iloc method 2).
- External data: self-contained url/urn references are only resolved within the source file; external and unknown references are inventoried and never fetched.
- Limits: safe-integer offsets, bounded box/item/property/reference counts, bounded strings, bounded extents, cycle detection, and cumulative metadata-byte limits.
- Pixel behavior: structural item semantics only; no pixel decoding.

The JSON artifact records the complete machine-readable result, including dimensions, graph completeness, construction methods, relationships, ICC/XMP presence, warning codes, source-manifest hash, and fixture hashes. It contains no image bytes.
