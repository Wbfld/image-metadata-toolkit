/** The stable fixture contract for benchmarks and release baselines. */
export const benchmarkFixtures = Object.freeze([
  ["jpeg-full", "jpeg-exif-little-endian.jpg", {}],
  ["jpeg-header-blob", "jpeg-exif-little-endian.jpg", { scope: "jpeg-header" }],
  ["jpeg-metadata-blob", "jpeg-exif-little-endian.jpg", { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Orientation"] } }],
  ["png-full", "png-metadata.png", {}],
  ["png-metadata-blob", "png-metadata.png", { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Orientation"] } }],
  ["webp-full", "webp-metadata.webp", {}],
  ["webp-metadata-blob", "webp-metadata.webp", { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Orientation"] } }],
  ["heif-full", "sips-heic-exif-xmp.heic", {}],
  ["heif-metadata-blob", "heif-item-metadata.heic", { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Orientation"] } }],
  ["avif-full", "libavif-paris-icc-exif-xmp.avif", {}],
  ["avif-metadata-blob", "avif-idat-item-metadata.avif", { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Orientation"] } }],
  ["tiff-metadata-blob", "tiff-metadata.tif", { scope: "metadata", select: { groups: ["Dimensions", "EXIF"], tags: ["Make", "Orientation"] } }],
]);

export function usesBlobInput(options) {
  return options.scope === "jpeg-header" || options.scope === "metadata";
}
