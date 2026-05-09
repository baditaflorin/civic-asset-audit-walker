import { copyFile, readFile, writeFile } from "node:fs/promises";

const version = process.env.npm_package_version ?? "0.1.0";
const commit = await readReleaseCommit();

await copyFile("docs/index.html", "docs/404.html");
await writeFile("docs/version.json", `${JSON.stringify({ version, commit }, null, 2)}\n`);

async function readReleaseCommit() {
  const commitFromEnv = process.env.VITE_GIT_COMMIT?.trim();
  if (commitFromEnv) {
    return commitFromEnv;
  }

  try {
    const metadata = JSON.parse(await readFile("release-metadata.json", "utf8"));
    return typeof metadata.commit === "string" && metadata.commit.trim()
      ? metadata.commit.trim()
      : "unpublished";
  } catch {
    return "unpublished";
  }
}
