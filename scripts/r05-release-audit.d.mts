export const REPORT_SCHEMA: string;

export interface R05Check {
  id: string;
  status: string;
  [key: string]: unknown;
}

export const REQUIRED_AUDIT_CHECKS: readonly string[];

export function evaluateReleaseGate(input: {
  checks: readonly R05Check[];
  externalReview: { status: string; reason?: string };
  publication: { status: string };
}): {
  passed: boolean;
  automatedPassed: boolean;
  missingChecks: string[];
  failedChecks: Array<{ id: string; status: string; reason: string | null }>;
  externalReview: string;
  publication: string;
  failures: string[];
};

export function validateReport(report: unknown): true;
export function documentationAudit(): Promise<Record<string, unknown>>;
export function packageLicenseAudit(): Promise<Record<string, unknown>>;
export function markdown(report: Record<string, unknown>): string;
