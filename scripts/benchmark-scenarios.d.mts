export interface BenchmarkScenario {
  readonly name: string;
  readonly fixture: string;
  readonly contract: string;
  readonly operation: string;
  readonly options: Readonly<Record<string, unknown>>;
}
export const COMMON_EXIF_TAGS: readonly string[];
export const DOCUMENTED_TAGS: readonly string[];
export const benchmarkScenarios: readonly BenchmarkScenario[];
export function canonicalToolkit(result: unknown, scenario: BenchmarkScenario): unknown;
export function canonicalExifReader(result: unknown, scenario: BenchmarkScenario): unknown;
export function canonicalExifr(result: unknown, scenario: BenchmarkScenario): unknown;
export function stableJson(value: unknown): string;
export function semanticDiff(expected: unknown, actual: unknown): { expected: unknown; actual: unknown } | null;
export function assertScenarioContract(outputs: Record<string, unknown>): { passed: boolean; failures: string[]; baseline?: string };
