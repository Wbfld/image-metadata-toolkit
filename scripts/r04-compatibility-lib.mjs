import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import EXIF from "exif-js";
import exifr from "exifr";
import ExifReader from "exifreader";
import piexif from "piexifjs";

const requiredCompetitors = Object.freeze([
  ["exifr", "exifr", "7.1.3", "MIT"],
  ["exifreader", "exifreader", "4.45.0", "MPL-2.0"],
  ["exif-js", "exif-js", "2.3.0", "MIT"],
  ["piexifjs", "piexifjs", "1.0.6", "MIT"],
]);
const requiredSnippets = Object.freeze(["exifr-common", "exifreader-grouped", "exif-js-callback", "piexifjs-write", "metadata-families", "privacy"]);
const requiredAnchors = Object.freeze(["#r04-migration-and-compatibility-guide", "#input-and-import-mappings", "#semantic-differences", "#unsupported-or-intentionally-non-equivalent-mappings", "#codemod-decision"]);

function stable(value) {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return { bytes: value.byteLength, sha256: sha256(value) };
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, stable(entry)]));
  if (typeof value === "number" && !Number.isFinite(value)) return String(value);
  return value;
}

export function stableJson(value) { return `${JSON.stringify(stable(value), null, 2)}\n`; }
export function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function packageVersion(manifest, packageName) {
  return manifest.packages?.[`node_modules/${packageName}`]?.version ?? null;
}

export function validateSources(sources, lockfile) {
  assert(sources?.schema === "browser-image-metadata/r04-compatibility-sources@1", "R04 source manifest schema is stale.");
  assert(sources?.noCopyHashPolicy?.includes("no copied competitor"), "R04 source manifest must explain its no-copy hash policy.");
  const competitors = new Map((sources.competitors ?? []).map((entry) => [entry.id, entry]));
  for (const [id, packageName, version, license] of requiredCompetitors) {
    const entry = competitors.get(id);
    assert(entry !== undefined, `R04 source manifest is missing ${id}.`);
    assert(entry.package === packageName && entry.version === version && entry.license === license, `R04 source manifest has stale metadata for ${id}.`);
    assert(typeof entry.documentationUrl === "string" && entry.documentationUrl.startsWith("https://"), `R04 source manifest lacks an official documentation URL for ${id}.`);
    assert(typeof entry.licenseUrl === "string" && entry.licenseUrl.startsWith("https://"), `R04 source manifest lacks an official license URL for ${id}.`);
    assert(packageVersion(lockfile, packageName) === version, `Pinned ${packageName} version does not match R04 source manifest.`);
  }
  assert(competitors.size === requiredCompetitors.length, "R04 source manifest contains an unreviewed competitor entry.");
  assert(Array.isArray(sources.fixtures) && sources.fixtures.length === 3, "R04 needs exactly three hash-pinned compatibility fixtures.");
  const fixturePaths = new Set();
  for (const fixture of sources.fixtures) {
    assert(typeof fixture.path === "string" && fixture.path.startsWith("tests/fixtures/"), "R04 fixture path is invalid.");
    assert(!fixturePaths.has(fixture.path), `R04 fixture is duplicated: ${fixture.path}.`);
    fixturePaths.add(fixture.path);
    assert(Number.isSafeInteger(fixture.bytes) && fixture.bytes > 0, `R04 fixture byte length is invalid: ${fixture.path}.`);
    assert(typeof fixture.sha256 === "string" && /^[a-f0-9]{64}$/u.test(fixture.sha256), `R04 fixture SHA-256 is invalid: ${fixture.path}.`);
    assert(typeof fixture.provenance === "string" && fixture.provenance.length > 0, `R04 fixture provenance is missing: ${fixture.path}.`);
    assert(typeof fixture.license === "string" && fixture.license.length > 0, `R04 fixture license is missing: ${fixture.path}.`);
  }
  return sources;
}

export function assertFixtureBytes(fixture, bytes) {
  assert(bytes.byteLength === fixture.bytes, `${fixture.path} byte length is stale.`);
  assert(sha256(bytes) === fixture.sha256, `${fixture.path} SHA-256 is stale.`);
}

