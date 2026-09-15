import type { MakerNotePlugin, MakerNotePluginIdentity, MakerNotePluginInput, MakerNotePluginResult, MakerNoteReadContext, MakerNoteSourceReference, MakerNoteTagDefinition } from "../src/types.js";

/**
 * Type-safe factory for isolated MakerNote plugins contributed by the
 * community. The returned plugin has no global registration side effect.
 * Detection and parsing stay under the caller's bounded MakerNote context.
 */
export interface CommunityMakerNotePluginDefinition {
  readonly identity: MakerNotePluginIdentity;
  readonly detect: (input: MakerNoteReadContext) => ReturnType<MakerNotePlugin["detect"]>;
  readonly parse: (input: MakerNotePluginInput) => MakerNotePluginResult;
}

function validIdentity(identity: MakerNotePluginIdentity): boolean {
  return identity.id.length > 0 && identity.id.length <= 128 && identity.version.length > 0 && identity.version.length <= 64 && identity.vendor.length > 0 && identity.vendor.length <= 128 && identity.noteFamily.length > 0 && identity.noteFamily.length <= 128 && Number.isFinite(identity.minimumConfidence) && identity.minimumConfidence >= 0 && identity.minimumConfidence <= 1 && (identity.sources?.length ?? 0) > 0 && identity.sources?.every((source) => source.license.length > 0 && source.url.startsWith("https://") && source.sha256.length === 64) === true;
}

function immutableSources(sources: readonly MakerNoteSourceReference[]): readonly MakerNoteSourceReference[] {
  return Object.freeze(sources.map((source) => Object.freeze({ ...source })));
}

function immutableStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...values]);
}

function immutableTagRegistry(tags: readonly MakerNoteTagDefinition[]): MakerNotePluginIdentity["tagRegistry"] {
  return Object.freeze(tags.map((tag) => Object.freeze({
    ...tag,
    ...(tag.enumValues === undefined ? {} : { enumValues: Object.freeze({ ...tag.enumValues }) }),
    ...(tag.applicableModels === undefined ? {} : { applicableModels: Object.freeze([...tag.applicableModels]) }),
    ...(tag.applicableVersions === undefined ? {} : { applicableVersions: Object.freeze([...tag.applicableVersions]) }),
  })));
}

/** Build an immutable, explicitly supplied plugin contract. */
export function defineCommunityMakerNotePlugin(definition: CommunityMakerNotePluginDefinition): MakerNotePlugin {
  if (!validIdentity(definition.identity)) throw new TypeError("A community MakerNote plugin identity must contain bounded fields and at least one hashed HTTPS source with a license.");
  const sources = definition.identity.sources;
  if (sources === undefined) throw new TypeError("A community MakerNote plugin requires source provenance.");
  const identity: MakerNotePluginIdentity = Object.freeze({
    ...definition.identity,
    ...(definition.identity.supportedModels === undefined ? {} : { supportedModels: immutableStrings(definition.identity.supportedModels) }),
    ...(definition.identity.supportedVersions === undefined ? {} : { supportedVersions: immutableStrings(definition.identity.supportedVersions) }),
    signatureTests: immutableStrings(definition.identity.signatureTests),
    tagRegistry: immutableTagRegistry(definition.identity.tagRegistry),
    securityRequirements: immutableStrings(definition.identity.securityRequirements),
    sources: immutableSources(sources),
  });
  return Object.freeze({
    identity,
    detect: (context: MakerNoteReadContext) => definition.detect(context),
    parse: (input: MakerNotePluginInput) => definition.parse(input),
  });
}
