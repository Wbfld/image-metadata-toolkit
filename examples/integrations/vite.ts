import { getMetadataSummary, parseMetadata } from "browser-image-metadata";

export async function inspectSelectedFile(file: File) {
  const result = await parseMetadata(file, {
    select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Model", "Orientation"] },
  });
  return { result, summary: getMetadataSummary(result) };
}
