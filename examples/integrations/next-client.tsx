"use client";

import { useState } from "react";
import { parseMetadata, type MetadataResult } from "browser-image-metadata";

export default function MetadataPicker() {
  const [result, setResult] = useState<MetadataResult | null>(null);
  return <input type="file" accept="image/*" onChange={async (event) => {
    const file = event.currentTarget.files?.[0];
    if (file) setResult(await parseMetadata(file, { scope: "jpeg-header" }));
  }} />;
}
