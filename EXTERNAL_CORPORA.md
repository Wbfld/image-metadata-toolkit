# browser-image-metadata external fixture corpora

The repository keeps its small, targeted fixtures under version control. Broader camera interoperability coverage runs from a pinned public source so the npm package and this repository do not redistribute image assets with mixed upstream licenses.

## exif-py resource corpus

The scheduled interoperability workflow checks out [`ianare/exif-py`](https://github.com/ianare/exif-py) at commit `a69bf74770caf6b333221658f5092ed69f99faac` and runs its `tests/resources` directory through this package and pinned ExifTool. At that revision, the directory contains 108 supported JPEG, TIFF, HEIF, and HEIC files: camera-vendor, mobile, HDR, GPS, orientation, XMP, malformed, and legacy samples.

The upstream resource README says user-contributed samples are CC BY-SA 4.0 and that other samples are generally derived from Wikimedia Commons; its directory-level notes identify exceptions and direct maintainers to original author and license pages. The workflow does not copy or publish those resources. Any fixture promoted into this repository must still meet the provenance requirements in `CONTRIBUTING.md`, including its individual redistribution terms, source, SHA-256, and independently established expectation.

Run the corpus locally after obtaining that exact upstream checkout:

```sh
npm ci
EXTERNAL_FIXTURE_ROOT=/path/to/exif-py/tests/resources npm run test:corpus
```

The gate requires at least 100 supported files and compares the checked-in
registry in [`scripts/external-registry.json`](./scripts/external-registry.json):
standardized EXIF fields, dimensions, metadata-family block presence, and
selected XMP/IPTC values. Every comparison is counted as found, matched,
normalized-match, mismatched, missing-local, or missing-reference, both overall
and per producer. Missing local values are counted rather than skipped; the
default gate fails above a 5% missing-local rate
(`EXTERNAL_CORPUS_MAX_MISSING_LOCAL_RATE` can tighten or relax this explicitly).

Each run writes `external-corpus-report.json` and
`external-corpus-report.md` under `EXTERNAL_CORPUS_OUTPUT_DIR` (default
`artifacts/external-corpus`). Reports include relative fixture names and exact
SHA-256 hashes, never image bytes. The reviewed exception schema is
[`scripts/external-allowlist.json`](./scripts/external-allowlist.json); every
entry must include `issueUrl` and `expiryVersion` (semver). The comparator and gate are
tested independently, including a deliberately missing decoder field that must
fail the gate.
