/**
 * Sparse JPEG parser input. Structural bytes retain their original offsets,
 * while selected segment payloads may be materialized independently.
 */
export interface JpegByteView {
  readonly length: number;
  byteAt(offset: number): number | undefined;
  subarray(start: number, end: number): Uint8Array;
  isMaterialized(start: number, end: number): boolean;
}
