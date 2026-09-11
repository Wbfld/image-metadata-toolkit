import type { MetadataResult, ParseCompleteness, ParsedMetadataResult, RedactOptions, RedactionOutcome, RedactionResult, SurgeryResult } from "./types.js";

/** Add the common public completeness annotation after a container parser finishes. */
export function completeMetadataResult(
  result: ParsedMetadataResult,
  scope: ParseCompleteness["scope"] = "full",
  scopeReasons: readonly string[] = [],
  rangeInfo?: Pick<ParseCompleteness, "bytesRead" | "inputBytes">,
): MetadataResult {
  const reasons = result.warnings
    .filter((warning) => warning.severity === "error" || warning.code === "UNSUPPORTED_FORMAT")
    .map((warning) => warning.code);
  const completeness: ParseCompleteness = {
    complete: reasons.length === 0,
    scope,
    reasons: [...new Set([...scopeReasons, ...reasons])],
    ...(rangeInfo?.bytesRead === undefined ? {} : { bytesRead: rangeInfo.bytesRead }),
    ...(rangeInfo?.inputBytes === undefined ? {} : { inputBytes: rangeInfo.inputBytes }),
  };
  return { ...result, completeness };
}

/** Add an explicit outcome to container surgery results. */
export function completeRedactionResult(result: SurgeryResult, options: Pick<RedactOptions, "remove">): RedactionResult {
  const failedWarnings = result.warnings.filter((warning) => warning.code === "REDACTION_SKIPPED" || warning.severity === "error");
  const unapplied = options.remove.filter((target) => failedWarnings.some((warning) => warning.message.includes(target)))
    .filter((target, index, values) => values.indexOf(target) === index);
  const reasons = failedWarnings.map((warning) => warning.message);
  if (failedWarnings.length > 0 && unapplied.length === 0) unapplied.push(...options.remove.filter((target, index, values) => values.indexOf(target) === index));
  const outcome: RedactionOutcome = {
    successful: failedWarnings.length === 0,
    complete: failedWarnings.length === 0,
    unapplied,
    reasons,
  };
  return { ...result, outcome };
}
