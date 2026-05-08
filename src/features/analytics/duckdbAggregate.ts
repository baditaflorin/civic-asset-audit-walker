import type * as DuckDB from "@duckdb/duckdb-wasm";
import type { AuditReport } from "../../lib/schema";
import { aggregateReports, type AuditAggregate } from "./aggregate";

type DuckRow = {
  assetKind?: string;
  condition?: string;
  count?: number | bigint;
  riskScore?: number | bigint;
};

let dbPromise: Promise<DuckDB.AsyncDuckDB> | null = null;

export async function runDuckDbAggregate(reports: AuditReport[]): Promise<AuditAggregate[]> {
  if (reports.length === 0) {
    return [];
  }

  try {
    const duckdb = await import("@duckdb/duckdb-wasm");
    const db = await getDuckDb(duckdb);
    const conn = await db.connect();
    await db.registerFileText("reports.json", JSON.stringify(reports));
    await conn.query("DROP TABLE IF EXISTS reports");
    await conn.query("CREATE TABLE reports AS SELECT * FROM read_json_auto('reports.json')");
    const table = await conn.query(`
      SELECT
        assetKind,
        condition,
        count(*)::INTEGER AS count,
        sum(CASE condition
          WHEN 'good' THEN 0
          WHEN 'watch' THEN 1
          WHEN 'needs_repair' THEN 2
          WHEN 'missing' THEN 3
          WHEN 'unsafe' THEN 4
          ELSE 0
        END)::INTEGER AS riskScore
      FROM reports
      GROUP BY assetKind, condition
      ORDER BY riskScore DESC, count DESC
    `);
    await conn.close();

    const rows = table.toArray().map(normalizeDuckRow);
    return rows
      .filter((row): row is Required<DuckRow> => Boolean(row.assetKind && row.condition))
      .map((row) => {
        const fallback = aggregateReports(
          reports.filter(
            (report) => report.assetKind === row.assetKind && report.condition === row.condition
          )
        )[0];

        return {
          ...fallback,
          count: Number(row.count),
          riskScore: Number(row.riskScore)
        };
      });
  } catch {
    return aggregateReports(reports);
  }
}

async function getDuckDb(duckdb: typeof DuckDB): Promise<DuckDB.AsyncDuckDB> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    const bundles = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(bundles);
    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker ?? ""}");`], { type: "text/javascript" })
    );
    const worker = new Worker(workerUrl);
    const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(workerUrl);
    return db;
  })();

  return dbPromise;
}

function normalizeDuckRow(row: unknown): DuckRow {
  if (typeof row === "object" && row !== null && "toJSON" in row) {
    const json = (row as { toJSON: () => unknown }).toJSON();
    return normalizeDuckRow(json);
  }

  if (typeof row !== "object" || row === null) {
    return {};
  }

  const record = row as Record<string, unknown>;
  return {
    assetKind: stringValue(record.assetKind),
    condition: stringValue(record.condition),
    count: numberValue(record.count),
    riskScore: numberValue(record.riskScore)
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | bigint | undefined {
  if (typeof value === "number" || typeof value === "bigint") {
    return value;
  }
  return undefined;
}
