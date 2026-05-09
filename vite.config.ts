import { readFileSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const repoBase = "/civic-asset-audit-walker/";
const releaseCommit = readReleaseCommit();

function readReleaseCommit() {
  const commitFromEnv = process.env.VITE_GIT_COMMIT?.trim();
  if (commitFromEnv) {
    return commitFromEnv;
  }

  try {
    const metadata = JSON.parse(readFileSync("release-metadata.json", "utf8")) as {
      commit?: unknown;
    };
    return typeof metadata.commit === "string" && metadata.commit.trim()
      ? metadata.commit.trim()
      : "unpublished";
  } catch {
    return "unpublished";
  }
}

export default defineConfig({
  base: repoBase,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      base: repoBase,
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        id: repoBase,
        name: "Civic Asset Audit Walker",
        short_name: "Civic Audit",
        description:
          "Scan tagged civic assets, report conditions offline, and exchange anonymous audits peer-to-peer.",
        start_url: repoBase,
        scope: repoBase,
        display: "standalone",
        background_color: "#f7f3ea",
        theme_color: "#006b57",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        sourcemap: false,
        navigateFallback: `${repoBase}index.html`,
        globPatterns: ["**/*.{js,css,html,svg,json,webmanifest,wasm}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: {
                maxEntries: 180,
                maxAgeSeconds: 60 * 60 * 24 * 14
              }
            }
          }
        ]
      }
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.1.0"),
    __GIT_COMMIT__: JSON.stringify(releaseCommit)
  },
  build: {
    outDir: "docs",
    emptyOutDir: false,
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/@tanstack")) {
            return "react";
          }
          if (id.includes("node_modules/leaflet")) {
            return "map";
          }
          if (id.includes("node_modules/@duckdb")) {
            return "duckdb";
          }
          return undefined;
        }
      }
    }
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});
