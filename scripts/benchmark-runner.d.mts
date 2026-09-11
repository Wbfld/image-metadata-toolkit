export class InstrumentedBlob {
  constructor(bytes: Uint8Array);
  readonly bytes: Uint8Array;
  readonly size: number;
  readonly requests: number;
  readonly bytesRead: number;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice(start: number, end: number): { arrayBuffer(): Promise<ArrayBuffer> };
  telemetry(): { readRequests: number; bytesRead: number };
}
export interface BenchmarkOperationResult {
  output: unknown;
  transport: { mode: string; readRequests: number; bytesRead: number; sourceBytes: number; cacheHits?: number; coalescedReads?: number };
}
export function runBenchmarkOperation(reader: string, bytes: Uint8Array, scenario: unknown, modules: Record<string, unknown>): Promise<BenchmarkOperationResult>;
