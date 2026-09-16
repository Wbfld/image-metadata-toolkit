# T05 MPF and Ultra HDR evidence

- Status: **pass**
- Package: `browser-image-metadata@2.0.0-alpha.3`
- Standards manifest: `data/mpf/reference-corpus.json` (SHA-256 `a858f9449f85a0d4a243d9749bab4b65b0a069b9511bf71e02f8ff866ac881d8`)
- Standards verified: 2
- Fixtures examined: 3/3 (Android Ultra HDR and CIPA MPF both present)
- Payload policy: temporary fixtures only; no third-party image bytes are copied into the repository or reports.

| Fixture | Kind | Bytes | SHA-256 | MPF images | Secondary metadata | Ultra HDR | Status |
| --- | --- | ---: | --- | ---: | --- | --- | --- |
| temporary-t05-corpus/android-ultra-hdr-01.jpg | android-ultra-hdr | 2746718 | `b52c5f4b9f7c8e831ebe78c3338d6ed1b9a4d3aa4b6c30be7a1851294e094403` | 2 | complete | decoded | passed |
| temporary-t05-corpus/android-ultra-hdr-02.jpg | android-ultra-hdr | 2915755 | `dacf902fbcfb32b1ab29afbfba21e8880d2da205c76bb2a3678773c1f79c1359` | 2 | complete | decoded | passed |
| temporary-t05-corpus/pillow-frame-size.mpo | cipa-mpf | 14574 | `52e7358095494ba0bd0f3fce9705cc7d126c3e9211d40c87f99b199f3e97c606` | 2 | complete | not present | passed |

## Verified policies

- Normalization: MPF offsets are retained as CIPA stored offsets and resolved absolute source offsets; TIFF numeric values are represented as integers; XMP values retain lexical strings alongside finite numeric interpretations; array and GContainer order is preserved; diagnostics are represented by stable codes and messages.
- Limits: SecurityLimits bound input, segment, IFD, image, XMP, nested JPEG, field, warning, and output sizes. Safe-integer arithmetic is required for every MPF offset and length. Remote URI references are never fetched.
- Write behavior: MPF and Ultra HDR writes remain refused by default. The explicit typed mpf: { mode: 'preserve', ultraHdr: 'preserve' } policy recalculates MPF offsets/sizes, verifies every bounded associated JPEG scan hash, and preserves complete Ultra HDR GContainer semantics; malformed or ambiguous relationships fail atomically.

The JSON artifact retains the complete bounded structural summary, including IFD tags, stored and resolved offsets, image attributes, relationships, secondary dimensions and metadata families, XMP lexical/numeric evidence, hashes, source commits, licenses, and diagnostic codes. It contains no image bytes.
