# JPEG XL B01 evidence

- Status: **pass**
- Package: `browser-image-metadata@2.0.0-alpha.3`
- Standards: ISO/IEC 18181-1:2024, ISO/IEC 18181-2:2024
- Cases: 7 (all passed)
- Payload policy: synthetic compact byte fixtures only; no third-party or image payloads are retained.

| Case | Status | Dimensions | Warnings |
| --- | --- | --- | --- |
| raw-codestream-dimensions | passed | 800×600 | UNSUPPORTED_STRUCTURE |
| jxlc-dimensions | passed | 1600×900 | none |
| brotli-xml-custom-decoder | passed | 16×8 | none |
| platform-brotli-capability | passed | — | UNSUPPORTED_COMPRESSION |
| decompressed-output-limit | passed | — | LIMIT_EXCEEDED |
| metadata-aggregate-string-and-packet-limits | passed | — | LIMIT_EXCEEDED |
| malformed-and-unknown-box | passed | — | UNSUPPORTED_STRUCTURE |

## Policies

- Raw codestream: dimensions only; no container metadata inferred.
- Decompression: injected bounded decoder or platform DecompressionStream("brotli"); copied output; maxMetadataBytes, maxDecompressedBytes, maxDecompressedMetadataBytes, maxStringBytes, and maxXmpPackets enforced.
- Provenance: physical box ranges retained; decompressed logical field offsets are null.

The JSON artifact contains the complete machine-readable case evidence.
