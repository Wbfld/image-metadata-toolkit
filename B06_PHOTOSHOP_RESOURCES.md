# B06 Photoshop image-resource inventory

Status: implementation evidence complete; human review approved on 2026-09-14. The approval record is [`reports/photoshop-b06-human-review.md`](./reports/photoshop-b06-human-review.md).

## Scope and authoritative source

The implementation covers Photoshop image-resource blocks carried by JPEG APP13 `Photoshop 3.0\0` data and TIFF tag 34377. PSD and PSB file parsing are not claimed because those containers are not supported by the package. The binary structure and resource meanings are derived from the [Adobe Photoshop File Formats Specification](https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/). The pinned source URL, retrieval date, license notice, scope, and SHA-256 are retained in [`data/photoshop-b06-sources.json`](./data/photoshop-b06-sources.json).

## Inventory contract

`parsePhotoshopResources()` retains every structurally valid resource in source order, including duplicates and unknown IDs. Each resource has a stable source-scoped identity, signature, numeric ID, exact Pascal name bytes and decoded Latin-1 presentation, name padding, source range, payload range and length, payload padding, parent block identity, bounded status, decoded semantic value where supported, and an exact payload copy when the security retention budget allows it. Unknown, malformed, and budget-limited resources are never treated as safe.

Supported decoded resource classes are ResolutionInfo (1005), IPTC-NAA (1028) linkage, BGR/RGB thumbnails (1033/1036), XMP (1060), caption digest (1061), path records (2000–2997), and clipping-path names (2999). Semantic values are separate from raw bytes. IPTC-IIM and XMP parsers retain their own field and packet provenance; a Photoshop XMP resource also has an XMP component block.

The parser validates safe arithmetic, resource counts, fixed and bounded structures, Pascal-name padding, payload padding, UTF-8 XMP, fixed-size digest data, thumbnail dimensions and data lengths, path record alignment, and cumulative retained bytes. Truncated, malformed, oversized, and excessive-count inputs return stable typed diagnostics and bounded partial inventories.

## Writer contract and review gate

Existing JPEG metadata edits preserve the complete untouched APP13 segment byte-for-byte. The low-level JPEG writer and typed redaction/edit model additionally support exact removal of one or more resources by their resource identities. Each operation removes only its selected resources, preserves all other resource bytes and ordering, preserves encoded image scan bytes, reparses the output, and refuses malformed Photoshop structures or unsafe lengths before output is committed. Exact-resource targets cannot widen to APP13, IPTC, or another metadata family. TIFF tag 34377 is read and preserved by the existing TIFF graph writer; exact resource mutation is rejected rather than widened because a dedicated safe TIFF resource surgery contract is not claimed.

The retained review packet is [`reports/photoshop-b06-evidence.md`](./reports/photoshop-b06-evidence.md), with machine-readable evidence in [`reports/photoshop-b06-evidence.json`](./reports/photoshop-b06-evidence.json). It includes fixture source/byte maps, input/output hashes, resource payload hashes and lengths, unknown-resource preservation, malformed and oversized atomicity cases, reparsing results, public contract changes, and the exact writer scope. The separate human approval is recorded in [`reports/photoshop-b06-human-review.md`](./reports/photoshop-b06-human-review.md). Self-review and automated tests remain supporting evidence and do not substitute for that approval.

## Executable evidence

`npm run test:photoshop-b06` builds the package, runs `tests/photoshop-b06.test.ts`, and runs the deterministic evidence generator. The tests cover all decoded classes, duplicate and unknown IDs, empty and odd/even names and payloads, malformed padding and truncation, limits, APP13 and TIFF provenance, selection, adapters, privacy fail-closed behavior, exact targeting, unrelated-edit preservation, and atomic writer refusal. The evidence generator creates its lawful fixture bytes in a temporary directory and retains only hashes and compact facts in the repository report; no third-party or generated image is copied into the repository.

## Acceptance matrix

| Requirement | Implementation | Executable evidence | Retained artifact |
| --- | --- | --- | --- |
| APP13 and TIFF tag 34377 inventory | `src/metadata/photoshop.ts`, `src/parsers/jpeg.ts`, `src/parsers/tiff.ts` | `tests/photoshop-b06.test.ts` covers both containers | JSON inventory and Markdown summary |
| Every resource, duplicate, unknown, order, name/padding, payload/range, and provenance fact | `PhotoshopResource` and bounded span scanner | source-order inventory and exact survivor-byte assertions | Per-resource offsets, lengths, and payload hashes |
| Resolution, thumbnails, IPTC/XMP links, paths, clipping names, and digest | `decodeResource()` and XMP/IPTC block linkage in the JPEG parser | high-value decoding and TIFF integration tests | Decoded-kind inventory and diagnostics |
| Pascal-string and even-padding validation | `inspectPhotoshopResourceSpans()` | malformed padding, truncation, and overlapping-length tests | Stable diagnostic codes and ranges |
| Bounded counts, payload retention, and cumulative output | `SecurityLimits.maxSegments`, `maxValueBytes`, and `maxMetadataBytes` | resource-limit and oversized-payload checks | Limited status with omitted raw payload |
| Unknown/malformed privacy fail-closed behavior | Photoshop block status plus `auditPrivacy()` | opaque-risk and raw-leak assertions | No raw digest value in privacy report |
| Exact writer targeting and unrelated-byte preservation | JPEG `photoshop-resource` block edit and typed edit/redaction adapters | one- and multi-resource removal, public `editMetadata()`, unrelated APP13 and scan preservation | Before/after hashes and surviving-resource hashes |
| Atomic malformed and unsafe writes | JPEG writer preflight and verification | malformed-padding writer refusal | `outputAllocated: false` evidence |

## Mandatory review packet

The B06 writer scope is deliberately narrow: exact removal is supported for
JPEG APP13 resources only. It never creates or rewrites an `8BIM` resource, and
TIFF tag 34377 is read-only. The packet in
`reports/photoshop-b06-evidence.{json,md}` records the source fixture hash,
every source-order resource range and payload hash, the unrelated-edit and
exact-removal input/output hashes, survivor-block hashes, malformed atomicity,
security-limit behavior, and the public contract. The complete writer and
selector diff has the roadmap-mandated human approval recorded in
[`reports/photoshop-b06-human-review.md`](./reports/photoshop-b06-human-review.md).
No automated test or agent self-review is treated as that approval.
