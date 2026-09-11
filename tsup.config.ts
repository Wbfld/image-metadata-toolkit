import { defineConfig } from "tsup";

const entry = ["src/index.ts", "src/detect.ts", "src/jpeg.ts", "src/mini.ts", "src/redact.ts", "src/xmp.ts", "src/xmp-rgrove.ts", "src/worker.ts"];
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
