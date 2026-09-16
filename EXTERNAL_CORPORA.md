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

The gate requires at least 100 supported files and verifies the checkout is
exactly commit `a69bf74770caf6b333221658f5092ed69f99faac`. It compares the
checked-in registry in
[`scripts/external-registry.json`](./scripts/external-registry.json): every
generated registry-supported standardized EXIF field, dimensions,
metadata-family block presence, and selected XMP/IPTC values. Fields are
family-qualified during local lookup and in report aggregation, so same-named
EXIF, XMP, IPTC, and other fields remain distinct. ExifTool is queried in
group-qualified numeric mode (`-G1 -n`) so same-named File, EXIF, XMP, IPTC,
and maker-note values cannot create false matches.

Every comparison is counted as found, matched, normalized-match, mismatched,
missing-local, or missing-reference overall, per field, producer, and format.
Missing local values are counted rather than skipped; the default gate fails
above a 5% missing-local rate. Mismatches fail by default
(`EXTERNAL_CORPUS_MAX_MISMATCHED=0`), and
`EXTERNAL_CORPUS_MAX_MISSING_LOCAL_RATE` can tighten or relax the missing-local
threshold explicitly. A deliberately missing decoder field is covered by the
unit gate test and must fail.

Each run writes `external-corpus-report.json` and
`external-corpus-report.md` under `EXTERNAL_CORPUS_OUTPUT_DIR` (default
`artifacts/external-corpus`). Reports include relative fixture paths, byte
lengths, exact SHA-256 hashes, the verified corpus commit, package and actual
ExifTool versions, registry/allowlist/normalization hashes, and all thresholds;
they never include image bytes. The reviewed exception schema is
[`scripts/external-allowlist.json`](./scripts/external-allowlist.json); every
entry must include an issue URL, a reason, an explicit field/status/producer/
format/fixture scope, and an expiry version (semver). Exceptions stop applying
when the package reaches their expiry version (prereleases remain below the
matching stable version). An empty corpus is a gate failure; `npm run
test:corpus` never reports an unexamined corpus as a successful “not run”.

The redistribution-safe checked-in evidence from the pinned run is
[`reports/f05-external-corpus-evidence.json`](./reports/f05-external-corpus-evidence.json).
It contains the full summary and fixture path/length/hash inventory without
copying upstream images. To emit this compact evidence file for another run,
set `EXTERNAL_CORPUS_EVIDENCE_OUTPUT` alongside `EXTERNAL_FIXTURE_ROOT`.

## Roadmap-wide read gate

The roadmap read gate uses the same pinned exif-py checkout plus the independent
[`imazen/codec-corpus`](https://github.com/imazen/codec-corpus) checkout at
`8e10d4d765667c1c49d74413878fc4bfb46dcf8d`. It scans only the six declared
dataset roots in [`data/external-corpus.json`](./data/external-corpus.json):
JPEG conformance, WebP conformance, TIFF conformance, PNGSuite, HEIC
conformance, and AVIF conformance. The codec-corpus README, top-level license,
and each selected dataset's README/license records are the provenance source;
the manifest records that mixed per-dataset terms apply. The checkouts remain
temporary and are never copied into this repository.

The gate requires 1,000 examined files, 1,000 unique SHA-256 fixture hashes,
100 comparable values, at least 99% semantic agreement, zero parser/oracle
errors, zero unexpected mismatches, and no silently lost metadata-family block.
Malformed values with a typed parser diagnostic are reported as
`non-comparable`, not as matches. All six comparison statuses, including
`missing-reference`, remain visible in overall, field, producer, format,
corpus, and metadata-family aggregates. ExifTool is queried only as the
group-qualified numeric output oracle; the package registry and parser remain
the implementation under test.

Run it after placing both pinned repositories in temporary storage:

```sh
EXTERNAL_CORPUS_ROOTS_JSON='{"ianare-exif-py":"/tmp/exif-py","imazen-codec-corpus":"/tmp/codec-corpus"}' \
EXTERNAL_CORPUS_OUTPUT_DIR=artifacts/external-corpus-roadmap \
EXTERNAL_CORPUS_EVIDENCE_OUTPUT=reports/roadmap-read-corpus-evidence.json \
npm run test:corpus:roadmap-read
```

The checked redistribution-safe summaries are
[`reports/roadmap-read-corpus-evidence.json`](./reports/roadmap-read-corpus-evidence.json)
and [`reports/roadmap-read-corpus-evidence.md`](./reports/roadmap-read-corpus-evidence.md).
The JSON records both corpus revisions, license/provenance records, package
and ExifTool versions, registry/allowlist/normalization hashes, every fixture
identity/length/hash, registry 3.1 definition evidence, capability evidence,
thresholds, and all aggregate counts without storing image bytes. CI runs the
same command in a separate scheduled job and uploads the complete per-fixture
JSON and Markdown reports as artifacts.
