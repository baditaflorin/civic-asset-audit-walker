import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeImportText,
  canonicalImportExport
} from "../src/features/importer/importEngine";
import type { AssetKind, Condition } from "../src/lib/schema";

type ExpectedFixture = {
  minReports: number;
  assetKinds: Partial<Record<AssetKind, number>>;
  conditions: Partial<Record<Condition, number>>;
  tags: string[];
  issueCodes: string[];
  minConfidence: number;
  deterministic: boolean;
};

const fixtureDir = join(process.cwd(), "test/fixtures/realdata");
const expectedFiles = readdirSync(fixtureDir)
  .filter((file) => file.endsWith(".expected.json"))
  .sort();

describe("real-data import fixtures", () => {
  for (const expectedFile of expectedFiles) {
    const id = expectedFile.replace(".expected.json", "");
    const inputFile = readdirSync(fixtureDir).find((file) => file.startsWith(`${id}.input.`));

    if (!inputFile) {
      throw new Error(`Missing input file for ${id}`);
    }

    it(`${id} produces expected import behavior`, async () => {
      const expected = JSON.parse(
        readFileSync(join(fixtureDir, expectedFile), "utf8")
      ) as ExpectedFixture;
      const input = readFileSync(join(fixtureDir, inputFile), "utf8");

      const first = await analyzeImportText(input, { filename: inputFile });
      const second = await analyzeImportText(input, { filename: inputFile });

      expect(first.reports.length).toBeGreaterThanOrEqual(expected.minReports);

      for (const [kind, count] of Object.entries(expected.assetKinds)) {
        expect(
          first.reports.filter((report) => report.assetKind === kind).length
        ).toBeGreaterThanOrEqual(count);
      }

      for (const [condition, count] of Object.entries(expected.conditions)) {
        expect(
          first.reports.filter((report) => report.condition === condition).length
        ).toBeGreaterThanOrEqual(count);
      }

      for (const tag of expected.tags) {
        expect(first.reports.map((report) => report.assetTag)).toContain(tag);
      }

      for (const code of expected.issueCodes) {
        expect(first.issues.map((issue) => issue.code)).toContain(code);
      }

      for (const report of first.reports) {
        expect(report.confidence?.overall ?? 0).toBeGreaterThanOrEqual(expected.minConfidence);
        expect(report.provenance?.sourceType).toBeTruthy();
      }

      if (expected.deterministic) {
        expect(canonicalImportExport(first.reports)).toBe(
          canonicalImportExport(second.reports)
        );
      }

      if (Buffer.byteLength(input, "utf8") < 1024 * 1024) {
        expect(first.stats.durationMs).toBeLessThan(1000);
      }
    });
  }
});
