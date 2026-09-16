# T05 MPF and Ultra HDR read/write support

The package exposes bounded inventories and an explicit-policy metadata-only writer for CIPA Multi-Picture Format (MPF) APP2 segments and Android Ultra HDR gain-map metadata. Reads remain additive and lossless at the metadata model boundary. Writes preserve encoded JPEG scan payloads and gain-map bytes, recalculate MPF offsets/sizes, and verify the resulting relationships before exposing output.

## Standards and provenance

Normative behavior is derived from the pinned sources in [`data/mpf/reference-corpus.json`](data/mpf/reference-corpus.json): CIPA DC-X007:2025 Multi-Picture Format and Android Ultra HDR Image Format v1.1. The manifest records the retrieval date, URL, license statement, temporary source filename, and SHA-256 for each source. CIPA’s specification is the authority for MPF TIFF byte order, IFDs, MPEntry attributes, image sizes, dependencies, and offsets. Android’s specification is the authority for the gain-map XMP namespace, required values, GContainer semantics, and invalid-metadata behavior. The implementation does not copy code or metadata tables from ExifTool or another parser.

The reference inputs are also pinned in that manifest. They are downloaded only to an operator-selected temporary directory by the scheduled interoperability workflow or a local operator. The repository retains hashes, paths, source commits, licenses, and compact decoded summaries; it does not retain third-party image bytes.

## Read model

`MetadataResult.mpf` contains every detected MPF APP2 segment, its IFD entries, index and attribute IFDs, MPF version, image count, MPEntry values, source ranges, image format/type bits, representative/dependency flags, and bounded relationships. Stored non-primary offsets are CIPA offsets relative to the MP Endian field in the MPF header; `absoluteOffset` is the resolved source-file coordinate. The first image’s required zero offset resolves to the beginning of the primary JPEG. Every secondary image is independently reparsed as a JPEG without retaining its encoded bytes. Its inventory includes dimensions, field identifiers, metadata-family presence, XMP packet count, and nested diagnostics.

`MetadataResult.ultraHdr` is present when an exact-namespace `hdrgm` property is found. It retains lexical and numeric gain-map values, source packet indices and XMP block identities, ordered GContainer items, MPF image links, primary/gain-map relationships, status, and typed diagnostics. Namespace URI and local name are always matched together. Required properties, numeric ranges, one-or-three-value arrays, the ordered directory, JPEG MIME type, URI restrictions, item lengths, and MPF relationships are validated. Invalid values retain their lexical form and never become a successful complete inventory.

The parser is fail-closed for unsafe offsets, truncated IFDs and image ranges, duplicate MP Index IFDs, inconsistent dependency flags, overlapping ranges, excessive IFD/image/XMP counts, malformed RDF, conflicting XMP packets, and unsupported image-data formats. All offset arithmetic is safe-integer checked and nested inspection is bounded by `SecurityLimits`. No remote URI is fetched.

## Evidence command

The real evidence command requires both temporary directories and refuses a missing or empty corpus, missing source documents, missing fixtures, hash mismatches, incomplete nested inventories, or a partial Android/CIPA run:

```sh
npm run test:mpf-t05 -- \
  --corpus /path/to/temporary/t05/fixtures \
  --sources /path/to/temporary/t05/sources \
  --report-dir reports
```

The command runs the focused synthetic tests, verifies the pinned source and fixture SHA-256 values, parses all three real fixtures, and writes redistribution-safe `reports/mpf-t05-evidence.json` and `reports/mpf-t05-evidence.md`. The reports contain no image bytes. The JSON records fixture-relative paths, byte lengths, hashes, source commits, package version, standard manifest hash, parser statuses, image/range/metadata summaries, diagnostics, and the normalization and preservation policy.

The scheduled `.github/workflows/interoperability.yml` job downloads the same pinned source documents and fixtures into runner-local temporary storage, invokes this same command, and uploads both full reports. It does not check third-party bytes into the repository.

The write gate is run by the same scheduled job after the read gate:

```sh
npm run test:mpf-t05-write -- \
  --corpus /path/to/temporary/t05/fixtures \
  --report-dir reports
```

It requires the hash-pinned complete CIPA fixture `pillow-frame-size.mpo`, performs an actual metadata-growth rewrite under the explicit preserve policy, reparses every primary and secondary range, verifies every protected scan and secondary-image hash, checks the output with ExifTool 13.59 as a secondary metadata oracle, and writes `reports/mpf-t05-write-evidence.{json,md}`. The report contains no image bytes. Android Ultra HDR files whose source MPF primary range is incomplete remain safely refused by the writer; that refusal is not represented as a successful write.

## Safe metadata-only writing

MPF and Ultra HDR inputs continue to be refused by default. A caller must opt
in with the typed policy below; this prevents an ordinary EXIF/XMP edit from
silently invalidating associated-image offsets:

```ts
rewriteJpegMetadata(bytes, {
  blocks: [{ op: "add", kind: "standard-xmp", data: "<x:xmpmeta/>" }],
  mpf: { mode: "preserve", ultraHdr: "preserve" },
});
```

`mode: "preserve"` recalculates the MPF primary size and every non-primary
offset after planned marker edits using the source MPF TIFF byte order. Image
counts, types, dependency references, and encoded JPEG scan payloads must
remain unchanged. The optional `ultraHdr: "preserve"` requirement is mandatory
when gain-map XMP is present; the writer refuses an incomplete relationship or
any edit that changes its GContainer semantics. It does not synthesize or
silently rewrite GContainer relationships. Malformed, overlapping, ambiguous,
non-JPEG, or out-of-range image entries fail atomically before output is
returned. The result's `mpf` evidence contains only ranges, SHA-256 values,
relationship status, and policy diagnostics; it never retains associated image
bytes.

`editMetadata()` accepts the same policy under `policy.mpf`. C2PA/JUMBF
handling remains a separate policy and is never enabled by MPF preservation.
The existing JPEG preservation verifier checks the primary encoded scan data;
the T05 writer verifier additionally reparses each MPF JPEG range and hashes
every primary/secondary scan. Actual independent browser image-decoder coverage
for baseline and progressive JPEG output remains in the W03 Playwright suite.
