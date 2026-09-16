# W05 WebP metadata writing

`rewriteWebpMetadata()` is the transactional WebP metadata writer. It accepts
complete EXIF TIFF payloads, UTF-8 XMP payloads, and complete ICC profiles as
explicit block edits. `editMetadata()` maps normalized EXIF fields, including
orientation, through the existing W02 TIFF graph transaction, so updating one
field retains all other EXIF entries and their TIFF relationships.

The edit policy defaults to `orientation: "preserve"`. An intentional EXIF
orientation set or delete must explicitly request
`policy.orientation: "allow-change"`; the request is recorded in the typed
policy evidence and passed to the W08 verifier. This keeps an accidental
orientation change a verification failure while making an intentional change
auditable.

The writer validates the RIFF boundary, chunk lengths, padding, supported image
layout, VP8/VP8L/VP8X dimensions, animation and alpha relationships, metadata
limits, duplicate policy, and output size. VP8X metadata bits are recalculated
from the resulting EXIF/XMP/ICC chunks. A simple VP8 or VP8L file is promoted
to a legal VP8X extended layout when metadata is added; the original image
chunk remains unchanged. Unknown chunks and odd-length pad bytes are copied
verbatim.

The default duplicate policy is `preserve`: unqualified replacements and
removals address every matching physical chunk. `replace-target` selects the
first, `deduplicate-equivalent` removes redundant singleton metadata, and
`reject` refuses ambiguous unqualified operations. A `blockId` always selects
one physical chunk.

Every result includes a byte-change map and exact preserved payload records for
VP8, VP8L, ALPH, and ANMF chunks. Verification reparses the generated RIFF,
checks dimensions and alpha/animation relationships, and compares every
protected image payload byte-for-byte. Metadata is never passed through an
image decoder or recompressed.

The default `verify` path also returns a W08 `preservation` report with
independent hashes for each protected image chunk, dimensions, animation/image
relationships, and configured color/orientation policy. Pixel equivalence is
never claimed because the package does not decode pixels. `verify: false` is an
explicit raw-writer opt-out and returns `preservation: null`.

The orientation regression gate writes every VP8, VP8L, and VP8X result to a
temporary file and checks it with ExifTool 13.59 through the pinned
`exiftool-vendored` 38.1.0 package (ExifTool's Perl Artistic License/GPL
licensing and the wrapper's MIT license). ExifTool is a secondary metadata
oracle only: package reparsing asserts 2x2 dimensions for every path, while the
oracle is required to report no errors and the expected orientation and Make
values. The minimal synthetic VP8L oracle does not expose height, so that
unavailable value is not treated as a comparison match. No generated image
files are retained.
