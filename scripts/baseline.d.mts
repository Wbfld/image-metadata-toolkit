export const BASELINE_SCHEMA_VERSION: number;
export const DEFAULT_BASELINE_PATH: string;
export function compareStableFields(expected: unknown, actual: unknown): void;
export function stableJson(value: unknown): string;
export function stableProjection<T>(report: T): T;
export function stableFields<T>(report: T): T;
export function validateBaseline<T>(report: T): T;
export function summarizeTestResults(value: unknown): { files: number; total: number; passed: number; failed: number; skipped: number };
export function parseArgs(argv: readonly string[]): { mode: "stdout" | "verify" | "output"; path: string | null };
