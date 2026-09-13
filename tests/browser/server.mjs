import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const t04FixturePath = globalThis.process?.env.C2PA_T04_FIXTURE;
const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".wasm", "application/wasm"],
]);

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
  if (pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><title>browser-image-metadata browser test</title><script type="importmap">${JSON.stringify({ imports: { "@contentauth/c2pa-web": "/node_modules/@contentauth/c2pa-web/dist/index.js", highgain: "/node_modules/highgain/dist/index.js" } })}</script>`);
    return;
  }
  if (pathname === "/c2pa-t04-fixture.jpg" && t04FixturePath !== undefined) {
    try {
      response.writeHead(200, { "content-type": "image/jpeg" });
      createReadStream(t04FixturePath).pipe(response);
    } catch {
      response.writeHead(404).end();
    }
    return;
  }
  const target = resolve(root, `.${pathname}`);
  if (!target.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    if (!(await stat(target)).isFile()) throw new Error("not a file");
    response.writeHead(200, { "content-type": contentTypes.get(extname(target)) ?? "application/octet-stream" });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(4173, "127.0.0.1");
