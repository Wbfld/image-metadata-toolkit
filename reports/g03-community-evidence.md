# G03 community-program evidence

- Status: **passed**
- Package: browser-image-metadata 2.0.0-alpha.3
- Evidence version: g03-community-program/1

## Executed fixture scrubber

- Source: base.png
- Source SHA-256: d2eb7e9208ea23ead0947738e379f7d6b356480370e6865960a1751203ad3fc0
- Inspection complete: yes
- Policy-safe output generated: yes
- Output re-audited: yes
- Configured-limit refusal: yes

The scrubber report and this evidence exclude raw metadata values, absolute paths, and image bytes.

## Schema validation

- JSON Schema: schemas/community-tag-data.schema.json
- Schema SHA-256: 4b2496e0178f6c471a461164c04cbb4830c8404e0dfd772f6acf6414858433f9
- Required tag fields: id, name, label, description, family, type, sensitivity, rawValueBehavior, validationRules
- Maximum tag definitions: 4096

## Program artifacts

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| COMMUNITY_PROVENANCE_TEMPLATE.md | 1522 | 419a1598614e814b718cc322da9f8b3db33a4a14a6d1338072a8fb5f1d7b459e |
| COMMUNITY_REVIEW_CHECKLIST.md | 2267 | 121a36635f0cd2b39daa73f12054e8c67f10b738d9e7f4f94398e554f92174da |
| COMMUNITY_CONTRIBUTOR_TICKETS.md | 1334 | 48eccfa10d8cfe3eb19baf38f242a11a8e305f44a3a8c96a3c7b4a223b63000d |
| COMMUNITY_SUPPORT_POLICY.md | 1092 | a89d747f4c656953d058d99e0b3fa0a0ee29d4fae355d6e3445a6a0ee1f5419d |
| community/plugin-template.ts | 3530 | 2ae37e53a36b457b67804ed40a84d90a2ee7dcd9e479a9545ce5e19023651b79 |
| schemas/community-tag-data.schema.json | 2558 | 4b2496e0178f6c471a461164c04cbb4830c8404e0dfd772f6acf6414858433f9 |
| scripts/fixture-scrubber.mjs | 6455 | 8312ae88882ffec88f51c6784c5960f721f529cefb04e76b4e1e2a90a9614508 |

The contributor workflow is intentionally isolated: provenance, scrubber review, bounded tag data, plugin contracts, security handling, and response targets are documented independently. No third-party fixture bytes are retained by this report.
