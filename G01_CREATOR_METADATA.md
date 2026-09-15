# G01 creator metadata schema pack

G01 is an optional, dependency-free schema pack for volatile creator-tool
conventions. It is separate from the standards-derived EXIF, IPTC, XMP, and
container readers. It performs bounded inspection only: it does not render
pixels, fetch a workflow or model, execute JSON, or write an image.

## Public API

```ts
import {
  inspectCreatorMetadata,
  migrateCreatorMetadataToIptc,
} from "browser-image-metadata/creator";

const creator = await inspectCreatorMetadata(file);
for (const field of creator.fields) {
  console.log(field.producer, field.kind, field.value, field.source);
}

// Conversion is data-only and requires an explicit caller decision.
const iptc = migrateCreatorMetadataToIptc(creator, { confirm: true });
```

`inspectCreatorMetadata()` parses the input through the existing bounded
reader, then inspects recognized PNG text/custom `comf` chunks, WebP EXIF
values, and structured XMP properties. `inspectCreatorMetadataResult()` is
available for callers that already have a bounded `MetadataResult`.

Each result has a stable `creator-metadata/1` schema version. Every source has
a deterministic identity, producer convention parser version, format/family,
keyword or field identity, physical block, packet, offset, and length where
available. Every typed field retains its source identity, field path, and raw
lexical value by default. `includeRawData:false` retains the source byte length
and provenance but deliberately omits raw text and raw field values. Prompts,
negative prompts, model names, and workflow inputs can be sensitive; callers
should use the opt-out in untrusted UI reports and apply the T01 privacy audit
to the original image.

## Supported conventions

- ComfyUI prompt graphs from PNG `tEXt`/`iTXt` keywords `prompt` and
  `workflow`, plus the bounded animated-PNG `comf` chunk. The pack retains
  bounded nodes, node input values, graph edges, and extracts model, sampler,
  seed, steps, and positive/negative text where graph links identify them.
- The common AUTOMATIC1111/Stable Diffusion WebUI `parameters` text, including
  prompt, negative prompt, Steps, Sampler, Seed, and Model.
- InvokeAI `invokeai_metadata`, `sd-metadata`, and `invokeai` JSON records,
  together with legacy `dream`/`Dream` seed and prompt text.
- ComfyUI's documented WebP convention in EXIF `Make`/`Model` values, where a
  key is followed by a JSON value such as `prompt:{...}`.
- URI/local-name-aware XMP creator properties for plain prompts, negative
  prompts, model, sampler, seed, steps, and JSON workflow values.

The parser versions are this package's convention contracts, not claims about
the version of a producer installation. Authoritative convention evidence and
licenses are retained in [`data/creator-schema-sources.json`](./data/creator-schema-sources.json).
The implementation does not copy producer implementation code or metadata
tables.

## Bounds and failure behavior

Creator inspection uses the repository security model. In addition to the
ordinary input, metadata, XML, warning, and decompression limits, it enforces
`maxCreatorSources`, `maxCreatorGraphNodes`, `maxCreatorGraphEdges`,
`maxCreatorRawBytes`, and `maxCreatorFields`. Invalid JSON, invalid CRCs,
truncated custom chunks, unsupported values, and exhausted bounds produce
stable typed diagnostics and set `complete:false` where the omitted or invalid
source prevents complete creator inspection. No malformed value is coerced
into a successful typed field.

Raw source retention is bounded by bytes, not by object count alone. Workflow
objects are cloned into a bounded JSON value model; only bounded node inputs,
edges, and node IDs are exposed. A workflow reference is an inventory and
never an executable workflow.

## IPTC 2025.1 migration

`migrateCreatorMetadataToIptc()` requires `{ confirm:true }`, is immutable, and
returns a data-only mapping to `aIPromptInformation` and `aISystemUsed` in the
IPTC Extension 2025.1 namespace. It does not mutate or serialize an image.
The caller must review the raw source, resolve conflicts, and use the existing
W06 serializer with its explicit conflict policy if a write is desired. An
incomplete creator inspection is carried through as a diagnostic and never
becomes an acceptance claim.

## Acceptance evidence

The generated report at
[`reports/g01-creator-evidence.json`](./reports/g01-creator-evidence.json) and
its Markdown companion are produced by
[`scripts/creator-g01-evidence.mjs`](./scripts/creator-g01-evidence.mjs).
The evidence executes the public built entry point against deterministic
in-memory PNG and WebP fixtures, checks typed fields, graph structure,
provenance, migration opt-in, CRC/JSON failures, raw-data opt-out, and limits.
The fixture bytes and prompt text are not copied into the report.

| Requirement | Implementation | Executable evidence |
| --- | --- | --- |
| Bounded ComfyUI prompt/workflow graphs | `src/creator.ts` graph inventory and `SecurityLimits` creator bounds | `tests/creator-g01.test.ts`, `creator-g01-evidence.mjs` |
| Stable typed model/sampler/seed/steps/prompts | `CreatorMetadataField` and producer decoders | `tests/creator-g01.test.ts` |
| PNG and WebP conventions | PNG text/custom-chunk scan and WebP EXIF bridge | `tests/creator-g01.test.ts` |
| Versioned parser contracts and provenance | `CREATOR_PARSER_VERSIONS`, `CreatorSourceProvenance` | report and source manifest |
| Raw retention and explicit opt-out | `rawText`, `rawValue`, `includeRawData` | `tests/creator-g01.test.ts` |
| Explicit IPTC 2025.1 migration | `migrateCreatorMetadataToIptc()` | `tests/creator-g01.test.ts` |
| Malformed and limit behavior | typed diagnostics and `complete:false` | `tests/creator-g01.test.ts`, report |
