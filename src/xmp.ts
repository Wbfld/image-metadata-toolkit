/** Optional structured XMP decoding entry point. */
export { parseStructuredXmp } from "./metadata/xmp.js";
export { deriveXmpPacketProvenance, mergeStructuredXmp, parseStructuredXmpDetailed, parseStructuredXmpDocuments, parseStructuredXmpBytesDetailed, validateStructuredXmpPacket } from "./metadata/xmp.js";
export { parseStructuredXmpBytes } from "./metadata/xmp.js";
export { parseStructuredXmpWithDecoder, parseStructuredXmpWithDecoderDetailed, parseStructuredXmpBytesWithDecoder, parseStructuredXmpBytesWithDecoderDetailed } from "./metadata/xmp.js";
export type {
  StructuredXmpDecoder,
  StructuredXmpOptions,
  StructuredXmpPacket,
  StructuredXmpParseResult,
  XmpAliasDefinition,
  XmpArrayValue,
  XmpConflict,
  XmpDescription,
  XmpDiagnostic,
  XmpDiagnosticCode,
  XmpLiteralValue,
  XmpMergedDocument,
  XmpNamespaceBinding,
  XmpProperty,
  XmpPropertyCandidate,
  XmpPropertyValue,
  XmpQualifiedName,
  XmpQualifier,
  XmpRdfDocument,
  XmpResourceValue,
  XmpValue,
} from "./metadata/xmp.js";
