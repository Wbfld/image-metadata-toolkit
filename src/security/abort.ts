import { MetadataError } from "../types.js";

/** Throw the package's stable cancellation error when a caller has aborted. */
export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new MetadataError("ABORTED", "Metadata operation was aborted.");
}
