# W08 preservation verifier

`verifyPreservation()` and `verifyPreservationSync()` provide independent,
machine-readable evidence that a metadata edit did not change the encoded image
payload. They are available from the root package and from
`browser-image-metadata/preservation`:

```ts
import { verifyPreservation } from "browser-image-metadata/preservation";

const report = await verifyPreservation(beforeBytes, afterBytes, {
  colorPolicy: "report-only",
  orientationPolicy: "preserve",
});

if (!report.successful) throw new Error(report.diagnostics.join(" "));
```

The synchronous entry point is used by the synchronous JPEG and WebP writers;
the asynchronous entry point additionally accepts `Blob` and `File` values.
Both copy direct inputs before inspection. Reports contain source and payload
SHA-256 hashes, absolute source offsets, lengths, format, dimensions,
animation/image relationships, configured color/orientation policy results,
bounded-container decodability, and explicit counts for matched, mismatched,
missing, and non-comparable protected ranges. No corpus or image payload bytes
are embedded in a report.

The independently inventoried ranges are:

- JPEG entropy-coded scan payloads, excluding the terminating marker;
- PNG `IDAT` data and complete APNG `fdAT` data, including its sequence number;
- WebP `VP8 `, `VP8L`, `ALPH`, and `ANMF` chunk data.

Metadata insertion can move a range, so offsets are compared as source-local
evidence and the bytes are compared by source-order category. A changed byte
changes the range hash and is reported as `mismatched`; null or unsupported
values are never reported as matches. Malformed critical structures, changed
dimensions, changed animation/image relationships, missing ranges, and a
violated `preserve` policy fail the report. `report-only` records a color or
orientation change without making that policy a failure, and `allow-change`
records it as allowed.

The report's `pixelEquivalence` is always `not-claimed`. This package does not
decode pixels and therefore does not claim rendered-pixel identity. TIFF,
GIF, JPEG XL, HEIF, AVIF, and unknown formats remain explicitly incomplete for
this verifier until an independently justified encoded-payload inventory is
available; their report cannot be mistaken for pixel evidence.

The existing writer-specific checks remain in place. With the default
`verify` setting, JPEG, PNG, and WebP metadata writer results also contain a
successful W08 `preservation` report and throw atomically if the independent
report fails. Writer defaults use `colorPolicy: "report-only"` because adding or
replacing a color profile is a supported metadata operation, while orientation
is preserved. Callers may provide an explicit `preservation` option when a
stricter or intentionally changing policy is required. `verify: false` is an
explicit raw-writer opt-out and returns `preservation: null`; transactional
`editMetadata()` keeps verification enabled according to its W01 policy.

Normalization is deliberately narrow: SHA-256 is lowercase hexadecimal,
ranges use absolute byte offsets, payload categories and arrays retain source
order, structural objects compare exact stable JSON values, and no strings,
curves, or pixel data are normalized into an equivalence claim.
