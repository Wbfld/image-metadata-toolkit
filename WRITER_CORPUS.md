# Roadmap-wide writer corpus

The scheduled writer gate exercises the JPEG, PNG, and WebP metadata-only
writers against three separate sets of at least 500 participating fixtures.
The gate never copies third-party image bytes into the repository. It retains
only fixture-relative identities, source and output SHA-256 values, lengths,
operation results, exact byte-change ranges, payload ranges and hashes,
reparse results, oracle results, decoder dimensions, and typed failures.

## Sources and reproducibility

The manifest is [`data/writer-corpus.json`](data/writer-corpus.json). The
scheduled workflow checks out these exact revisions into runner-local
temporary storage:

- WPT `web-platform-tests/wpt` at
  `63ff666e50e7ef4c11a6885612a05951f6f63547`, under its BSD-3-Clause
  `LICENSE.md`.
- `imazen/codec-corpus` at
  `8e10d4d765667c1c49d74413878fc4bfb46dcf8d`. The selected dataset README,
  LICENSE, and attribution records govern each file because the corpus has
  mixed per-dataset terms.
- `ianare/exif-py` at
  `a69bf74770caf6b333221658f5092ed69f99faac`, with its resource README and
  attribution records.

Eligible source files must be independently decoded by both pinned
Playwright browser engines and must have package-reported dimensions before
they participate. When the external pools do not reach 500 in a family, the
gate deterministically derives additional JPEG or WebP encodings in temporary
storage from hash-recorded decoded WPT PNGs using the pinned Playwright
Chromium implementation. These are labelled `derived-from-real`, retain the
source hash, and are real image encodings rather than synthetic pixel
fixtures. The derived policy, quality, encoder package, browser versions, and
all resulting hashes are recorded in the report.

Run locally with exact temporary checkouts and the temporary T05 protected
fixture directory:

```sh
WRITER_CORPUS_ROOTS_JSON='{"web-platform-tests":"/tmp/wpt","imazen-codec-corpus":"/tmp/codec-corpus","ianare-exif-py":"/tmp/exif-py"}' \
WRITER_PROTECTED_CORPUS_DIR=/tmp/mpf-t05/fixtures \
WRITER_CORPUS_OUTPUT_DIR=reports \
npm run test:corpus:writer
```

The command fails if any checkout, protected fixture, decoder, oracle, family
minimum, payload comparison, metadata reparse, or image decode is unavailable.
The output directory receives `roadmap-writer-corpus-evidence.json` and
`roadmap-writer-corpus-evidence.md`. No image output is retained there.

## Executed gate

For every successful output the gate reparses metadata through this package,
checks the independent ExifTool 13.59 oracle for the written XMP marker,
decodes the output in Chromium and Firefox, checks exact dimensions, verifies
every W08 protected image payload range by SHA-256, verifies unchanged unknown
metadata signatures, and records exact byte changes. JPEG scan structure,
progressive and multi-scan markers, comments, trailing bytes, PNG chunk and
APNG structure, compressed text and profiles, WebP VP8/VP8L/VP8X, alpha and
animation relationships, and metadata insertion/replacement/removal paths
are retained as structural evidence where present.

The command also runs bounded real-fixture truncation controls, C2PA carrier
default refusal plus explicit preservation controls, and the hash-pinned MPF
and Ultra HDR default refusal plus explicit `mpf: { mode: "preserve" }`
controls. A refused operation must not alter source bytes and must return a
typed error; no warning-text match is used as acceptance.