export function validatePublicApi(toolkit) {
  const requiredPublicApi = ["parseMetadata", "readCaptureTime", "readGps", "readOrientation", "readRotation", "readThumbnail", "auditPrivacy", "sanitizeMetadata", "editMetadata", "toExifReaderCompatible", "toExifrCompatible", "toJsonSafeResult"];
  for (const name of requiredPublicApi) assert(typeof toolkit[name] === "function", `R04 published replacement requires public API ${name}.`);
  return Object.freeze(requiredPublicApi);
}

export function assertEvidenceEquals(path, actual, expected) {
  if (actual !== expected) throw new Error(`R04 ${path} is stale; run npm run compatibility:generate.`);
}

export function extractSnippets(markdown) {
  const snippets = new Map();
  const expression = /<!-- r04-snippet: ([a-z0-9-]+) -->\s*```js\n([\s\S]*?)\n```/gu;
  for (const match of markdown.matchAll(expression)) {
    const [, id, source] = match;
    assert(!snippets.has(id), `R04 migration document duplicates snippet ${id}.`);
    snippets.set(id, source);
  }
  return snippets;
}

export function validateDocumentation(markdown, codemodDecision) {
  const anchors = new Set([...markdown.matchAll(/^#{1,6}\s+(.+)$/gmu)].map((match) => `#${match[1].trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "")}`));
  for (const anchor of requiredAnchors) assert(anchors.has(anchor), `R04 migration document is missing anchor ${anchor}.`);
  const snippets = extractSnippets(markdown);
  for (const id of requiredSnippets) {
    const source = snippets.get(id);
    assert(source !== undefined, `R04 migration document is missing ${id} snippet.`);
    assert(source.includes('from "browser-image-metadata"'), `R04 snippet ${id} must import the packed public package.`);
    assert(source.includes("process.argv[2]"), `R04 snippet ${id} must accept an explicit caller-owned input path.`);
  }
  assert(snippets.size === requiredSnippets.length, "R04 migration document contains an unreviewed executable snippet.");
  assert(codemodDecision.includes("Status: no codemod is published"), "R04 codemod decision must state its publication status.");
  assert(codemodDecision.includes("dry-run and check"), "R04 codemod decision must record the future safety requirements.");
  return snippets;
}

function field(result, name) {
  return result.fields.find((entry) => entry.name === name) ?? result.exif?.fields.find((entry) => entry.name === name) ?? null;
}

function exactRational(value) {
  if (value !== null && typeof value === "object" && typeof value.numerator === "number" && typeof value.denominator === "number") return `${value.numerator}/${value.denominator}`;
  return null;
}

function toolkitOutput(result, captureTime) {
  const date = field(result, "DateTimeOriginal");
  const exposure = field(result, "ExposureTime");
  const fNumber = field(result, "FNumber");
  const latitude = field(result, "GPSLatitude");
  const longitude = field(result, "GPSLongitude");
  const orientation = field(result, "Orientation");
  return {
    orientation: orientation?.value ?? null,
    dateTimeOriginal: { normalized: date?.value ?? null, lexical: typeof date?.raw === "string" ? date.raw : null, offset: captureTime.offsetTimeOriginal ?? null },
    exposureTime: { normalized: exposure?.value ?? null, exact: exactRational(exposure?.raw) },
    fNumber: { normalized: fNumber?.value ?? null, exact: exactRational(fNumber?.raw) },
    gps: { latitude: latitude?.value ?? null, longitude: longitude?.value ?? null },
    families: { exif: result.exif !== null, iptc: result.iptc !== null, xmp: result.xmp !== null, icc: result.icc !== null },
  };
}

function readerOutput(result) {
  const exif = result?.exif ?? {};
  const hasEntries = (value) => value !== null && typeof value === "object" && Object.keys(value).length > 0;
  return {
    orientation: exif.Orientation?.value ?? null,
    dateTimeOriginal: exif.DateTimeOriginal?.value ?? null,
    exposureTime: exif.ExposureTime?.value ?? null,
    fNumber: exif.FNumber?.value ?? null,
    gps: { latitude: result?.gps?.Latitude ?? null, longitude: result?.gps?.Longitude ?? null },
    families: { exif: Object.keys(exif).length > 0, iptc: hasEntries(result?.iptc), xmp: hasEntries(result?.xmp), icc: hasEntries(result?.icc) },
  };
}

function exifrOutput(result) {
  return {
    orientation: result?.Orientation ?? null,
    dateTimeOriginal: result?.DateTimeOriginal ?? null,
    exposureTime: result?.ExposureTime ?? null,
    fNumber: result?.FNumber ?? null,
    gps: { latitude: result?.GPSLatitude ?? null, longitude: result?.GPSLongitude ?? null },
    families: { exif: result !== undefined && result !== null, iptc: result?.iptc !== undefined, xmp: result?.xmp !== undefined, icc: result?.icc !== undefined },
  };
}

function exifJsOutput(result) {
  return {
    orientation: result?.Orientation ?? null,
    dateTimeOriginal: result?.DateTimeOriginal ?? null,
    exposureTime: result?.ExposureTime ?? null,
    fNumber: result?.FNumber ?? null,
    gps: { latitude: result?.GPSLatitude ?? null, longitude: result?.GPSLongitude ?? null },
    families: { exif: result !== false && result !== undefined && result !== null, iptc: false, xmp: false, icc: false },
  };
}

function piexifOutput(result) {
  return {
    orientation: result?.["0th"]?.[274] ?? null,
    dateTimeOriginal: result?.Exif?.[36867] ?? null,
    exposureTime: result?.Exif?.[33434] ?? null,
    fNumber: result?.Exif?.[33437] ?? null,
    gps: { latitude: result?.GPS?.[2] ?? null, longitude: result?.GPS?.[4] ?? null },
    families: { exif: result !== undefined && result !== null, iptc: false, xmp: false, icc: false },
  };
}

function binaryArrayBuffer(bytes) { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }

export async function createCompatibilityReport({ root, toolkit }) {
  const sourcePath = resolve(root, "data/r04-compatibility-sources.json");
  const [sources, lockfile, migration, codemodDecision] = await Promise.all([
    readFile(sourcePath, "utf8").then(JSON.parse),
    readFile(resolve(root, "package-lock.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "R04_MIGRATION_COMPATIBILITY.md"), "utf8"),
    readFile(resolve(root, "R04_CODEMOD_DECISION.md"), "utf8"),
  ]);
  validateSources(sources, lockfile);
  validateDocumentation(migration, codemodDecision);
  const requiredPublicApi = validatePublicApi(toolkit);
  const packageManifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const fixtures = [];
  for (const fixture of sources.fixtures) {
    const sourceBytes = await readFile(resolve(root, fixture.path));
    const bytes = new Uint8Array(sourceBytes.buffer, sourceBytes.byteOffset, sourceBytes.byteLength);
    assertFixtureBytes(fixture, bytes);
    const [parsed, captureTime, reader, parsedExifr] = await Promise.all([
      toolkit.parseMetadata(bytes),
      toolkit.readCaptureTime(bytes),
      ExifReader.load(sourceBytes, { expanded: true, async: true }),
      exifr.parse(sourceBytes, true),
    ]);
    const parsedExifJs = EXIF.readFromBinaryFile(binaryArrayBuffer(bytes));
    const parsedPiexif = piexif.load(sourceBytes.toString("binary"));
    fixtures.push({
      path: fixture.path,
      bytes: fixture.bytes,
      sha256: fixture.sha256,
      provenance: fixture.provenance,
      outputs: {
        toolkit: toolkitOutput(parsed, captureTime),
        exifr: exifrOutput(parsedExifr),
        exifreader: readerOutput(reader),
        "exif-js": exifJsOutput(parsedExifJs),
        piexifjs: piexifOutput(parsedPiexif),
      },
    });
  }
  const report = {
    schema: "browser-image-metadata/r04-compatibility-report@1",
    package: { name: packageManifest.name, version: packageManifest.version },
    publicApi: requiredPublicApi,
    sources: {
      manifest: "data/r04-compatibility-sources.json",
      sha256: sha256(await readFile(sourcePath)),
      competitors: sources.competitors,
      noCopyHashPolicy: sources.noCopyHashPolicy,
    },
    fixtures,
    semanticDifferences: [
      { id: "date-timezone", toolkit: "Keeps normalized and lexical dates; preserves only an actual EXIF offset and never infers a runtime timezone.", incumbent: "exifr may convert dates to Date/UTC; ExifReader retains EXIF lexical values." },
      { id: "rationals", toolkit: "Keeps normalized numeric values plus exact numerator/denominator source values.", incumbent: "exifr commonly returns decimals; ExifReader exposes numeric pairs." },
      { id: "duplicates-ordering", toolkit: "Retains source-ordered fields, RDF properties, IPTC candidates, blocks, and conflicts.", incumbent: "Flat object projections cannot represent duplicate candidates or source ordering without an explicit loss policy." },
      { id: "raw-semantic", toolkit: "Separates raw, lexical, normalized, and semantic values with provenance.", incumbent: "Flat values are convenience projections rather than round-trip models." },
      { id: "warnings-errors", toolkit: "Uses coverage, completeness, typed statuses, diagnostics, and stable reason codes.", incumbent: "Missing, undefined, null, callback, and thrown-error semantics are library-specific and are not treated as success." },
      { id: "metadata-families", toolkit: "Preserves distinct EXIF, URI/local-name XMP, IPTC semantic, and ICC families.", incumbent: "Unsupported or differently-shaped families remain explicitly non-equivalent." },
      { id: "writing", toolkit: "Uses exact operations, atomic output, reparse, and encoded-payload evidence.", incumbent: "No broad EXIF-object writer compatibility claim is made." },
    ],
    unsupportedMappings: [
      "implicit path, URL, and DOM image loading",
      "callback metadata attachment",
      "object-URL thumbnail creation",
      "wholesale EXIF dictionary rewrite",
      "lossless flattening of duplicate, RDF/XMP, IPTC, or ICC data",
    ],
    codemod: { published: false, decision: "R04_CODEMOD_DECISION.md" },
  };
  return stable(report);
}

export function renderCompatibilityMarkdown(report) {
  const rows = report.fixtures.map((fixture) => {
    const toolkit = fixture.outputs.toolkit;
    const exifrValue = fixture.outputs.exifr;
    const reader = fixture.outputs.exifreader;
    const exifJs = fixture.outputs["exif-js"];
    const piexifValue = fixture.outputs.piexifjs;
    return `| ${fixture.path} | ${fixture.bytes} | \`${fixture.sha256}\` | ${JSON.stringify(toolkit)} | ${JSON.stringify(exifrValue)} | ${JSON.stringify(reader)} | ${JSON.stringify(exifJs)} | ${JSON.stringify(piexifValue)} |`;
  });
  return [
    "# R04 compatibility evidence",
    "",
    `- Package: ${report.package.name}@${report.package.version}`,
    `- Checked public replacement APIs: ${report.publicApi.map((name) => `\`${name}\``).join(", ")}`,
    `- Source manifest: [${report.sources.manifest}](../${report.sources.manifest}) / \`${report.sources.sha256}\``,
    `- Documentation policy: ${report.sources.noCopyHashPolicy}`,
    "",
    "## Pinned competitor sources",
    "",
    "| ID | Package | Version | License | Documentation | License source |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.sources.competitors.map((entry) => `| ${entry.id} | ${entry.package} | ${entry.version} | ${entry.license} | ${entry.documentationUrl} | ${entry.licenseUrl} |`),
    "",
    "## Generated side-by-side outputs",
    "",
    "The values below are generated by the installed pinned packages against hash-pinned repository fixtures. They are not an assertion that different shapes are equivalent.",
    "",
    "| Fixture | Bytes | SHA-256 | Toolkit | exifr | ExifReader | exif-js | piexifjs |",
    "| --- | ---: | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "## Explicit semantic differences",
    "",
    "| ID | Toolkit | Incumbent consequence |",
    "| --- | --- | --- |",
    ...report.semanticDifferences.map((entry) => `| ${entry.id} | ${entry.toolkit} | ${entry.incumbent} |`),
    "",
    "## Unsupported mappings",
    "",
    ...report.unsupportedMappings.map((value) => `- ${value}`),
    "",
    `Codemod published: ${report.codemod.published ? "yes" : "no"}; decision: [${report.codemod.decision}](../${report.codemod.decision}).`,
    "",
  ].join("\n");
}
