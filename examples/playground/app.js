import { getMetadataSummary, parseMetadata, sanitizeMetadata } from "../../dist/index.js";

const image = document.querySelector("#image");
const sanitize = document.querySelector("#sanitize");
const status = document.querySelector("#status");
const summary = document.querySelector("#summary");
const warnings = document.querySelector("#warnings");
const raw = document.querySelector("#raw");
const sanitized = document.querySelector("#sanitized");

function stringify(value) {
  return JSON.stringify(value, (_key, item) => item instanceof Uint8Array ? { byteLength: item.byteLength } : item, 2);
}

image.addEventListener("change", async () => {
  const file = image.files?.[0];
  sanitize.disabled = !file;
  sanitized.textContent = "—";
  if (!file) return;
  status.textContent = `Inspecting ${file.name} locally…`;
  try {
    const result = await parseMetadata(file);
    status.textContent = `${file.name}: ${result.format.toUpperCase()}`;
    summary.textContent = stringify(getMetadataSummary(result));
    warnings.textContent = stringify({ completeness: result.completeness, warnings: result.warnings });
    raw.textContent = stringify(result);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  }
});

sanitize.addEventListener("click", async () => {
  const file = image.files?.[0];
  if (!file) return;
  sanitize.disabled = true;
  try {
    const result = await sanitizeMetadata(file);
    sanitized.textContent = stringify({
      format: result.format,
      successful: result.successful,
      retained: result.retained,
      reasons: result.reasons,
      warnings: result.warnings,
      outputBytes: result.data?.byteLength ?? null,
    });
  } catch (error) {
    sanitized.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    sanitize.disabled = false;
  }
});
