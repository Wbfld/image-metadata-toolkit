# T04 official C2PA adapter integration evidence

Status: **passed**

This report is generated only by the real pinned official SDK adapters. T03 inventory is not used as a verification substitute.

Fixture: `contentauth-example-firefly-tabby-cat` (1047024 bytes, SHA-256 `bdc5c19d4211d9c9f9f8dce5bf4e4dec29e9b32e308ff12a60979481e928154f`)
Node SDK: `@contentauth/c2pa-node@0.9.5` (MIT)
Browser SDK: `@contentauth/c2pa-web@0.14.6` (MIT)

## Cases

- Node valid: `official:valid`; invalid: `official:invalid`; no manifest: `official:no-manifest`; unsupported: `adapter:unsupported`.
- Browser fixture: `official:valid`; complete official result retained: `true`.

## Reproducibility

- Source and license: [https://github.com/contentauth/example-assets](https://github.com/contentauth/example-assets)
- Release provenance: [Node](https://github.com/contentauth/c2pa-js/releases/tag/@contentauth%2Fc2pa-node%400.9.5), [browser](https://github.com/contentauth/c2pa-js/releases/tag/@contentauth%2Fc2pa-web%400.14.6).
- Remote manifest fetching was disabled; the fixture was downloaded only into temporary storage and is not copied into this report.
- Official SDK diagnostics and result objects remain available from the JSON report’s execution result; this compact report records only typed summaries.

