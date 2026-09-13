# W06 IPTC/XMP standards serialization

W06 adds standards-aware, deterministic serialization beside the existing
bounded readers and the generated IPTC vocabulary. It does not replace the
2025.1/2023.1 generated data or the URI/local-name semantic mapper.

## Authoritative inputs

The generated vocabulary is pinned to the following source artifacts. The
source files are checked into `data/iptc/` and regeneration refuses to run if
either byte hash changes.

| Source | Edition | URL | License | Retrieved | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| IPTC Photo Metadata TechReference | 2025.1 | <https://iptc.org/std/photometadata/specification/iptc-pmd-techreference_2025.1.json> | CC BY 4.0 | 2026-09-12 | `592c37b01fe02c7333cd7059a212bdceee13c1147ad7bcc6dbe996ba433128a8` |
| IPTC Photo Metadata TechReference | 2023.1 | <https://iptc.org/std/photometadata/specification/iptc-pmd-techreference_2023.1.json> | CC BY 4.0 | 2026-09-12 | `6ce036311ac30a8b0755029870b3b508061e17bc69206ac0949315b4b8ebe49f` |
| IPTC Information Interchange Model | 4.1 | <https://iptc.org/std/IIM/4.1/specification/IIMV4.1.pdf> | IPTC published standard | 2026-09-12 | Wire-format constraints are pinned in the generated IIM catalog and tests |
| RDF/XML syntax | RDF 1.1 | <https://www.w3.org/TR/rdf-syntax-grammar/> | W3C Document License | 2026-09-12 | XML/RDF behavior is exercised from the pinned model and tests |

ExifTool is not used to define the vocabulary or validate RDF/XML. It may be
used by an external interoperability check as a secondary output oracle.

## Generated definitions and validation

`IPTC_TECHREFERENCE_PROPERTIES` contains all 66 Photo Metadata 2025.1
properties, with stable identity, namespace/local-name mapping, type and
format, lengths, cardinality, required status, versions, controlled values,
structured-resource information, validation rules, sensitivity, and raw-value
behavior. `IPTC_IIM_DATASETS` contains every IIM dataset recognised by the
bounded parser, including transport, binary, unknown, and application
datasets. The generator rejects duplicate stable identities and contradictory
namespace mappings; tests assert those invariants for every generated entry.

The reader and serializer retain raw bytes and lexical values when a value is
invalid. IIM dates use actual month/day and leap-year checks; times validate
clock fields and the complete ±14:00 offset range. Lengths are byte lengths,
not JavaScript string lengths. Ordinary IIM lengths are limited to 0x7fff;
the serializer emits the four-byte-safe extended form for larger values when
`allowExtendedLengths` is enabled. Known maximums, repeatability, character
sets, and bounded output/dataset counts are enforced by default. Callers
re-serializing intentionally invalid raw fields must opt into
`invalidValuePolicy: "preserve-raw"`.

## Public serialization API

`serializeStructuredXmp()` serializes either a complete `XmpRdfDocument` or a
legacy `StructuredXmpPacket`. It deterministically plans namespace prefixes by
namespace URI, escapes XML text and attributes, rejects XML 1.0-invalid code
points, preserves lexical values, arrays and their order, `xml:lang`, RDF
resources, blank nodes, typed resources, qualifiers, duplicate properties, and
unknown properties. `serializeXmp` is its short alias. Non-literal qualifiers
use the RDF `rdf:value` qualified-resource form and are parsed back into the
same value model.

`serializeIptcIim()` serializes ordered repeated datasets and raw bytes. It
supports UTF-8, Latin-1, binary, ordinary lengths, and safe extended lengths.
`serializePhotoshopIptcResources()` wraps one or more IIM payloads in padded
Photoshop `8BIM` resource blocks, retaining the multiple-resource model.

`synchronizeIptcXmp()` is explicit by design. `preserve-all` is the default and
reports conflicts without changing either side. `prefer-iim` or `prefer-xmp`
must be requested to project one mapped side onto the other, and
`reject-conflict` throws before serialization. Mapping compares namespace URI
and local name plus IIM record/dataset; prefixes never establish identity.

`chunkExtendedXmp()` returns redistribution-free Adobe Extended XMP payloads,
with a deterministic SHA-256-derived GUID unless the caller supplies one.
Returned chunks carry the full logical length and byte offset and can be
checked with `parseExtendedXmpChunk()`/`reassembleExtendedXmp()`.

## Evidence

`tests/serialization-s06.test.ts` covers all generated XMP mappings, RDF/XML
escaping and round trips, arrays, ordering, language alternatives, nested and
typed resources, qualifiers, IIM ordinary and extended lengths, UTF-8 and raw
invalid bytes, multiple Photoshop resources, explicit conflict policies,
Extended XMP chunking, and output limits. `tests/iptc-s06-semantic.test.ts`
continues to cover the generated definitions, version delta, parser
validation, URI-aware mapping, privacy fail-closed behavior, and bounded
semantic output.

The opt-in command `npm run iptc:reference` is the executable official-image
gate. It requires `IPTC_REFERENCE_CORPUS_DIR`, requires exactly one
hash-matching image for each pinned 2023.1 and 2025.1 edition, serializes the
complete parsed XMP packet and every IPTC-IIM resource through the package
writers, replaces those blocks in a temporary JPEG, reparses the result, and
compares the ordered semantic candidates. The gate fails before producing a
pass report when the corpus directory or either image is missing, a source
hash differs, serialization or reparsing is skipped, or only one edition
participates.

The checked reports are `reports/iptc-reference-conformance.json` and
`reports/iptc-reference-conformance.md`. They retain the two source hashes,
edition and package identity, serialized output hashes (not output bytes),
stable semantic hashes before and after, property and candidate counts,
arrays, language alternatives, nested resources, conflicts, invalid and
unsupported candidates, source block/offset/length provenance, diagnostics,
and the explicit normalization and serialization policies. The latest
verified run reports 62/62 properties and 86 property-level candidates for
2023.1, and 66/66 properties and 90 property-level candidates for 2025.1.
Including the mapped IIM/XMP repetitions represented by those properties, the
semantic evidence contains 89/93 candidates respectively. Both semantic
round trips are equal, and all 89/93 retained candidates have valid block,
offset, and length provenance after writing. The official images and
temporary serialized output are never copied into the repository.
