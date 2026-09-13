import { defineConfig } from "tsup";

const entry = ["src/index.ts", "src/adapters.ts", "src/detect.ts", "src/edit.ts", "src/fetch.ts", "src/http.ts", "src/iptc.ts", "src/jpeg.ts", "src/jpeg-writer.ts", "src/mini.ts", "src/node.ts", "src/node-browser.ts", "src/png-writer.ts", "src/preservation.ts", "src/redact.ts", "src/tiff.ts", "src/webp-writer.ts", "src/xmp.ts", "src/xmp-rgrove.ts", "src/worker.ts", "src/browser-thumbnail.ts"];
const shared = {
  entry,
  sourcemap: true,
  target: "es2022",
  platform: "neutral" as const,
  external: ["@rgrove/parse-xml"],
  treeshake: true,
};

export default defineConfig([
  {
    ...shared,
    format: ["esm"],
    clean: true,
    splitting: true,
    dts: true,
  },
  {
    ...shared,
    format: ["cjs"],
    clean: false,
    splitting: false,
    dts: true,
  },
]);
