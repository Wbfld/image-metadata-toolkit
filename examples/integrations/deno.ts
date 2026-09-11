import { getMetadataSummary, parseMetadata } from "npm:browser-image-metadata@2.0.0-alpha.3";

const path = Deno.args[0];
if (!path) throw new Error("Usage: deno run --allow-read examples/integrations/deno.ts image.jpg");
const result = await parseMetadata(await Deno.readFile(path));
console.log(getMetadataSummary(result));
