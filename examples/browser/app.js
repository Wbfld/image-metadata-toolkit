import { parseMetadata } from "../../dist/index.js";

const input = document.querySelector("#image");
const output = document.querySelector("#output");

input.addEventListener("change", async () => {
  const [file] = input.files;
  if (!file) return;
  try {
    const result = await parseMetadata(file);
    output.textContent = JSON.stringify(result, (_key, value) => value instanceof Uint8Array ? [...value] : value, 2);
  } catch (error) {
    output.textContent = error instanceof Error ? error.message : String(error);
  }
});
