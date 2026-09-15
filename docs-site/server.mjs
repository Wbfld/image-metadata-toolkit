/* global console */
import { createReadStream, promises as fs } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, resolve, sep } from "node:path";
import process from "node:process";
import { URL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const site = resolve(import.meta.dirname);
const contentTypes = new Map([[".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".json", "application/json; charset=utf-8"], [".css", "text/css; charset=utf-8"], [".md", "text/markdown; charset=utf-8"]]);
const localCsp = "default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'none'; frame-ancestors 'none'; connect-src 'none'; img-src 'self' blob:; script-src 'self'; style-src 'self';";
const fetchCsp = "default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'none'; frame-ancestors 'none'; connect-src 'self' https:; img-src 'self' blob:; script-src 'self'; style-src 'self';";
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "docs-site/index.html" : pathname.replace(/^\//u, "");
  const target = resolve(root, normalize(relative));
  if (!target.startsWith(`${site}${sep}`) && !target.startsWith(`${resolve(root, "dist")}${sep}`) && !target.startsWith(`${resolve(root, "tests/browser")}${sep}`)) { response.writeHead(403); response.end(); return; }
  try {
    const stat = await fs.stat(target); if (!stat.isFile()) throw new Error("not a file");
    const isDocs = target.startsWith(`${site}${sep}`); response.setHeader("content-type", contentTypes.get(extname(target)) ?? "application/octet-stream");
    if (isDocs) response.setHeader("content-security-policy", target.endsWith("fetch-demo.html") || target.endsWith("fetch-demo.js") ? fetchCsp : localCsp);
    response.writeHead(200); createReadStream(target).pipe(response);
  } catch { response.writeHead(404); response.end(); }
});
const port = Number(process.env.DOCS_PORT ?? 4174);
server.listen(port, "127.0.0.1", () => console.log(`Documentation site listening at http://127.0.0.1:${port}/docs-site/index.html`));
