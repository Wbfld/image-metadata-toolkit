# T03 terminology review packet

This is an implementation audit packet, not human approval. It records the public symbols and the terminology policy applied to them. No self-review is presented as the roadmap's required human terminology approval.

| Public surface | Inventory-only terminology and behavior |
| --- | --- |
| `inventoryC2pa` | Returns `C2paInventoryResult`; uses `detected`, `stores`, `relationships`, `structuralStatus`, `mutationRisk`, and `remoteReferencesFetched: false`. |
| `inventoryJumbfC2pa` | Same inventory contract over materialized bytes; no verification or network operation. |
| `C2paInventoryStatus` | `not-present`, `detected`, `malformed`, `limited`, `unsupported`; no trust or authenticity state. |
| `C2paInventoryStore` | Exact range, payload range, container, parent, references, and `inventoried`/`malformed`/`opaque` structure state. |
| `C2paInventoryRelationship` | Manifest, remote, duplicate, or unresolved relationship inventory only. |
| `C2paMutationPolicy` | Explicit `refuse`, `preserve`, or `invalidate` mutation choice. Unsupported invalidation fails closed. |
| JPEG/PNG/WebP writers | Call the inventory mutation guard before allocating output; default C2PA-bearing input refusal is documented. |
| T04 adapters | Separate `official:*` verification statuses and `verifiedBy: "official-sdk"`; these names belong only to official adapter results and never to T03 inventory. |

The source audit searched public source, API documentation, README, capabilities, tests, reports, and examples for verification terminology attached to T03 inventory. Any use of `valid` in a T03 test description is limited to a structurally well-formed fixture and is not an API state or verification claim. T04's `official:valid` status is intentionally namespaced and belongs to the official SDK adapter layer.

The executable review is covered by `tests/trust-t03.test.ts`, the package terminology/export checks, and the T04 integration report. A human reviewer must still approve this packet before the T03 governance gate can be marked approved.
