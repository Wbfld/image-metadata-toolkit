# T03 JUMBF/C2PA inventory

The `inventoryC2pa` and `inventoryJumbfC2pa` APIs detect and structurally inventory C2PA/JUMBF carriers. They do not verify signatures, certificates, trust, authenticity, or cryptographic bindings. The word `detected`, `inventoried`, or `present` is used for these results throughout the public API and documentation.

## Authoritative sources

The carrier and relationship model is derived from the C2PA Technical Specification 2.4 and JUMBF ISO/IEC 19566-5:2019. Source editions, URLs, licenses, retrieval date, and the reproducible C2PA specification hash are retained in [`data/c2pa/provenance.json`](data/c2pa/provenance.json). The ISO publication is copyrighted and is not copied into this repository.

The implementation recognizes the C2PA JPEG APP11 carrier, PNG `caBX` and C2PA iTXt carrier paths, WebP C2PA/JUMBF chunks, and ISO-BMFF JUMBF/official C2PA UUID carrier structures. All discovered stores expose exact source and payload offsets and lengths, container/block provenance, structural status, relationships, remote references, and mutation risk.

## Safety model

Inventory never fetches a remote reference. It records the bounded URI and emits a `REMOTE_REFERENCE` diagnostic. It uses checked addition and safe integer conversion for every range, and applies repository limits to store counts, BMFF nesting, diagnostics, and reference extraction. Truncated, malformed, overlapping, duplicate, contradictory, unknown, or over-limit structures are represented with stable diagnostic codes and `complete: false` where the full structure was not examined.

The result distinguishes `not-present`, `detected`, `malformed`, `limited`, and `unsupported`. A structurally well-formed fixture means only that the inventory parser can index its carrier; it is not evidence of a verified or trusted manifest.

All applicable JPEG, PNG, and WebP writers call the same mutation guard. The default policy refuses C2PA-bearing or unrecognized offset-bearing structures before mutation. `c2pa: "preserve"` is an explicit caller choice for byte-preserving operations. Invalidation is not silently attempted; the unsupported `invalidate` choice fails atomically until a complete invalidation implementation exists. Source bytes are retained until the normal writer verification has completed.

The retained terminology review is [`T03_C2PA_TERMINOLOGY_REVIEW.md`](T03_C2PA_TERMINOLOGY_REVIEW.md). The roadmap's separate human approval gate remains a governance action and is not satisfied by this self-review.
