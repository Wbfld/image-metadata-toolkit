# IPTC official reference-image conformance

Status: **pass**. Both official images were required, hash-verified, and parsed; this report contains hashes and metadata evidence only, not image bytes.

- Package: `browser-image-metadata@2.0.0-alpha.3`
- Normalization: Lossless semantic candidates are normalized into sorted JSON object keys; RDF array order, language alternatives, lexical values, nested resources, IIM/XMP repetitions, conflicts, and packet/block/offset provenance remain ordered evidence.
- Source manifest: `data/iptc/reference-images.json`
- Executed: 2026-09-12T19:29:48.375Z

| Edition | Image | SHA-256 | Properties | Candidates | Normalized semantic hash |
| --- | --- | --- | ---: | ---: | --- |
| 2023.1 | IPTC-PhotometadataRef-Std2023.1.jpg | 6031119963955cfc142301a0b918a5559dfd367122bfd2ea2bfa0ad733eb57d9 | 62/62 | 86 | a3a9fd19bc92b2466830f8644d243f8d580ec272f27e16536b368a4baa813104 |
| 2025.1 | IPTC-PhotometadataRef-Std2025.1.jpg | c5db0ba76bb4a495485334491d57b3b55cf8a151a79f0c7cc7865321fa3c0027 | 66/66 | 90 | 5f7477ec275474284376546b60976f788bfb3e886805aa89efe732931c24ee7c |

Diagnostics: `2023.1: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/ArtworkOrObject -> artworkOrObjects: ArtworkOrObject.currentCopyrightOwnerIdentifier must be an absolute URI. ArtworkOrObject.currentLicensorIdentifier must be an absolute URI. ArtworkOrObject.sourceInventoryUrl must be an absolute URI.`, `2023.1: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/RegistryId -> registryEntries: RegistryEntry.role must be an absolute URI. RegistryEntry.role must be an absolute URI.`, `2023.1: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/LinkedEncRightsExpr -> linkedEncRightsExprs: LinkedEncRightsExpr.rightsExprEncType must be an absolute URI.`, `2023.1: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/ProductInImage -> productsShown: ProductWGtin.identifiers must be an absolute URI.`, `2025.1: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/ArtworkOrObject -> artworkOrObjects: ArtworkOrObject.currentCopyrightOwnerIdentifier must be an absolute URI. ArtworkOrObject.currentLicensorIdentifier must be an absolute URI. ArtworkOrObject.sourceInventoryUrl must be an absolute URI.`, `2025.1: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/RegistryId -> registryEntries: RegistryEntry.role must be an absolute URI. RegistryEntry.role must be an absolute URI.`, `2025.1: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/LinkedEncRightsExpr -> linkedEncRightsExprs: LinkedEncRightsExpr.rightsExprEncType must be an absolute URI.`, `2025.1: INVALID_VALUE:XMP http://iptc.org/std/Iptc4xmpExt/2008-02-29/ProductInImage -> productsShown: ProductWGtin.identifiers must be an absolute URI.`.
