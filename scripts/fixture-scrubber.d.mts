export interface FixtureScrubberOptions {
  readonly input: string;
  readonly report: string;
  readonly output: string | null;
  readonly policy: "share-safe" | "location-safe" | "anonymous" | "retain-rights" | "publisher" | "accessibility" | "forensic-preserve";
  readonly maxInputBytes: number;
}

export interface FixtureScrubberReport {
  readonly status: "passed" | "refused";
  readonly source: { readonly file: string; readonly byteLength: number; readonly sha256: string };
  readonly inspection: { readonly format: string; readonly complete: boolean; readonly safe: boolean; readonly findingsByCategory: Readonly<Record<string, number>>; readonly findingCount: number; readonly warningCount: number; readonly gapCount: number };
  readonly scrub: { readonly successful: boolean; readonly outputGenerated: boolean; readonly outputPathProvided: boolean; readonly outputSha256: string | null; readonly reauditComplete: boolean; readonly retained: readonly unknown[]; readonly warningCount: number; readonly reasonCount: number };
}

export function countBy(values: readonly string[]): Record<string, number>;
export function sha256(value: Uint8Array | string): string;
export function stableReport(report: unknown): string;
export function markdownReport(report: { readonly status: string; readonly policy: { readonly id: string; readonly version: string }; readonly source: { readonly file: string; readonly sha256: string }; readonly inspection: { readonly format: string; readonly complete: boolean; readonly safe: boolean; readonly findingsByCategory: Readonly<Record<string, number>> }; readonly scrub: { readonly successful: boolean; readonly outputGenerated: boolean; readonly outputSha256: string | null; readonly reauditComplete: boolean } }): string;
export function parseArguments(argv: readonly string[]): FixtureScrubberOptions;
export function inspectAndScrub(options: FixtureScrubberOptions): Promise<{ readonly report: FixtureScrubberReport; readonly markdown: string; readonly outputBytes: Uint8Array | null }>;
