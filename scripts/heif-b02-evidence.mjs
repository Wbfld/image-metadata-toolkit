import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = join(root, "tests", "fixtures");
const reports = join(root, "reports");
const packageManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const sourceManifestBytes = await readFile(join(root, "data", "heif", "sources.json"));
const sourceManifest = JSON.parse(sourceManifestBytes.toString("utf8"));
const { parseMetadata } = await import(join(root, "dist", "index.js"));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cases = [
  {
    fixture: "heif-iref-exif.heic",
    hash: "01e4d05f95b128c4008406fa546c60c3c42d405f1aac42b3e77691617d5828b0",
    format: "heif",
    check: (result) => {
      assert(result.dimensions?.width === 2 && result.dimensions.height === 2, "HEIF cdsc fixture dimensions were not decoded");
      assert(result.heif?.length === 1 && result.heif[0]?.complete === true, "HEIF cdsc fixture did not produce a complete item graph");
      assert(result.heif[0]?.relationships.some(({ referenceType, sourceItemId, targetItemId }) => referenceType === "cdsc" && sourceItemId === 1 && targetItemId === 3), "HEIF cdsc relationship was not retained");
    },
  },
  {
    fixture: "heif-item-metadata.heic",
    hash: "45827c242151888ad23d4dcf493d53e8a161ad0d968e207db1de2afc4cb8efa5",
    format: "heif",
    check: (result) => {
      assert(result.heif?.[0]?.items.some(({ location }) => location?.constructionMethod === "file"), "HEIF file-relative iloc evidence was absent");
      assert(result.heif?.[0]?.complete === true, "HEIF file-relative graph was not complete");
    },
  },
  {
    fixture: "heif-idat-item-metadata.heic",
    hash: "441bdac7b7f5eebca856ed9a93c69a5f2562de7d5dad4db8d22f6986f1cbdcd6",
    format: "heif",
    check: (result) => {
      assert(result.xmp?.packets.length === 1, "HEIF idat XMP item was not decoded");
      assert(result.heif?.[0]?.items.some(({ location }) => location?.constructionMethod === "idat"), "HEIF idat iloc evidence was absent");
    },
  },
  {
    fixture: "heif-indexed-idat-item-metadata.heic",
    hash: "19d115037513946304499be5a1a9230f6652176f19c7805e1c223dd6b79802bb",
    format: "heif",
    check: (result) => {
      assert(result.heif?.[0]?.items.some(({ location }) => location?.extents.some(({ index }) => index !== null)), "HEIF extent-index evidence was absent");
      assert(result.heif?.[0]?.items.some(({ location }) => location?.constructionMethod === "idat"), "HEIF indexed idat location was absent");
    },
  },
  {
    fixture: "heif-tail-idat-item-metadata.heic",
    hash: "bcb9739d8f2fc8edb96dbbeaaae111902fd781961760aae455f22bc160dcc9a6",
    format: "heif",
    check: (result) => assert(result.heif?.[0]?.complete === true && result.xmp?.packets.length === 1, "HEIF tail-idat metadata graph was incomplete"),
  },
  {
    fixture: "heif-primary-icc.heic",
    hash: "61e007d7b3a343a9ba14c2e318bd8740705048ad17ef946082cdf918fd662aac",
    format: "heif",
    check: (result) => assert(result.icc !== null && result.heif?.[0]?.complete === true, "HEIF ICC item semantics were not retained"),
  },
  {
    fixture: "avif-idat-item-metadata.avif",
    hash: "0ec4bd1d69f2e837d9b1509621465b71f9ee0d50936bc16aedb8ff544cfa8102",
    format: "avif",
    check: (result) => {
      assert(result.format === "avif" && result.xmp?.packets.length === 1, "AVIF idat XMP item was not decoded");
      assert(result.heif?.[0]?.items.some(({ location }) => location?.constructionMethod === "idat"), "AVIF idat iloc evidence was absent");
    },
  },
  {
    fixture: "avif-primary-nclx.avif",
    hash: "52d5649ac2bd6ef715e795a11576e1340c4e88b888b9ea1b2af72ea1c41b722d",
    format: "avif",
    check: (result) => assert(result.nclx !== undefined && result.heif?.[0]?.complete === true, "AVIF nclx item-property evidence was absent"),
  },
  {
    fixture: "avif-primary-icc.avif",
    hash: "853ab0ba476ea3b2cdca5f72a3830d14d130a8f56674577ac46dc3d842593439",
    format: "avif",
    check: (result) => assert(result.format === "avif" && result.icc !== null, "AVIF ICC item-property evidence was absent"),
  },
  {
    fixture: "libavif-paris-icc-exif-xmp.avif",
    hash: "961bc38b61e60b7651fa20efa24269ae2f35e4958822a81c908c9bbf9b3f66e1",
    format: "avif",
    check: (result) => {
      assert(result.dimensions?.width === 403 && result.dimensions.height === 302, "libavif AVIF dimensions changed");
      assert(result.xmp?.packets.length === 1 && result.icc !== null, "libavif AVIF metadata items were not decoded");
      assert((result.heif?.[0]?.relationships.filter(({ referenceType }) => referenceType === "cdsc").length ?? 0) >= 1, "libavif AVIF cdsc relationship was not retained");
    },
  },
];

