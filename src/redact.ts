import { materializeInput } from "./input.js";
import { redactBytes } from "./privacy/redact.js";
import { completeRedactionResult } from "./result.js";
import { throwIfAborted } from "./security/abort.js";
import { resolveLimits } from "./security/limits.js";
import type { MetadataInput, RedactOptions, RedactionResult } from "./types.js";

/** Redact JPEG, PNG, or WebP metadata without importing metadata readers. */
export async function redactMetadata(input: MetadataInput, options: RedactOptions): Promise<RedactionResult> {
  const limits = resolveLimits(options.limits);
  throwIfAborted(options.signal);
  const bytes = await materializeInput(input, limits, options.signal);
  throwIfAborted(options.signal);
  return completeRedactionResult(redactBytes(bytes, options, limits), options);
}

export type { MetadataInput, RedactOptions, RedactionResult };
