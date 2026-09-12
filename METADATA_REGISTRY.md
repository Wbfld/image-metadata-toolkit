# Metadata registry

`browser-image-metadata` keeps its EXIF/TIFF vocabulary in [`data/metadata-registry.json`](data/metadata-registry.json), rather than scattering tag definitions across parser code. The source schema records stable IDs, IFD/family, numeric tags, legal TIFF types, cardinality, standard version, aliases, enum/bitfield metadata, sensitivity, validation, write policy, and provenance.

Run `npm run registry:generate` after changing the source. CI runs `npm run registry:check` and fails if the compact runtime indexes are stale, non-deterministic, or contain duplicate IDs, names, aliases, or tag locations. The public API exposes the generated `MetadataFieldName` union; constructed registries and their nested records are immutable.

The built-in registry has the complete CIPA DC-008-Translation-2026 (Exif 3.1) vocabulary: 165 TIFF, Exif, GPS, and interoperability definitions. It records the Exif-specific type 129 (`UTF-8`), exact legal cardinalities, Exif 3.0 lineage fields, Exif 3.1 learning/development/correction fields, the expanded LightSource enum, and reviewed sensitivity/write-policy classifications. Generated `enumValues` and `bitfield` entries carry standard meanings for orientation, compression, photometric interpretation, exposure programs, metering, processing, GPS references/status, and the CIPA Flash bit field. Raw numeric/byte values remain available when an enum is reserved; the parser emits a diagnostic instead of guessing. Applications can create an isolated registry and pass it to any parse operation:

```ts
import { createMetadataRegistry, parseMetadata } from "browser-image-metadata";

const registry = createMetadataRegistry([{
  id: "IFD0:0x010f",
  ifd: "IFD0",
  tag: 0x010f,
  name: "CameraBrand",
  description: "Application-specific camera brand label",
}]);

const result = await parseMetadata(bytes, { registry });
```

Registries are deeply frozen at construction. They are selected per parse and never mutate the built-in registry or another concurrent parse. A custom definition can intentionally replace a standard name; unknown tags remain safely retained with the normal unknown-tag behavior.

Directory topology is intentionally separate from the vocabulary registry. The
S04 traversal follows the TIFF 6.0 and BigTIFF directory rules and the CIPA
DC-008 EXIF pointer relationships for ExifIFD, GPSInfoIFD, InteropIFD, and
SubIFDs. Directory identities, offsets, parent/next links, shared references,
and associated-image roles are parser provenance rather than tag semantics;
strip/tile payload offsets are never interpreted as directories.

Structured XMP follows ISO 16684-1:2019 (second edition) and Adobe's XMP
Specification Parts 2 (February 2022) and 3 (January 2020), with
well-formedness and RDF/XML namespace rules from W3C Namespaces in XML 1.0
(Third Edition), RDF 1.1 XML Syntax, and RDF 1.1 Concepts. It is deliberately separate
from the EXIF registry: unknown XMP namespaces and properties retain their URI,
local name, prefix hint, lexical value, qualifiers, ordering, and packet
provenance. `mergeStructuredXmp()` preserves all candidates and reports
conflicts; it never applies source precedence implicitly. The core does not
perform sidecar-file I/O, but callers may supply sidecar provenance to the
merge API.

