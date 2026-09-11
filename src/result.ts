import type { MetadataBlockStatus, MetadataCoverage, MetadataCoverageReasonCode, MetadataCoverageState, MetadataResult, ParseCompleteness, ParsedMetadataResult, ReadTelemetry, RedactOptions, RedactionOutcome, RedactionResult, SurgeryResult } from "./types.js";

function blockCoverage(status: MetadataBlockStatus): MetadataCoverageState {
  if (status === "decoded") return "complete";
  if (status === "skipped") return "skipped-by-selection";
  return status;
}

function deriveCoverage(
  result: ParsedMetadataResult,
  scope: ParseCompleteness["scope"],
  scopeReasons: readonly string[],
  parserReasons: readonly string[],
): MetadataCoverage {
  const blocks = result.blocks ?? [];
  const reasons = [];
  if (scope === "partial") reasons.push({ code: "REQUEST_SCOPE_LIMITED" as const, message: scopeReasons.join(" ") || "The requested operation inspected a bounded scope." });
  for (const code of parserReasons) reasons.push({ code: code as MetadataCoverageReasonCode, message: `The parser reported ${code}.` });
  for (const block of blocks) {
    const state = blockCoverage(block.status);
    if (state === "skipped-by-selection") reasons.push({ code: "BLOCK_SKIPPED_BY_SELECTION" as const, message: `${block.container} was skipped by selection.` });
    else if (state === "partial") reasons.push({ code: "BLOCK_PARTIAL" as const, message: `${block.container} was only partially inspected.` });
    else if (state === "malformed") reasons.push({ code: "BLOCK_MALFORMED" as const, message: `${block.container} is malformed.` });
    else if (state === "opaque") reasons.push({ code: "BLOCK_OPAQUE" as const, message: `${block.container} is opaque.` });
  }
  const states = blocks.map((block) => blockCoverage(block.status));
  const wholeFile = states.includes("malformed") ? "malformed"
    : states.includes("opaque") ? "opaque"
      : states.includes("partial") || scope === "partial" ? "partial"
        : states.includes("skipped-by-selection") ? "skipped-by-selection"
          : parserReasons.includes("UNSUPPORTED_FORMAT") ? "unsupported" : "complete";
  const requested = result.format === "unknown" || parserReasons.includes("UNSUPPORTED_FORMAT") ? "unsupported"
    : parserReasons.length > 0 ? "malformed"
      : scope === "partial" ? "partial" : "complete";
  return { requested, wholeFile, reasons, unclassifiedBlockIds: blocks.filter((block) => blockCoverage(block.status) !== "complete").map((block) => block.id) };
}

/** Add the common public completeness annotation after a container parser finishes. */
export function completeMetadataResult(
  result: ParsedMetadataResult,
  scope: ParseCompleteness["scope"] = "full",
  scopeReasons: readonly string[] = [],
  rangeInfo?: Pick<ParseCompleteness, "bytesRead" | "inputBytes">,
  telemetry?: ReadTelemetry,
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
  const blocks = (result.blocks ?? []).map((block) => ({ ...block, coverage: blockCoverage(block.status) }));
  return { ...result, blocks, coverage: deriveCoverage({ ...result, blocks }, scope, scopeReasons, reasons), completeness, ...(telemetry === undefined ? {} : { telemetry }) };
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
