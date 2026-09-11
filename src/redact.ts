import { materializeInput } from "./input.js";
import { redactBytes } from "./privacy/redact.js";
import { completeRedactionResult } from "./result.js";
import { resolveLimits } from "./security/limits.js";
import { MetadataError, type MetadataInput, type RedactOptions, type RedactionResult } from "./types.js";

/** Redact JPEG, PNG, or WebP metadata without importing metadata readers. */
export async function redactMetadata(input: MetadataInput, options: RedactOptions): Promise<RedactionResult> {
  const limits = resolveLimits(options.limits);
  if (options.signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
  const bytes = await materializeInput(input, limits);
  if (options.signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
  return completeRedactionResult(redactBytes(bytes, options, limits), options);
}

export type { MetadataInput, RedactOptions, RedactionResult };
