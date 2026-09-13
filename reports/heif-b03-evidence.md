# HEIF/AVIF B03 sequence evidence

- Status: **pass**
- Package: `browser-image-metadata@2.0.0-alpha.3`
- Source manifest: `data/heif/sources.json` (SHA-256 `ef693cbec24915982a5b30e1eb1a0c2ff13bfd210396e36daf0cd891c54ade4c`)
- Cases: 6 (all passed)
- Pixel policy: structural sequence inspection only; sample payloads were not copied or decoded.

| Case | Fixture path | Bytes | SHA-256 | Sequences | Tracks | Samples | Primary selection | Complete | Status |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- | --- | --- |
| unfragmented-independent-picture-and-metadata-tracks | generated://heif-b03/unfragmented-independent-picture-and-metadata-tracks.bin | 1027 | `85148dd11cebe02de00fd60a536cdd492c85197a832becac5d3c4dfe31961081` | 1 | 2 | 4 | sole-picture-track | true | passed |
| ambiguous-multiple-picture-tracks | generated://heif-b03/ambiguous-multiple-picture-tracks.bin | 1501 | `ff67598fab6a58ce0728611040c6bc659b9e379f32c903e45191928c97f2a23e` | 1 | 3 | 7 | ambiguous-picture-tracks | true | passed |
| avif-sequence-primary-track | generated://heif-b03/avif-sequence-primary-track.bin | 1027 | `8b0c65154586c14627e81c10fff26f5dca394af5d7355d802590b45550c5d5b9` | 1 | 2 | 4 | sole-picture-track | true | passed |
| fragmented-picture-samples | generated://heif-b03/fragmented-picture-samples.bin | 639 | `18f7c9f4b456a7e8caf66ad696f1847bbe6f86c11a8a973334bbb4b6e75faf1b` | 1 | 1 | 2 | sole-picture-track | true | passed |
| truncated-top-level-data | generated://heif-b03/truncated-top-level-data.bin | 1024 | `ef9bce20d238902dc236007e6cfec1de1ea7764181c421888ea1e64958470949` | 1 | 2 | 4 | sole-picture-track | false | passed |
| bounded-sample-limit | generated://heif-b03/bounded-sample-limit.bin | 1027 | `85148dd11cebe02de00fd60a536cdd492c85197a832becac5d3c4dfe31961081` | 1 | 2 | 3 | sole-picture-track | false | passed |

## Retained model and limits

- one result-level primary view plus a bounded collection of independent sequences, tracks, sample descriptions, samples, transformations, edits, references, and metadata associations.
- a primary track is selected only when a sequence has exactly one picture track; multiple picture tracks remain candidates and produce ambiguous-picture-tracks.
- item-graph relationships and track references remain separate; cdsc/meta track references are reverse-linked to the referenced picture track without flattening item metadata.
- malformed, truncated, unsafe, unsupported, or over-limit structures remain returned with typed diagnostics and complete=false.
- safe-integer arithmetic, bounded box/track/table/sample/relationship counts, bounded strings, bounded warning output, and no payload allocation.
- The report records fixture paths, byte lengths, SHA-256 values, package version, source-manifest hash, primary candidates, track/sample summaries, provenance-bearing fragment samples, and warning codes without storing fixture payloads.
