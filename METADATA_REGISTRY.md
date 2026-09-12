# Metadata registry

`browser-image-metadata` keeps its EXIF/TIFF vocabulary in [`data/metadata-registry.json`](data/metadata-registry.json), rather than scattering tag definitions across parser code. The source schema records stable IDs, IFD/family, numeric tags, legal TIFF types, cardinality, standard version, aliases, enum/bitfield metadata, sensitivity, validation, write policy, and provenance.

Run `npm run registry:generate` after changing the source. CI runs `npm run registry:check` and fails if the compact runtime indexes are stale, non-deterministic, or contain duplicate IDs, names, aliases, or tag locations. The public API exposes the generated `MetadataFieldName` union; constructed registries and their nested records are immutable.

The built-in registry has 138 migrated definitions and provenance for the CIPA EXIF source. Applications can create an isolated registry and pass it to any parse operation:

```ts
import { createMetadataRegistry, parseMetadata } from "browser-image-metadata";

const registry = createMetadataRegistry([{
  id: "IFD0:0x010f",
  ifd: "IFD0",
  tag: 0x010f,
  name: "CameraBrand",
  description: "Application-specific camera brand label",
}]);

const result = await parseMetadata(bytes, { registry });
```

Registries are deeply frozen at construction. They are selected per parse and never mutate the built-in registry or another concurrent parse. A custom definition can intentionally replace a standard name; unknown tags remain safely retained with the normal unknown-tag behavior.
