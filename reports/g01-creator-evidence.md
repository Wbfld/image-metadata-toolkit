# G01 creator metadata evidence

- Status: **passed**
- Package: browser-image-metadata 2.0.0-alpha.3
- Schema: creator-metadata/1
- Source manifest: [data/creator-schema-sources.json](../data/creator-schema-sources.json)

| Case | Format | Bytes | SHA-256 | Sources | Fields | Workflows | Complete | Provenance |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- | --- |
| comfyui-png-prompt | png | 437 | 39ed1630523c815e19a217e48e7d68c0b04d67bd9e67c4390d687b59e81040db | 1 | 7 | 1 | yes | complete |
| stable-diffusion-webui-parameters | png | 181 | 04ecd53df1c6973cbe4fa7212c7517c083bda29e0c8dc44d24202f426831c282 | 1 | 6 | 0 | yes | complete |
| invokeai-json | png | 242 | cb0e699ab1e8ba9bdfcb7d562facce7aa9e0f525a38d39528dd2a420dda5cf12 | 1 | 6 | 0 | yes | complete |
| comfyui-webp-exif | webp | 438 | f11221373e8f9de59de60df0f2bed15126ae9885a46b0b37fa749edcebbd3d9e | 2 | 14 | 2 | yes | complete |

## Executed checks

- typed fields
- bounded workflow nodes and edges
- PNG text/custom chunk provenance
- WebP EXIF provenance
- raw retention and opt-out
- IPTC 2025.1 migration opt-in
- malformed JSON
- graph limit

Negative and limit cases were executed and failed closed. The report excludes fixture bytes and raw prompt text.
