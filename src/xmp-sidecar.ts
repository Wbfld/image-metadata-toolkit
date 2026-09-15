/** Explicit standalone XMP sidecar API. This entry point performs no file or network I/O. */
export { mergeMetadataWithXmpSidecar, mergeXmpSources, parseXmpSidecar, serializeXmpSidecar } from "./sidecar.js";
export type { XmpSidecarCoverage, XmpSidecarMergeInput, XmpSidecarMergeOptions, XmpSidecarMergePolicy, XmpSidecarMergeResult, XmpSidecarPacket, XmpSidecarParseOptions, XmpSidecarResult, XmpSidecarSerializationOptions, XmpSidecarSerializationResult, XmpSidecarSourceIdentity } from "./sidecar.js";
