import { detectFormat } from "./detect-format.js";
import { materializeInput, materializeJpegHeader, materializeMetadata } from "./input.js";
import { parseJpeg } from "./parsers/jpeg.js";
import { resolveMetadataRegistry } from "./registry.js";
import { completeMetadataResult } from "./result.js";
import { resolveSelection } from "./selection.js";
import { DEFAULT_LIMITS, resolveLimits } from "./security/limits.js";
import { MetadataError, type MetadataInput, type MetadataResult, type ParseOptions } from "./types.js";

/** Parse JPEG metadata without importing readers for other image containers. */
export async function parseJpegMetadata(input: MetadataInput, options: ParseOptions = {}): Promise<MetadataResult> {
  const limits = resolveLimits(options.limits);
  if (options.signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
  const selection = resolveSelection(options.select);
  const materialization = options.scope === "metadata"
    ? await materializeMetadata(input, limits, selection, options.signal)
    : {
        bytes: options.scope === "jpeg-header" ? await materializeJpegHeader(input, limits, options.signal) : await materializeInput(input, limits, options.signal),
        partial: options.scope === "jpeg-header",
        warnings: [],
      };
  const bytes = materialization.bytes;
  if (options.signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
  if (detectFormat(bytes).format !== "jpeg") throw new MetadataError("UNSUPPORTED_FORMAT", "parseJpegMetadata() requires a recognized JPEG input.");
  const headerOnly = options.scope === "jpeg-header" || options.scope === "metadata";
  const result = parseJpeg(bytes, limits, { selection, headerOnly, registry: resolveMetadataRegistry(options.registry), ...(materialization.mapOffset === undefined ? {} : { offsetMap: materialization.mapOffset }), ...(options.signal === undefined ? {} : { signal: options.signal }) });
  const selected = { ...result, warnings: [...materialization.warnings, ...result.warnings] };
  return completeMetadataResult(
    selected,
    materialization.partial ? "partial" : "full",
    materialization.partial ? ["JPEG scan data was intentionally not read."] : [],
    materialization.partial && materialization.bytesRead !== undefined
      ? { bytesRead: materialization.bytesRead, ...(materialization.inputBytes === undefined ? {} : { inputBytes: materialization.inputBytes }) }
      : undefined,
    materialization.telemetry,
  );
}

export { DEFAULT_LIMITS };
export type { MetadataInput, MetadataResult, ParseOptions };
