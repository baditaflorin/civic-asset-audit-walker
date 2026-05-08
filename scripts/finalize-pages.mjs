import { copyFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const version = process.env.npm_package_version ?? "0.1.0";
let commit = "local";

try {
  commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
} catch {
  commit = "local";
}

await copyFile("docs/index.html", "docs/404.html");
await writeFile(
  "docs/version.json",
  `${JSON.stringify({ version, commit, generatedAt: new Date().toISOString() }, null, 2)}\n`
);