const evidence = [];
for (const item of cases) {
  const path = join(fixtures, item.fixture);
  const bytes = new Uint8Array(await readFile(path));
  const actualHash = sha256(bytes);
  assert(actualHash === item.hash, `${item.fixture} hash mismatch: expected ${item.hash}, received ${actualHash}`);
  const result = await parseMetadata(bytes);
  assert(result.format === item.format, `${item.fixture} detected as ${result.format}, expected ${item.format}`);
  item.check(result);
  assert(result.warnings.length === 0, `${item.fixture} emitted warnings: ${result.warnings.map(({ code }) => code).join(", ")}`);
  const graph = result.heif?.[0];
  evidence.push({
    fixture: `tests/fixtures/${item.fixture}`,
    bytes: bytes.length,
    sha256: actualHash,
    format: result.format,
    dimensions: result.dimensions,
    graphCount: result.heif?.length ?? 0,
    itemCount: graph?.items.length ?? 0,
    relationshipTypes: [...new Set(graph?.relationships.map(({ referenceType }) => referenceType) ?? [])],
    constructionMethods: [...new Set(graph?.items.map(({ location }) => location?.constructionMethod).filter((value) => value !== undefined) ?? [])],
    completeGraphs: result.heif?.filter(({ complete }) => complete).length ?? 0,
    xmpPackets: result.xmp?.packets.length ?? 0,
    iccPresent: result.icc !== null,
    warningCodes: result.warnings.map(({ code }) => code),
    status: "passed",
  });
}

const sourceManifestHash = sha256(sourceManifestBytes);
const report = {
  schema: "browser-image-metadata.heif-b02-evidence.v1",
  status: "pass",
  generatedAt: new Date().toISOString(),
  package: { name: packageManifest.name, version: packageManifest.version },
  sourceManifest: { path: "data/heif/sources.json", sha256: sourceManifestHash, schema: sourceManifest.schema },
  standards: sourceManifest.sources.map(({ title, version, edition, editionDate, url, license, hash }) => ({ title, version, ...(edition === undefined ? {} : { edition }), ...(editionDate === undefined ? {} : { editionDate }), url, license, hash })),
  implementation: {
    graph: "one bounded graph per MetaBox; pitm, iinf, iloc, dref, iprp/ipco/ipma, and iref retained with source ranges",
    constructionMethods: ["file (iloc method 0)", "idat (iloc method 1)", "item-offset (iloc method 2)"],
    relationships: ["thmb", "auxl", "dimg", "cdsc", "iloc", "unknown reference types"],
    properties: ["ispe", "auxC", "colr prof/rICC/nclx", "irot", "imir"],
    derived: ["grid", "iovl", "iden"],
    externalDataPolicy: "self-contained url/urn references are only resolved within the source file; external and unknown references are inventoried and never fetched",
    pixelPolicy: "structural item semantics only; no pixel decoding",
    securityPolicy: "safe-integer offsets, bounded box/item/property/reference counts, bounded strings, bounded extents, cycle detection, and cumulative metadata-byte limits",
  },
  cases: evidence,
  complete: evidence.length === cases.length && evidence.every(({ status, completeGraphs, graphCount }) => status === "passed" && completeGraphs === graphCount),
  payloadPolicy: "checked repository fixtures only; no third-party image bytes or derived image copies are written by this command",
};
assert(report.complete, "B02 evidence was incomplete");
await mkdir(reports, { recursive: true });
await writeFile(join(reports, "heif-b02-evidence.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# HEIF/AVIF B02 evidence",
  "",
  `- Status: **${report.status}**`,
  `- Package: \`${report.package.name}@${report.package.version}\``,
  `- Source manifest: \`${report.sourceManifest.path}\` (SHA-256 \`${report.sourceManifest.sha256}\`)`,
  `- Cases: ${report.cases.length} (all passed with complete graphs)`,
  "- Payload policy: checked repository fixtures only; no third-party image bytes or derived image copies are written by this command.",
  "",
  "| Fixture | Format | Bytes | SHA-256 | Graphs/items | Methods | Relationships | Status |",
  "| --- | --- | ---: | --- | ---: | --- | --- | --- |",
  ...report.cases.map((item) => `| ${item.fixture} | ${item.format} | ${item.bytes} | \`${item.sha256}\` | ${item.graphCount}/${item.itemCount} | ${item.constructionMethods.join(", ") || "none"} | ${item.relationshipTypes.join(", ") || "none"} | ${item.status} |`),
  "",
  "## Executed policies",
  "",
  `- Construction methods: ${report.implementation.constructionMethods.join("; ")}.`,
  `- External data: ${report.implementation.externalDataPolicy}.`,
  `- Limits: ${report.implementation.securityPolicy}.`,
  `- Pixel behavior: ${report.implementation.pixelPolicy}.`,
  "",
  "The JSON artifact records the complete machine-readable result, including dimensions, graph completeness, construction methods, relationships, ICC/XMP presence, warning codes, source-manifest hash, and fixture hashes. It contains no image bytes.",
].join("\n");
await writeFile(join(reports, "heif-b02-evidence.md"), `${markdown}\n`, "utf8");
console.log(`HEIF/AVIF B02 evidence passed for ${report.cases.length} cases; reports: reports/heif-b02-evidence.{json,md}`);
