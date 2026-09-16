# IPTC official reference-image conformance

Status: **pass**. Both official images were required, hash-verified, serialized through the W06 writers, reparsed, and semantically compared; this report contains hashes and metadata evidence only, not image bytes.

- Package: `browser-image-metadata@2.0.0-alpha.3`
- Normalization: Lossless semantic candidates are normalized into sorted JSON object keys; RDF array order, language alternatives, lexical values, nested resources, IIM/XMP repetitions, conflicts, and packet/block/offset provenance remain ordered evidence. Physical offsets are compared only for validity after writing, never for semantic equality.
- Serialization policy: Parse the complete supported official IIM/XMP view, serialize each XMP packet and each IPTC resource through the package writers, replace only those JPEG metadata blocks, reparse, and compare stable semantic candidates. No source or output image is retained in the repository.
- Source manifest: `data/iptc/reference-images.json`
- Executed: 2026-09-16T23:08:33.698Z

| Edition | Image | Source SHA-256 | Parsed properties | Candidates | Round-tripped properties | Round-trip | Serialized output SHA-256 |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| 2023.1 | IPTC-PhotometadataRef-Std2023.1.jpg | 6031119963955cfc142301a0b918a5559dfd367122bfd2ea2bfa0ad733eb57d9 | 62/62 | 86 | 62/62 | pass | 8b710bb1df322f591820a772398b73db76dde0f72f3a533ce9ff4243bed99912 |
| 2025.1 | IPTC-PhotometadataRef-Std2025.1.jpg | c5db0ba76bb4a495485334491d57b3b55cf8a151a79f0c7cc7865321fa3c0027 | 66/66 | 90 | 66/66 | pass | 9c7b38a7813cb951b7319e30427b78faa1a77738894cbf7359914c21229cf0b2 |

## 2023.1
- Source: 140385 bytes, `6031119963955cfc142301a0b918a5559dfd367122bfd2ea2bfa0ad733eb57d9`
- Standard: IPTC Photo Metadata Standard 2023.1
- Semantic hash before/after: `ebe00e6ed8052e4207fa894f8f6de58226a52327cbc8bb6f9a62f741569b4539` / `ebe00e6ed8052e4207fa894f8f6de58226a52327cbc8bb6f9a62f741569b4539`
- Serialized output: 135586 bytes, `8b710bb1df322f591820a772398b73db76dde0f72f3a533ce9ff4243bed99912` (not retained)
- Coverage: {"before":{"supportedPropertyCount":62,"presentPropertyCount":62,"candidateCount":89,"conflictCount":20,"invalidCandidateCount":4,"unsupportedCandidateCount":0,"versionSpecificProperties":[],"shape":{"arrays":91,"languageAlternatives":33,"structuredResources":37,"qualifiers":0,"nestedProperties":185}},"after":{"supportedPropertyCount":62,"presentPropertyCount":62,"candidateCount":89,"conflictCount":20,"invalidCandidateCount":4,"unsupportedCandidateCount":0,"versionSpecificProperties":[],"shape":{"arrays":91,"languageAlternatives":33,"structuredResources":37,"qualifiers":0,"nestedProperties":185}}}
- Provenance before/after: {"candidateCount":89,"withBlockId":89,"withOffset":89,"withLength":89,"invalid":0} / {"candidateCount":89,"withBlockId":89,"withOffset":89,"withLength":89,"invalid":0}
- Unsupported source properties: none
- Diagnostics: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/ArtworkOrObject -> artworkOrObjects: ArtworkOrObject.currentCopyrightOwnerIdentifier must be an absolute URI. ArtworkOrObject.currentLicensorIdentifier must be an absolute URI. ArtworkOrObject.sourceInventoryUrl must be an absolute URI., INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/RegistryId -> registryEntries: RegistryEntry.role must be an absolute URI. RegistryEntry.role must be an absolute URI., INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/LinkedEncRightsExpr -> linkedEncRightsExprs: LinkedEncRightsExpr.rightsExprEncType must be an absolute URI., INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/ProductInImage -> productsShown: ProductWGtin.identifiers must be an absolute URI..

## 2025.1
- Source: 144752 bytes, `c5db0ba76bb4a495485334491d57b3b55cf8a151a79f0c7cc7865321fa3c0027`
- Standard: IPTC Photo Metadata Standard 2025.1
- Semantic hash before/after: `00e549bf54bd1c97ed0f0d2bc22a8327b9c92601eee1b1ef406c9fc9fa535be8` / `00e549bf54bd1c97ed0f0d2bc22a8327b9c92601eee1b1ef406c9fc9fa535be8`
- Serialized output: 139923 bytes, `9c7b38a7813cb951b7319e30427b78faa1a77738894cbf7359914c21229cf0b2` (not retained)
- Coverage: {"before":{"supportedPropertyCount":66,"presentPropertyCount":66,"candidateCount":93,"conflictCount":20,"invalidCandidateCount":4,"unsupportedCandidateCount":0,"versionSpecificProperties":["iptc:aIPromptInformation","iptc:aIPromptWriterNam","iptc:aISystemUsed","iptc:aISystemVersionUsed"],"shape":{"arrays":91,"languageAlternatives":33,"structuredResources":37,"qualifiers":0,"nestedProperties":188}},"after":{"supportedPropertyCount":66,"presentPropertyCount":66,"candidateCount":93,"conflictCount":20,"invalidCandidateCount":4,"unsupportedCandidateCount":0,"versionSpecificProperties":["iptc:aIPromptInformation","iptc:aIPromptWriterNam","iptc:aISystemUsed","iptc:aISystemVersionUsed"],"shape":{"arrays":91,"languageAlternatives":33,"structuredResources":37,"qualifiers":0,"nestedProperties":188}}}
- Provenance before/after: {"candidateCount":93,"withBlockId":93,"withOffset":93,"withLength":93,"invalid":0} / {"candidateCount":93,"withBlockId":93,"withOffset":93,"withLength":93,"invalid":0}
- Unsupported source properties: none
- Diagnostics: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/ArtworkOrObject -> artworkOrObjects: ArtworkOrObject.currentCopyrightOwnerIdentifier must be an absolute URI. ArtworkOrObject.currentLicensorIdentifier must be an absolute URI. ArtworkOrObject.sourceInventoryUrl must be an absolute URI., INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/RegistryId -> registryEntries: RegistryEntry.role must be an absolute URI. RegistryEntry.role must be an absolute URI., INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/LinkedEncRightsExpr -> linkedEncRightsExprs: LinkedEncRightsExpr.rightsExprEncType must be an absolute URI., INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/ProductInImage -> productsShown: ProductWGtin.identifiers must be an absolute URI..

Diagnostics are retained standards-validation findings; they do not make an invalid lexical value valid, and raw/lexical representations remain in the JSON evidence.
