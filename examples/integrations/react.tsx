import { useState } from "react";
import { getMetadataSummary, parseMetadata, type MetadataSummary } from "browser-image-metadata";

export function MetadataPicker() {
  const [summary, setSummary] = useState<MetadataSummary | null>(null);
  return <input type="file" accept="image/*" onChange={async (event) => {
    const file = event.currentTarget.files?.[0];
    if (file) setSummary(getMetadataSummary(await parseMetadata(file)));
  }} />;
}
