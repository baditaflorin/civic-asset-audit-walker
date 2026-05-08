import { defineConfig, devices } from "@playwright/test";

const smokePort = process.env.SMOKE_PORT ?? "4173";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30000,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL: `http://127.0.0.1:${smokePort}/civic-asset-audit-walker/`,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
