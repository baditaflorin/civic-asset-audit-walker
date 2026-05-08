import { access, readFile, stat } from "node:fs/promises";

await access("docs/index.html");
await access("docs/404.html");
await access("docs/manifest.webmanifest");

const assets = await stat("docs/assets");
if (!assets.isDirectory()) {
  throw new Error("docs/assets is missing.");
}

const html = await readFile("docs/index.html", "utf8");
if (!html.includes("/civic-asset-audit-walker/assets/")) {
  throw new Error("docs/index.html does not use the GitHub Pages base path.");
}

if (!html.includes('<div id="root"></div>')) {
  throw new Error("docs/index.html does not contain the React root.");
}

console.log("Pages build looks valid.");
