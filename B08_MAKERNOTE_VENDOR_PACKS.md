# B08 MakerNote vendor packs

The seven B08 packs are independent, stateless implementations of the B07
MakerNote plugin contract. They are not imported by the package root and they
do not register themselves globally. A caller explicitly imports the pack it
needs and supplies it to one parse operation:

```ts
import { parseMetadata } from "browser-image-metadata";
import appleMakerNotePlugin from "browser-image-metadata/makernote/apple";

const result = await parseMetadata(bytes, {
  select: { groups: ["MakerNote"] },
  makerNotePlugins: [appleMakerNotePlugin],
});
```

The public pack entry points are:

| Pack | Entry point | Identity | Layout coverage |
| --- | --- | --- | --- |
| Apple | `browser-image-metadata/makernote/apple` | `org.browser-image-metadata.makernote.apple@1.0.0` | Apple iOS big-endian bounded directory |
| Canon | `browser-image-metadata/makernote/canon` | `org.browser-image-metadata.makernote.canon@1.0.0` | Canon direct little-endian bounded directory |
| Nikon | `browser-image-metadata/makernote/nikon` | `org.browser-image-metadata.makernote.nikon@1.0.0` | Nikon Type 2 little-endian and Type 3 big-endian embedded TIFF directory |
| Sony | `browser-image-metadata/makernote/sony` | `org.browser-image-metadata.makernote.sony@1.0.0` | Sony direct bounded directory variants identified by directory structure |
| Fujifilm | `browser-image-metadata/makernote/fujifilm` | `org.browser-image-metadata.makernote.fujifilm@1.0.0` | Fujifilm RAF little-endian four-byte-count directory |
| Panasonic/Leica | `browser-image-metadata/makernote/panasonic-leica` | `org.browser-image-metadata.makernote.panasonic-leica@1.0.0` | Panasonic MakerNote nested in the RW2 embedded JPEG carrier |
| Pentax | `browser-image-metadata/makernote/pentax` | `org.browser-image-metadata.makernote.pentax@1.0.0` | Pentax little-endian four-byte-count directory |

## Contract and safety

Each pack declares its stable identity, model and layout scope, detection
confidence, byte order, offset base, supported security behavior, source
references, and generated tag registry. The registry is immutable at runtime.
Duplicate IDs or tag numbers are rejected when a pack is constructed and the
host validates all plugin output before exposing it.

Each registry entry carries its own applicable model list (inherited from the
pack only when the entry has no narrower declaration), applicable pack-version
list, repeatability, type, optional unit/enumeration semantics, a bounded
validation rule, sensitivity, raw-value behavior, and source reference. The
factory derives this registry in stable input order and rejects duplicate tag
or field identities before an export is created.

The host gives a pack only a copied byte range for one MakerNote value. Reads,
read requests, entries, values, strings, opaque ranges, diagnostics, and
returned collections are bounded by `SecurityLimits`. Offsets are note-relative
and each decoded field retains the original source-file offset and enclosing
block/field identity. Unknown, unsupported, malformed, encrypted, or
low-confidence portions remain opaque and fail closed for privacy purposes.
No pack performs filesystem, network, pixel, or RAW-development work.

The Sony and Nikon implementations deliberately use structural evidence for
variants that do not have one universal vendor prefix. A structure is accepted
only when its bounded count, entry table, byte order marker, and expected
vendor-specific tag shape agree. A wrong-vendor or ambiguous structure remains
unknown rather than being guessed from the camera Make field.

## Sources and fixtures

Definitions and layouts are repository-authored from the pinned Exiv2 MakerNote
documentation as a corroborating reference and from independently inspected
real files. No ExifTool, Exiv2, ExifReader, exifr, dcraw, or LibRaw code or tag
table is copied into the package. Source metadata, retrieval date, license,
hashes, and every fixture URL are retained in
[`data/makernote-b08-sources.json`](data/makernote-b08-sources.json).

The real fixtures are CC0-declared files from raw.pixls.us and are intentionally
not stored in this repository. The evidence command requires callers to place
the hash-verified files in a temporary corpus directory and fails when any
file is absent or changed. It records only paths, lengths, hashes, decoded
identities, normalized value hashes, counts, and diagnostics; it does not copy
image bytes into reports.

The secondary oracle is `exiftool-vendored` 38.1.0 with bundled ExifTool 13.59
(MIT wrapper; Artistic License 2.0/GPL-1.0-or-later tool). It is used only to
compare output values and presence after the B08 pack has independently parsed
the source. A null or unavailable oracle value is explicitly non-comparable,
never a match.

The evidence command also checks dimensions when both implementations expose
the same primary image interpretation. Apple DNG and Panasonic RW2 fixtures
are explicitly recorded as non-comparable for dimensions because the package
and the oracle select different container-level primary images (preview versus
sensor image), and the report retains that reason rather than treating either
interpretation as a mismatch. This is a limitation of the dimension oracle,
not a MakerNote field match.

## Evidence and test commands

The focused suite covers every pack's public export, source/registry
immutability, wrong-vendor isolation, ambiguous detection, truncation, unsafe
counts and offsets, invalid text, duplicate plugin registration, and MakerNote
selection. The real corpus gate is:

```sh
MAKERNOTE_B08_CORPUS_DIR=/temporary/hash-verified-corpus npm run test:makernote-b08
```

The gate requires two real fixtures per vendor group, verifies every manifest
hash and byte length, runs every pack independently through the normal parse
API, compares all fields for which the independent oracle exposes a stable
counterpart, and emits:

- `reports/makernote-b08-evidence.json`
- `reports/makernote-b08-evidence.md`

The reports include per-pack and per-fixture decoded, opaque, diagnostic,
matched, normalized-match, mismatch, missing-local, missing-reference, and
non-comparable counts, source and tool provenance, registry hashes, and the
normalization policy. The JSON report retains a complete hash-only record for
every comparison, including the reason for every non-comparable value. The
gate also runs the no-plugin control and requires it to remain unknown/opaque,
proving that a missing explicit import cannot pass a vendor-pack acceptance
case.
