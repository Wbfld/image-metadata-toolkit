export const REPORT_SCHEMA: string;
export const METRIC_KEYS: readonly string[];
export const NORMALIZATION_POLICY: {
  readonly id: string;
  readonly description: string;
  readonly rules: readonly string[];
};
export function validateRegistry(registry: unknown): unknown;
export function validateAllowlist(allowlist: unknown): unknown;
export function sha256(bytes: Uint8Array): string;
export function canonicalJson(value: unknown): string;
export function sha256Json(value: unknown): string;
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
  fieldId: string;
  family: string;
  status: string;
  local?: unknown;
  localCandidates?: unknown[];
  reference?: unknown;
  metrics: CorpusMetrics;
}
export interface CorpusFixture {
  fixture: string;
  bytes: number | null;
  sha256: string | null;
  format: string | null;
  producer: string;
  rows: CorpusRow[];
  error?: string;
}
export interface CorpusSummary {
  totals: CorpusMetrics;
  byField: Array<CorpusMetrics & { field: string; key: string; family: string }>;
  byTag: Array<CorpusMetrics & { field: string; key: string; family: string }>;
  byProducer: Array<CorpusMetrics & { producer: string }>;
  byProducerField: Array<CorpusMetrics & { field: string; key: string; family: string; producer: string }>;
  byFormat: Array<CorpusMetrics & { format: string }>;
  byFormatField: Array<CorpusMetrics & { field: string; key: string; family: string; format: string }>;
}
export function compareFixture(input: {
  relativePath: string;
  hash?: string;
  bytes: Uint8Array;
  result: {
    format?: string;
    dimensions: { width: number; height: number } | null;
    fields: ReadonlyArray<{ name: string; ifd?: string; raw?: unknown; value: unknown }>;
    exif?: { fields: ReadonlyArray<{ name: string; ifd?: string; raw?: unknown; value: unknown }> } | null;
    iptc?: { fields: ReadonlyArray<{ name: string; ifd?: string; raw?: unknown; value: unknown }> } | null;
    blocks: ReadonlyArray<{ family: string; offset?: number }>;
    xmp: { packets: readonly string[] } | null;
    warnings: readonly unknown[];
  };
  external: Record<string, unknown>;
  registry: { fields: readonly unknown[]; blocks: readonly unknown[] };
}): CorpusFixture;
export function summarize(fixtures: readonly CorpusFixture[]): CorpusSummary;
export function evaluateGate(input: { fixtures: readonly CorpusFixture[]; summary: CorpusSummary; minimumFixtures?: number; maxMissingLocalRate?: number; maxMismatched?: number; allowlist?: { entries: readonly unknown[] }; currentVersion?: string }): { passed: boolean; failures: string[]; missingLocalRate: number; maxMissingLocalRate: number; mismatched: number; minimumFixtures: number; thresholds: { maxMissingLocalRate: number; maxMismatched: number; maxFixtureErrors: number }; observed: { fixtureCount: number; fixtureErrors: number; referencePresent: number; missingLocal: number; mismatched: number } };
export function renderMarkdown(report: { schema: string; corpus: { fixtureCount: number; source?: string; commit?: string; pinnedCommit?: string; totalBytes?: number }; gate: { passed: boolean; minimumFixtures: number; missingLocalRate: number; maxMissingLocalRate?: number; mismatched?: number; thresholds?: { maxMissingLocalRate?: number; maxMismatched?: number }; observed?: { mismatched?: number }; failures: readonly string[] }; package?: { name?: string; version?: string }; reference?: { tool?: string; package?: string; version?: string }; registry?: { version?: number; sha256?: string }; allowlist?: { version?: number; sha256?: string }; normalization?: { id?: string; sha256?: string }; summary: CorpusSummary; fixtures: readonly CorpusFixture[] }): string;
