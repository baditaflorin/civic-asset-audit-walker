import { auditReportSchema, type AuditReport } from "../../lib/schema";

export function parseReportImport(text: string): AuditReport[] {
  const parsed: unknown = JSON.parse(text);
  const reports = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null && "reports" in parsed
      ? (parsed as { reports: unknown }).reports
      : [];

  return auditReportSchema.array().parse(reports);
}

export function reportsToJson(reports: AuditReport[]): string {
  return JSON.stringify(
    {
      type: "caw.export.v1",
      exportedAt: new Date().toISOString(),
      reports
    },
    null,
    2
  );
}

export function reportsToCsv(reports: AuditReport[]): string {
  const header = [
    "id",
    "assetTag",
    "assetKind",
    "condition",
    "lat",
    "lng",
    "accuracy",
    "notes",
    "createdAt",
    "updatedAt",
    "source"
  ];

  const rows = reports.map((report) => [
    report.id,
    report.assetTag,
    report.assetKind,
    report.condition,
    report.location?.lat ?? "",
    report.location?.lng ?? "",
    report.location?.accuracy ?? "",
    report.notes,
    report.createdAt,
    report.updatedAt,
    report.source
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadText(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }
  return `"${text.replaceAll('"', '""')}"`;
}