Pinned references: [ISO 16684-1:2019](https://www.iso.org/standard/75163.html),
[Adobe XMP specifications](https://developer.adobe.com/xmp/docs/xmp-specifications/),
[Namespaces in XML 1.0](https://www.w3.org/TR/REC-xml-names/),
[RDF 1.1 XML Syntax](https://www.w3.org/TR/rdf-syntax-grammar/), and
[RDF 1.1 Concepts](https://www.w3.org/TR/rdf11-concepts/).

## IPTC Photo Metadata semantic vocabulary (S06)

The generated [`src/generated/iptc-pmd.ts`](src/generated/iptc-pmd.ts) is built
only from IPTC's official machine-readable TechReference. The pinned 2025.1
source is [iptc-pmd-techreference_2025.1.json](https://iptc.org/std/photometadata/specification/iptc-pmd-techreference_2025.1.json),
released 2025-11-04, licensed CC BY 4.0, SHA-256
`592c37b01fe02c7333cd7059a212bdceee13c1147ad7bcc6dbe996ba433128a8`.
Compatibility provenance is retained for the previous official 2023.1 source,
SHA-256 `6ce036311ac30a8b0755029870b3b508061e17bc69206ac0949315b4b8ebe49f`.
Run `npm run iptc:generate` to regenerate and `npm run iptc:check` to verify
determinism and the pinned hash. The semantic layer is additive: it preserves
legacy `IptcData.fields`, while `iptcSemantic` retains all IIM/XMP candidates,
source occurrences, URI/local-name identity, validation diagnostics, and
explicit conflicts. Unknown XMP properties are never used as vocabulary
definitions and remain covered by the conservative RAW_XMP privacy result.
Official reference-image evidence is hash-pinned in
[`data/iptc/reference-images.json`](data/iptc/reference-images.json) without
redistributing the upstream files. Download the two files from their listed
IPTC URLs into a private directory and run
`IPTC_REFERENCE_CORPUS_DIR=/path/to/images npm run iptc:reference`; the runner
verifies both SHA-256 hashes and requires non-empty semantic output. The normal
CI fixture remains locally generated/redistributable and does not depend on a
network request.

## ICC payload provenance (S07)

The ICC decoder is implemented from International Color Consortium
Specification ICC.1:2022 (profile version 4.4.0.0), document
`ICC.1-2022-05.pdf`, accessed 2026-09-12 from
`https://www.color.org/specification/ICC.1-2022-05.pdf`. The downloaded source
SHA-256 is
`aad8e33128635893e38ae780def3b29e661e4541be03cb235c67dd94d558001b`.
ICC tag and type signatures are identified by their four-byte signatures; no
competitor table is included. The source specification is copyright ICC and is
used as an interoperability reference, not redistributed.

The decoder preserves unknown type ranges and implements bounded common text,
legacy `desc`, MLUC, XYZ, sampled and parametric curves, fixed-point matrices,
measurement, viewing condition, colorant, signature, and LUT-header
inspection. Exact shared payload ranges are decoded through one bounded path;
partial overlaps are marked invalid and never decoded as trusted data. Applying
LUTs or other colour transforms remains outside this package.

The opt-in differential runner is `npm run icc:reference`. It requires the
complete local directory of `.icc`/`.icm` files listed by SHA-256 in
`ICC_REFERENCE_CORPUS_DIR` and `data/icc/reference-corpus.json`; missing,
partial, or hash-different corpora fail. Each profile is embedded only in a
temporary generated JPEG for this package's standards-based parser, then
ExifTool 13.42 (through pinned `exiftool-vendored` 33.5.0) is queried as an
independent output oracle. The runner compares header version/class/space/PCS/
date, localized description and copyright, XYZ white point and colorants,
technology, measurement and viewing-condition values, TRC byte-length
structure, and LUT byte-length structure where exposed by both tools. It
records profile-relative parser tags, semantic comparisons, warnings, explicit
non-comparable values, normalization policy, tool license/provenance, and
every input SHA-256 without copying profile bytes to the repository.

The checked evidence run on 2026-09-12 covered all 14 pinned profiles: 263
candidate values were found, 201 were comparable and matched after documented
normalization, 68 were explicitly non-comparable, and 0 mismatched. All 14
profiles were complete. Reports are checked in at
[`reports/icc-reference-report.json`](reports/icc-reference-report.json) and
[`reports/icc-reference-report.md`](reports/icc-reference-report.md); the
workflow runs the same gate on macOS and uploads both reports. A
redistributable fixture check remains in `tests/s07-s09-contract.test.ts` for
every supported payload family and malformed/overlap behavior.
