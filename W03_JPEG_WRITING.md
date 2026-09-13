# W03 JPEG metadata writing

W03 adds a bounded, transactional JPEG metadata writer. It changes marker
segments in a freshly allocated output and never decodes, recompresses, or
rewrites entropy-coded image data.

## Public APIs

The root package and `browser-image-metadata/jpeg-writer` export the raw block
writer:

```ts
import { rewriteJpegMetadata } from "browser-image-metadata/jpeg-writer";

const result = rewriteJpegMetadata(bytes, {
  blocks: [
    { op: "replace", kind: "standard-xmp", data: xmpPacket },
    { op: "replace", kind: "icc", data: completeIccProfile },
    { op: "replace", kind: "iptc", data: iimBytes },
  ],
});
```

`JpegBlockEdit` operates on complete logical metadata values. Standard XMP is
the packet text or UTF-8 bytes, with the Adobe packet identifier accepted as
input. Extended XMP is the logical UTF-8 packet plus a required 32-hex-digit
GUID. ICC is a complete profile, not one JPEG chunk. IPTC is raw IIM data; it
is emitted in a Photoshop `8BIM` resource in APP13. The writer creates and
removes the necessary APP1, APP2, and APP13 segments and splits Extended XMP
and ICC values at the JPEG segment limit.

`add` always adds a new logical block and preserves existing standard XMP or
IPTC blocks. `replace` requires an existing target and replaces every selected
physical occurrence under the duplicate policy. `remove` removes selected
occurrences. ICC is one sequence per JPEG metadata stream: adding a second
profile is rejected, while replacing or removing any selected ICC chunk acts
on the complete validated ICC sequence. A `blockId` selects one physical
marker for standard XMP/IPTC. Extended XMP and ICC remain logical sequence
targets because their chunks are interdependent; Extended XMP is selected by
GUID and ICC by its single profile stream.

Extended XMP must be referenced by a valid standard XMP packet containing the
same GUID. The writer rejects orphan chunks, missing chunks, overlaps, bad
lengths, invalid UTF-8, and oversized logical packets during final
verification. This means an Extended XMP add normally accompanies a standard
XMP add or replace in the same call.

For the trust-first operation model, use `editMetadata()`:

```ts
const result = await editMetadata(bytes, {
  operations: [
    { op: "set", operationId: "make", target: { kind: "field", fieldId: "normalized:Make" }, value: "Example Camera" },
    { op: "set", operationId: "xmp", target: { kind: "field", fieldId: "XMP:standard" }, value: xmpPacket },
    { op: "delete", operationId: "iptc", target: { kind: "field", fieldId: "IPTC:IIM" } },
  ],
});
```

JPEG transactions support exact EXIF field identities and `field-id`
selectors through the W02 TIFF graph writer, including supported set, delete,
copy, alias, and rename operations. Standard XMP, Extended XMP, ICC, and IPTC
use the explicit field identities `XMP:standard`, `XMP:extended:<GUID>`,
`ICC:profile`, and `IPTC:IIM`; equivalent family selectors are supported for
XMP, ICC, and IPTC. `set` adds a missing block, while `delete` is an explicit
no-op when its target is absent. `merge-sidecar` adds caller-supplied bounded
XMP or IPTC-IIM bytes; the core never opens a sidecar path or URL.

Semantic XMP property construction, arbitrary field-level IPTC editing, and
pixel or orientation transforms are outside W03. Unsupported operations are
reported with typed evidence and never cause a partial output to be returned.

## Preservation and verification

The parser indexes marker segments, every entropy-coded scan, frame dimensions,
and bytes after EOI before planning. The reassembler copies all source gaps,
SOS-to-terminating-marker scan payloads, decoding-critical SOF/SOS/DQT/DHT and
other non-target markers, and trailing bytes byte-for-byte. It only changes
explicit EXIF, standard/Extended XMP, ICC, and IPTC blocks. Multiple scans,
progressive frames, comments, duplicate APP markers, and trailing bytes are
supported within the configured bounds.

Every successful result includes:

- `byteChanges`, with output offsets and lengths for inserted, rewritten, and
  removed metadata segments;
- `preservedPayloads`, containing copied before/after scan bytes for hash or
  byte comparison by the caller; and
- input/output lengths and SHA-256 values in the `editMetadata()` evidence
result.

With the default `verify` setting, the raw result also includes a W08
`preservation` report. It independently hashes every entropy-coded scan,
checks dimensions and image relationships, and records that pixel equivalence
is not claimed. The optional `preservation` writer option can require a
strictly preserved or intentionally changeable color/orientation policy;
`verify: false` returns `preservation: null` as an explicit opt-out.

Default verification reparses the output, checks frame count and dimensions,
checks every scan payload byte-for-byte, checks Extended XMP relationships,
and checks that original non-metadata markers were not changed. `verify: false`
is available only on the raw block API for callers that deliberately accept
structural-only verification; `editMetadata()` follows its resolved W01
verification policy. Input arrays are copied and are never mutated.

The independent display gate is `W03 edited baseline and progressive multi-scan
JPEGs remain independently displayable` in `tests/browser/metadata.spec.ts`.
It edits valid, reproducible 2x2 baseline and progressive JPEG fixtures and
loads each output through the browser's native image decoder, asserting a
successful load and 2x2 decoded dimensions. The Playwright Chromium and
Firefox projects are separate independent decoder implementations; their
versions are pinned by the repository's `@playwright/test` lockfile and CI
installs the corresponding browser binaries. Chromium is distributed under
its BSD-style license and Firefox under the Mozilla Public License 2.0; the
test uses only the decoder behavior and does not redistribute browser files.
The baseline fixture is the repository's `tests/fixtures/base.jpg`; the
progressive fixture is an embedded deterministic JPEG generated from the
repository's `tests/fixtures/source.ppm` with the IJG `cjpeg` progressive
encoder. No third-party image bytes are copied into the package.

W03 evidence has three deliberately separate layers: the raw writer's
structural verification and byte-change map, package/ExifTool metadata
reparsing tests, and the browser native-decoder display gate. A passing layer
cannot substitute for another. The browser test is expected to fail if the
writer corrupts scan data even when marker parsing or metadata extraction
still succeeds.

## Fail-closed boundaries and limits

The writer refuses malformed JPEG marker lengths, missing frames or scans,
truncated entropy data, malformed Photoshop resources, incomplete or
inconsistent ICC sequences, malformed Extended XMP, and output that exceeds
`SecurityLimits`. Arithmetic for marker lengths, offsets, cumulative metadata,
segment counts, and output allocation is checked for safe-integer overflow.

The following structures are refused because W03 does not rewrite their
embedded offsets or associated payload relationships:

- MPF secondary-image APP2 metadata;
- Ultra HDR gain-map XMP;
- JUMBF/C2PA and APP11 offset-bearing metadata; and
- height-deferred JPEG codestreams using DNL for the frame height.

Unknown APP markers and unrecognized marker payloads are copied unchanged
when the surrounding JPEG is safe to rewrite. A marker that appears to carry
one of the protected offset-bearing structures is rejected rather than
guessed at. All failures are atomic: the source is untouched and no output
bytes are exposed.

The default duplicate policy is `preserve`. `replace-target` selects one
physical standard-XMP/IPTC occurrence, `deduplicate-equivalent` removes
equivalent selected standard-XMP/IPTC duplicates after replacement, and
`reject` refuses ambiguous duplicate standard-XMP/IPTC targets. Extended XMP
and ICC always operate on their complete logical sequences. There is no
implicit first/last semantic policy.
