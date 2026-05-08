import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 4173);
const base = "/civic-asset-audit-walker";
const root = "docs";

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".map", "application/json; charset=utf-8"]
]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/") {
    pathname = `${base}/`;
  }

  if (!pathname.startsWith(base)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const stripped = pathname.slice(base.length) || "/";
  const relative = stripped === "/" ? "index.html" : stripped.replace(/^\/+/, "");
  const safePath = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = join(root, safePath);

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = join(filePath, "index.html");
    }
  } catch {
    filePath = join(root, "404.html");
  }

  try {
    await stat(filePath);
    response.writeHead(200, {
      "Content-Type": types.get(extname(filePath)) ?? "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(500);
    response.end(await readFile(join(root, "index.html"), "utf8"));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving http://127.0.0.1:${port}${base}/`);
});
