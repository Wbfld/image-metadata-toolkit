import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("S06 high-volume fuzz command contract", () => {
  it("fails closed when the required fixture directory is absent", () => {
    const result = spawnSync(process.execPath, ["scripts/s06-high-volume-fuzz.mjs"], {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      env: { ...process.env, S06_FUZZ_FIXTURE_ROOT: "/private/tmp/image-metadata-toolkit/no-such-s06-fixtures" },
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("fixture directory does not exist");
  });

  it("fails closed when no fixture directory is configured", () => {
    const environment = { ...process.env };
    delete environment.S06_FUZZ_FIXTURE_ROOT;
    const result = spawnSync(process.execPath, ["scripts/s06-high-volume-fuzz.mjs"], { cwd: new URL("..", import.meta.url), encoding: "utf8", env: environment });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain("S06_FUZZ_FIXTURE_ROOT is required");
  });
});
