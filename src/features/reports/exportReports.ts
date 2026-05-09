import { auditReportSchema, type AuditReport } from "../../lib/schema";
import { canonicalImportExport } from "../importer/importEngine";

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
  return canonicalImportExport(reports);
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
    "source",
    "confidence",
    "sourceType",
    "sourceId",
    "warnings"
  ];

  const rows = [...reports]
    .sort((a, b) => a.assetTag.localeCompare(b.assetTag) || a.id.localeCompare(b.id))
    .map((report) => [
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
      report.source,
      report.confidence?.overall ?? "",
      report.provenance?.sourceType ?? "",
      report.provenance?.sourceId ?? "",
      report.provenance?.warnings.join("; ") ?? ""
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
  const text = neutralizeSpreadsheetFormula(String(value));
  if (!/[",\n]/.test(text)) {
    return text;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

function neutralizeSpreadsheetFormula(value: string): string {
  return /^[=+\-@]/.test(value.trim()) ? `'${value}` : value;
}
