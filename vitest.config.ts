import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "docs/**"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    }
  }
});
