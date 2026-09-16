export const REPORT_SCHEMA: string;
export const R05_PHASES: readonly string[];
export const REQUIRED_EXTERNAL_WRITER_SCOPE: readonly string[];

export interface R05Check {
  id: string;
  status: string;
  [key: string]: unknown;
}

export const REQUIRED_AUDIT_CHECKS: readonly string[];

export function evaluateReleaseGate(input: {
  phase?: "prepublication" | "postpublication";
  checks: readonly R05Check[];
  externalReview: { status: string; reason?: string };
  publication: { status: string };
}): {
  phase: "prepublication" | "postpublication";
  passed: boolean;
  automatedPassed: boolean;
  missingChecks: string[];
  failedChecks: Array<{ id: string; status: string; reason: string | null }>;
  externalReview: string;
  publication: string;
  failures: string[];
};

export function validateReport(report: unknown): true;
export function validateExternalReviewRecord(record: unknown): string[];
export function documentationAudit(): Promise<Record<string, unknown>>;
export function packageLicenseAudit(): Promise<Record<string, unknown>>;
export function packageProvenanceAudit(phase?: "prepublication" | "postpublication"): Promise<Record<string, unknown>>;
export function registryProvenanceAudit(packageJson: Record<string, unknown>): Promise<Record<string, unknown>>;
export function expectedDistTag(version: string): string;
export function markdown(report: Record<string, unknown>): string;
