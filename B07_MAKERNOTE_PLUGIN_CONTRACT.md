# B07 MakerNote plugin contract

This document defines the explicit MakerNote extension boundary. The core
does not register vendor implementations globally and does not infer a vendor
from the EXIF `Make` string. A caller supplies plugins on each parse or audit
operation through `ParseOptions.makerNotePlugins` or
`PrivacyAuditOptions.makerNotePlugins`.

## Public contract

`MakerNotePluginIdentity` is the immutable description of one plugin. It
contains the stable plugin ID and version, vendor/note family, supported model
and version claims, minimum confidence, signature evidence requirements,
byte-order and offset-base rules, nested-IFD behavior,
encryption/obfuscation status, deterministic tag definitions, and security
requirements.

`MakerNotePlugin.detect()` receives a `MakerNoteReadContext` for exactly one
EXIF MakerNote value. The context exposes bounded relative reads, bounded
16-bit and 32-bit reads, and explicit offset resolution. It contains no
network or filesystem capability and no bytes outside that MakerNote value.
`MakerNotePlugin.parse()` receives the same context, the validated detection,
the resolved repository security limits, and the caller's abort signal.

Plugin output is either a typed decoded/opaque status, bounded decoded fields,
bounded opaque ranges, or stable typed diagnostics. Host validation rejects
invalid field identities, provenance, values, ranges, statuses, duplicate
definitions, and excessive output. Plugin exception text and plugin diagnostic
text are not copied into public diagnostics, preventing raw sensitive values
from escaping through errors.

The host sorts plugins by stable ID/version for every operation. Detection ties
remain low-confidence and opaque. A missing plugin, low-confidence detection,
malformed plugin output, encrypted/obfuscated note, rejected plugin, or limit
failure is never reported as decoded or safe.

## Provenance and limits

Every note, field, and opaque range retains the original note offset and
length, note-relative range, source length, EXIF field identity, physical block
identity, and the declared offset base. The common field adapter exposes
decoded fields under `MakerNote:<vendor>` while the complete plugin-specific
model remains under `result.makerNotes`.

The read context enforces `maxReadRequests`, `maxReadBytes`,
`maxValueBytes`, `maxStringBytes`, `maxIfdDepth`, `maxSegments`,
`maxAdapterItems`, and the caller's existing abort signal. The result validator
also bounds arrays, nested values, diagnostics, and opaque ranges. These are
host-side limits; plugin authors must apply the same limits to any local
algorithm they implement.

## Privacy and integration

Unknown and low-confidence notes are represented as opaque ranges and produce
fail-closed MakerNote privacy findings. Decoded fields retain their declared
sensitivity and provenance. `toJsonSafeResult()`, `toLosslessFamilyGroups()`,
image details, metadata blocks, worker serialization boundaries, and package
exports retain the MakerNote result without making it a built-in vendor pack.

Worker callers cannot structured-clone functions: a worker request must install
the desired plugin implementation inside the worker rather than attempting to
transfer `makerNotePlugins` from the main thread. The core has no process-wide
mutable registration point, so two callers and import order cannot influence
one another.

## Plugin-author guide

1. Give the plugin a globally unique reverse-domain or organization-scoped ID
   and increment its version when detection, tag meanings, or output changes.
2. Detect from note bytes and documented structure. Camera make text is only
   contextual evidence and must never be the sole vendor discriminator.
3. State the exact byte order and base-offset rule. Keep note-relative and
   original-file offsets in every returned provenance record.
4. Use only `context.read()` and the typed read helpers. Do not retain the
   context or request bytes after the parse operation.
5. Return unknown, encrypted, obfuscated, malformed, unsupported, or
   low-confidence data explicitly. Do not guess a field or silently discard a
   remainder.
6. Keep tag definitions deterministic and unique by both stable ID and tag.
   Include source, sensitivity, raw-value behavior, repeatability, and
   validation information for every decoded field.
7. Check abort signals at bounded traversal checkpoints and never fetch a
   network resource.

## Security review checklist

- [ ] Detection is byte/structure based and does not trust a make string alone.
- [ ] Every read is through the bounded context and handles rejected ranges.
- [ ] Counts, recursion, strings, raw values, warnings, and output are bounded.
- [ ] Offsets cannot overflow and provenance is source-relative and explicit.
- [ ] Duplicate directories/tags and unknown portions remain represented.
- [ ] Encrypted, obfuscated, malformed, unsupported, and low-confidence data
      remains opaque and privacy fail-closed.
- [ ] Plugin exceptions do not crash the host or expose exception text.
- [ ] The plugin has no global registration, filesystem, or network side effect.
- [ ] Fixtures and source claims are lawful, hash-pinned, and independently
      reviewed before shipping a vendor pack.

## Acceptance evidence

The contract is exercised by
`tests/makernote-b07.test.ts` and the redistribution-safe report generated by
`scripts/makernote-b07-evidence.mjs` at
`reports/makernote-b07-contract-evidence.json` and
`reports/makernote-b07-contract-evidence.md`. The report is generated from
the public inspection API and includes deterministic ordering, bounded-read,
opaque behavior, typed failure statuses, and absence of global registration.

B07 adds the plugin contract only. Vendor-specific packs are implemented and
reviewed separately in B08.
