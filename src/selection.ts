import type { MetadataGroup, MetadataSelection } from "./types.js";

const GROUPS = new Set<MetadataGroup>(["Dimensions", "EXIF", "XMP", "IPTC", "ICC", "JFIF", "PNGText", "Transform", "Nclx"]);

export interface ResolvedSelection {
  readonly groups: ReadonlySet<MetadataGroup> | null;
  readonly tags: ReadonlySet<string> | null;
}

/** Validate and normalize a public parse selection once before dispatch. */
export function resolveSelection(selection: MetadataSelection | undefined): ResolvedSelection {
  if (selection === undefined) return { groups: null, tags: null };
  const groups = new Set<MetadataGroup>();
  if (selection.groups !== undefined) {
    for (const group of selection.groups) {
      if (!GROUPS.has(group)) throw new TypeError(`Unknown metadata group: ${group}`);
      groups.add(group);
    }
  }
  const tags = new Set<string>();
  if (selection.tags !== undefined) {
    for (const tag of selection.tags) {
      if (typeof tag !== "string" || tag.length === 0) throw new TypeError("Metadata tag selections must be non-empty strings.");
      tags.add(tag);
    }
    if (tags.size > 0) groups.add("EXIF");
  }
  return { groups, tags: tags.size === 0 ? null : tags };
}

export function wantsGroup(selection: ResolvedSelection | undefined, group: MetadataGroup): boolean {
  return selection === undefined || selection.groups === null || selection.groups.has(group);
}
