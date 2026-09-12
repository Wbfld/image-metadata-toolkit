export const REPORT_SCHEMA: string;
export const METRIC_KEYS: readonly string[];
export function validateRegistry(registry: unknown): unknown;
export function validateAllowlist(allowlist: unknown): unknown;
export function sha256(bytes: Uint8Array): string;
export interface CorpusMetrics {
  found: number;
  matched: number;
  normalizedMatch: number;
  mismatched: number;
  missingLocal: number;
  missingReference: number;
}
export interface CorpusRow {
  key: string;
  family: string;
  status: string;
  local?: unknown;
  localCandidates?: unknown[];
  reference?: unknown;
  metrics: CorpusMetrics;
}
export interface CorpusFixture {
  fixture: string;
  sha256: string | null;
  format: string | null;
  producer: string;
  rows: CorpusRow[];
  error?: string;
}
export interface CorpusSummary {
  totals: CorpusMetrics;
  byTag: Array<CorpusMetrics & { key: string; family: string }>;
  byProducer: Array<CorpusMetrics & { key: string; family: string; producer: string }>;
}
export function compareFixture(input: {
  relativePath: string;
  hash?: string;
  bytes: Uint8Array;
  result: {
    format?: string;
    dimensions: { width: number; height: number } | null;
    fields: ReadonlyArray<{ name: string; ifd?: string; raw?: unknown; value: unknown }>;
    exif?: { fields: ReadonlyArray<{ name: string; raw?: unknown; value: unknown }> } | null;
    blocks: ReadonlyArray<{ family: string; offset?: number }>;
    xmp: { packets: readonly string[] } | null;
    warnings: readonly unknown[];
  };
  external: Record<string, unknown>;
  registry: { fields: readonly unknown[]; blocks: readonly unknown[] };
}): CorpusFixture;
export function summarize(fixtures: readonly CorpusFixture[]): CorpusSummary;
export function evaluateGate(input: { fixtures: readonly CorpusFixture[]; summary: CorpusSummary; minimumFixtures?: number; maxMissingLocalRate?: number; allowlist?: { entries: readonly unknown[] }; currentVersion?: string }): { passed: boolean; failures: string[]; missingLocalRate: number; maxMissingLocalRate: number; minimumFixtures: number };
export function renderMarkdown(report: { schema: string; corpus: { fixtureCount: number }; gate: { passed: boolean; minimumFixtures: number; missingLocalRate: number; maxMissingLocalRate: number; failures: readonly string[] }; summary: CorpusSummary; fixtures: readonly CorpusFixture[] }): string;
