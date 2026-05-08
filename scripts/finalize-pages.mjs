import { copyFile, writeFile } from "node:fs/promises";

const version = process.env.npm_package_version ?? "0.1.0";
const commit = process.env.VITE_GIT_COMMIT ?? "runtime";

await copyFile("docs/index.html", "docs/404.html");
await writeFile("docs/version.json", `${JSON.stringify({ version, commit }, null, 2)}\n`);
