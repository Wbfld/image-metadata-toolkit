import { getMetadataSummary, parseMetadata } from "npm:browser-image-metadata@^0.5.0";

const path = Deno.args[0];
if (!path) throw new Error("Usage: deno run --allow-read examples/integrations/deno.ts image.jpg");
const result = await parseMetadata(await Deno.readFile(path));
console.log(getMetadataSummary(result));
