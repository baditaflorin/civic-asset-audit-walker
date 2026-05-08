import { auditReportSchema, type AuditReport } from "./schema";

export type MergeResult = {
  reports: AuditReport[];
  added: number;
  updated: number;
  skipped: number;
};

export function mergeReports(existing: AuditReport[], incoming: AuditReport[]): MergeResult {
  const byId = new Map<string, AuditReport>();
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const report of existing) {
    byId.set(report.id, auditReportSchema.parse(report));
  }

  for (const raw of incoming) {
    const report = auditReportSchema.parse(raw);
    const current = byId.get(report.id);

    if (!current) {
      byId.set(report.id, report);
      added += 1;
      continue;
    }

    if (Date.parse(report.updatedAt) > Date.parse(current.updatedAt)) {
      byId.set(report.id, report);
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  return {
    reports: [...byId.values()].sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    ),
    added,
    updated,
    skipped
  };
}
