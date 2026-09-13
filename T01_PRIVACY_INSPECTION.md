# T01 semantic privacy inspection

`auditPrivacy` performs a bounded semantic inspection of the decoded metadata that the package can understand. It is an inspection report, not a promise that an image contains no undiscovered content. Every finding has a stable `category`, `state`, `reasonCode`, and exact target identity. Human-readable messages are explanatory text only and are never used for policy decisions.

## Finding states

| State | Meaning |
| --- | --- |
| `presence` | A metadata family, decoded field, or physical block is present. Presence is not itself a decoded semantic value. |
| `decoded-finding` | A value was decoded and matched a standards or registry-backed sensitive semantic category. |
| `opaque-risk` | Data is present but unknown, malformed, truncated, or not safely decoded. Opaque data is fail-closed and is never reported as safe. |
| `policy-violation` | Reserved for policy evaluation results when an inspected finding violates the selected policy. The default audit does not invent a policy. |

## Semantic categories

The semantic inspector covers the following stable categories: `location`, `person`, `creator`, `contact`, `serial-identifier`, `device-identifier`, `timestamp`, `document-identifier`, `region`, `prompt`, `workflow`, `embedded-preview`, `descriptive`, `unknown-xmp`, `opaque-block`, and `unsupported-structure`, in addition to the `metadata-presence` state. It walks decoded EXIF fields, generated IPTC semantic candidates, every XMP packet, arrays, language alternatives, qualifiers, and nested resource values. XMP identity is always the namespace URI plus local name; prefixes are not trusted as identity.

Each decoded result preserves the field ID where one exists, the physical block ID, namespace URI/local name, packet index, occurrence, and validation detail. The parser's existing packet and byte provenance remains attached to the source metadata result. Unknown XMP properties are retained as high-sensitivity `unknown-xmp` findings even when their lexical value is unavailable.

## Safe serialization

`rawValue` is omitted from the public report by default. Callers must deliberately pass `{ includeRawValues: true }` to `auditPrivacy` to request raw values. Policy reports always use the safe finding projection and omit raw values. The contract tests serialize the complete default report and its human-readable diagnostic projection and assert that sentinel sensitive values are absent; no privacy decision or diagnostic is constructed from the raw lexical value.

Structured traversal is bounded by the normal security limits: input bytes, XMP properties, nesting depth, array/resource counts, warning counts, and cumulative output. A malformed or truncated sensitive structure produces a typed opaque-risk finding and incomplete coverage; it cannot become a safe result by virtue of decoding failure.

## Policy linkage

T02 policy evaluation consumes this report. Exact field IDs are the only removal targets generated from semantic findings. Findings without an exact target remain unresolved and cause strict policies to refuse output before mutation. No policy uses a warning string as a security or privacy decision.
