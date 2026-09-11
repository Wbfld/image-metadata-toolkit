# Capability matrix

This matrix describes stable, shipped behavior for `browser-image-metadata` 0.5. It is intentionally narrower than format detection: a container can be recognized even when a particular metadata family or modification is not yet implemented.

| Container | Read | Selective decode | Header-only Blob read | Lossless removal | Strict sanitization |
| --- | --- | --- | --- | --- | --- |
| JPEG | Dimensions, EXIF, XMP, IPTC-IIM, ICC header, JFIF | EXIF tags and metadata groups | Yes | EXIF, XMP, IPTC, ICC, JFIF, recognized EXIF fields | Yes, subject to the reported outcome and inspection gaps |
| PNG | Dimensions, EXIF, XMP, ICC header, text chunks | EXIF and metadata groups | No | EXIF, XMP, ICC, PNG text | Yes, subject to the reported outcome |
| TIFF | Dimensions, EXIF, XMP, IPTC-IIM, ICC header | Result filtering only | No | No | No |
| WebP | Dimensions, EXIF, XMP, ICC header | EXIF and metadata groups | No | EXIF, XMP, ICC | Yes, subject to the reported outcome |
| HEIF | Primary dimensions, EXIF, XMP, ICC header, transforms, `nclx` | Result filtering only | No | No | No |
| AVIF | Primary dimensions, EXIF, XMP, ICC header, transforms, `nclx` | Result filtering only | No | No | No |

`select` means the reader can avoid decoding unrequested metadata for JPEG, PNG, and WebP. TIFF, HEIF, and AVIF keep the same result shape and filter it after bounded parsing. `scope: "jpeg-header"` uses `Blob.slice()` or `File.slice()` and intentionally stops after the start-of-scan header. `scope: "metadata"` additionally skips PNG and WebP image payload chunks and reads only selected metadata chunks. Both partial scopes record `completeness.scope: "partial"`, `bytesRead`, and the declared `inputBytes` for Blob/File inputs.

## Removal semantics

Removal copies encoded image payloads without recompressing pixels. JPEG entropy-coded scan data, PNG IDAT data, and WebP image chunks remain encoded as they were. JPEGs with MPF secondary images or Ultra HDR gain-map XMP are refused atomically until their offset relationships can be rewritten safely.

`redactMetadata()` reports every operation through `outcome`. A successful outcome means every requested target that is supported for the detected format was handled. It does not mean unknown container data has been interpreted. `auditPrivacy()` identifies recognized sensitive values, opaque blocks, thumbnails, trailing data, warnings, and inspection gaps before a sharing workflow makes a policy decision.

`sanitizeMetadata()` is the strict sharing API. It preserves ICC information and EXIF orientation by default, removes recognized descriptive metadata, and returns bytes only when the policy has been satisfied. Callers must check both `successful` and `data`.

```ts
const result = await sanitizeMetadata(file);
if (result.successful && result.data !== null) await share(result.data);
else showReasons(result.reasons);
```

## Input and runtime support

The public input type is `ArrayBuffer`, any `ArrayBufferView`, `Blob`, or `File`. The core parser does not fetch URLs, paths, or network resources. The published package includes ESM, CommonJS, source maps, declarations, focused detection/JPEG/redaction/XMP/worker entry points, and a dependency-free core.

Node.js 22 or newer is covered in CI. Browser, worker, Node, and Deno usage examples are included; applications should test their target browser's `DecompressionStream` support when parsing compressed PNG text or ICC data.
