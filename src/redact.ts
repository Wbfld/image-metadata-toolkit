import { materializeInput } from "./input.js";
import { attachRedactionOperationEvidence, redactBytes, redactExactMetadata, redactionPreflightResult, resolveRedactionOptions } from "./privacy/redact.js";
import { completeRedactionResult } from "./result.js";
import { throwIfAborted } from "./security/abort.js";
import { resolveLimits } from "./security/limits.js";
import type { LegacyRedactionTarget, MetadataInput, RedactOptions, RedactionResult, RedactionSelector, RedactionTarget } from "./types.js";

/** Redact JPEG, PNG, or WebP metadata without importing metadata readers. */
export async function redactMetadata(input: MetadataInput, options: RedactOptions): Promise<RedactionResult> {
  const limits = resolveLimits(options.limits);
  throwIfAborted(options.signal);
  const bytes = await materializeInput(input, limits, options.signal);
  throwIfAborted(options.signal);
  const resolution = await resolveRedactionOptions(bytes, options, limits);
  const exactRemoval = resolution.exact.some((mapping) => options.remove.includes(mapping.request) && mapping.addresses.length > 0);
  const surgery = resolution.options === null
    ? redactionPreflightResult(bytes, resolution)
    : exactRemoval
      ? await redactExactMetadata(bytes, options, resolution, limits)
      : redactBytes(bytes, resolution.options, limits);
  const completed = completeRedactionResult(attachRedactionOperationEvidence(surgery, options, resolution), options, resolution.mappings);
  if (resolution.mappings.some(({ request }) => typeof request !== "string")) {
    const mapped = resolution.mappings.map(({ request, legacyTargets }) => {
      const direct = completed.removed.find((record) => record.target === request);
      if (direct !== undefined) return direct;
      return { target: request, occurrences: completed.removed.filter((record) => typeof record.target === "string" && legacyTargets.includes(record.target)).reduce((total, record) => total + record.occurrences, 0) };
    }).filter(({ occurrences }) => occurrences > 0);
    return { ...completed, removed: mapped };
  }
  return completed;
}

export type { LegacyRedactionTarget, MetadataInput, RedactOptions, RedactionResult, RedactionSelector, RedactionTarget };
