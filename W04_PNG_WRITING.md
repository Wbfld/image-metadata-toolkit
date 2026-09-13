# W04 PNG metadata writing

`rewritePngMetadata()` is the transactional PNG block writer. It accepts only
`Uint8Array` input and returns a new byte array after the complete input has
been indexed, the requested metadata edits have been planned, the output has
been rebuilt, and the output has passed the configured verification.

The supported block kinds are `exif`, `xmp`, `text`, and `icc`:

- `exif` is a complete TIFF payload in an `eXIf` chunk. `editMetadata()` also
  maps the normalized IFD0 EXIF fields supported by W02 to field set/delete
  transactions, including creation of a missing eXIf block.
- `xmp` is UTF-8 serialized in an `iTXt` chunk with the exact
  `XML:com.adobe.xmp` keyword.
- `text` writes `tEXt`, `zTXt`, or `iTXt` according to `chunkType`. `keyword`,
  language, translated keyword, and compression are explicit options; no
  implicit conversion between text groups occurs.
- `icc` is a complete ICC profile. It is emitted as a standards-shaped `iCCP`
  chunk using bounded zlib compression.

Existing unknown ancillary chunks, all `IDAT` chunks, APNG control/data chunks,
and decoding-critical chunks are copied from the source. The writer validates
chunk lengths, type names, CRCs, IHDR/IEND structure, contiguous IDAT data,
critical chunk support, metadata budgets, duplicate policies, and output
limits before exposing bytes. The default CRC policy rejects every invalid
CRC. `preserve-unknown` is an explicit forensic mode that copies an invalid
unknown ancillary chunk and consequently does not claim that the result is a
fully normalized PNG.

The default duplicate policy is `preserve`: an unqualified replacement or
removal addresses every matching physical chunk. `replace-target` addresses
the first matching chunk, `deduplicate-equivalent` removes duplicate
replacement chunks for singleton metadata, and `reject` refuses an
unqualified operation when multiple candidates exist. A physical `blockId`
always selects one chunk.

Every successful result includes exact output changes and one preserved payload
record per `IDAT` or APNG `fdAT` chunk. Verification compares dimensions,
payload count, and payload bytes, so metadata edits cannot silently recompress
or alter encoded image data. Compression is performed only for the requested
metadata value through the runtime `CompressionStream` and is bounded by the
configured security limits.

The default `verify` path additionally returns a W08 `preservation` report
with independent hashes for each `IDAT`/`fdAT` range, dimensions, animation
relationships, and the configured color/orientation policy. It explicitly does
not claim pixel equivalence. `verify: false` is an explicit raw-writer opt-out
and returns `preservation: null`.
