import type { MetadataWarning, SecurityLimits } from "../types.js";

/**
 * Bounded warning collection shared by parsers and privacy operations.
 *
 * Warnings are diagnostic output, so a malformed input must not be able to
 * allocate an unbounded array while the operation is already being limited.
 */
export class WarningCollector {
  private readonly items: MetadataWarning[] = [];

  public constructor(private readonly limits: SecurityLimits) {}

  public add(warning: MetadataWarning): void {
    if (this.items.length < this.limits.maxWarnings) this.items.push(warning);
  }

  public addMany(warnings: readonly MetadataWarning[]): void {
    for (const warning of warnings) this.add(warning);
  }

  public get length(): number {
    return this.items.length;
  }

  public some(predicate: (warning: MetadataWarning) => boolean): boolean {
    return this.items.some(predicate);
  }

  public toArray(): readonly MetadataWarning[] {
    return this.items.slice();
  }
}
