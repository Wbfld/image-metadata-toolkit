# Public API deprecation policy

This policy applies to `browser-image-metadata` 2.0 and later. The current
2.0.0-alpha.3 surface has no removed public names and no runtime deprecations.

## Notice and support period

A deprecation requires an API decision record entry, a replacement name or
workflow, migration documentation, and a changelog entry before it is
published. Deprecated APIs remain implemented and typed for at least one minor
release and six months, whichever is longer. The support window starts with
the first stable release that contains the deprecation.

During the window, the replacement is the primary documented path. Runtime
calls remain behaviorally compatible unless the decision record states a
security correction. Type declarations carry `@deprecated` only after the
replacement is available and the notice is published. The dependency-free
browser/core runtime does not emit console warnings: warnings are data on
returned results, and applications must not need to intercept global console
output.

## Removal and semver

Removal occurs only in the next major version after the support window, with a
final changelog and migration entry. Security removals may occur in a patch or
minor release only when retaining the API would permit unsafe parsing,
mutation, privacy classification, or verification; that exception must name
the affected contract and replacement. Additive fields and entry points are
minor-compatible. Changes to discriminants, required result fields, input
acceptance, mutation atomicity, privacy defaults, or schema meaning are major
changes unless a new versioned contract preserves the old one.

## Current compatibility decisions

The following compatibility names remain supported in 2.0: legacy redaction
string targets, `toFamilyGroups()`, `toFlatObject()`,
`toExifReaderCompatible()`, and `toExifrCompatible()`. They are intentionally
lossy or legacy adapters and are documented as such; they do not constrain the
lossless result model. No warning or type change is introduced for them in the
current release.

When a future replacement is ready, the migration guide must state loss,
duplicate policy, conflict behavior, raw-value behavior, and exact version
boundaries. A name is never removed merely for cosmetic consistency.

