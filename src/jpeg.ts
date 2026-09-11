import { detectFormat } from "./detect-format.js";
import { materializeInput, materializeJpegHeader } from "./input.js";
import { parseJpeg } from "./parsers/jpeg.js";
import { completeMetadataResult } from "./result.js";
import { resolveSelection } from "./selection.js";
import { DEFAULT_LIMITS, resolveLimits } from "./security/limits.js";
import { MetadataError, type MetadataInput, type MetadataResult, type ParseOptions } from "./types.js";

/** Parse JPEG metadata without importing readers for other image containers. */
export async function parseJpegMetadata(input: MetadataInput, options: ParseOptions = {}): Promise<MetadataResult> {
  const limits = resolveLimits(options.limits);
  if (options.signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
  const headerOnly = options.scope === "jpeg-header" || options.scope === "metadata";
  const bytes = headerOnly ? await materializeJpegHeader(input, limits) : await materializeInput(input, limits);
  if (options.signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
  if (detectFormat(bytes).format !== "jpeg") throw new MetadataError("UNSUPPORTED_FORMAT", "parseJpegMetadata() requires a recognized JPEG input.");
  const selection = resolveSelection(options.select);
  const result = parseJpeg(bytes, limits, { selection, headerOnly });
  return completeMetadataResult(result, headerOnly ? "partial" : "full", headerOnly ? ["JPEG scan data was intentionally not read."] : []);
}

export { DEFAULT_LIMITS };
export type { MetadataInput, MetadataResult, ParseOptions };
