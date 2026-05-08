import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { auditReportSchema, type AuditReport } from "./schema";

type CivicAuditDB = DBSchema & {
  reports: {
    key: string;
    value: AuditReport;
    indexes: {
      "by-updated": string;
      "by-asset-tag": string;
    };
  };
};

const DB_NAME = "civic-asset-audit-walker";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CivicAuditDB>> | undefined;

function getDb(): Promise<IDBPDatabase<CivicAuditDB>> {
  dbPromise ??= openDB<CivicAuditDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const reports = db.createObjectStore("reports", { keyPath: "id" });
      reports.createIndex("by-updated", "updatedAt");
      reports.createIndex("by-asset-tag", "assetTag");
    }
  });

  return dbPromise;
}

export async function listReports(): Promise<AuditReport[]> {
  const db = await getDb();
  const reports = await db.getAll("reports");
  return reports
    .map((report) => auditReportSchema.parse(report))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function saveReport(report: AuditReport): Promise<void> {
  const db = await getDb();
  await db.put("reports", auditReportSchema.parse(report));
}

export async function saveReports(reports: AuditReport[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("reports", "readwrite");

  await Promise.all(reports.map((report) => tx.store.put(auditReportSchema.parse(report))));
  await tx.done;
}

export async function deleteReport(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("reports", id);
}

export async function clearReports(): Promise<void> {
  const db = await getDb();
  await db.clear("reports");
}
