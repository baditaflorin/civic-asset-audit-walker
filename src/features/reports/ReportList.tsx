import { Download, FileDown, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { assetKindLabels, conditionLabels } from "../../lib/constants";
import type { AuditReport } from "../../lib/schema";
import { downloadText, parseReportImport, reportsToCsv, reportsToJson } from "./exportReports";

type ReportListProps = {
  reports: AuditReport[];
  onDelete: (id: string) => Promise<void>;
  onImport: (
    reports: AuditReport[]
  ) => Promise<{ added: number; updated: number; skipped: number }>;
  onReset: () => Promise<void>;
  onMessage: (message: string) => void;
};

export default function ReportList({
  reports,
  onDelete,
  onImport,
  onReset,
  onMessage
}: ReportListProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [resetArmed, setResetArmed] = useState(false);

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const imported = parseReportImport(await file.text());
      const result = await onImport(
        imported.map((report) => ({ ...report, source: "import" }))
      );
      onMessage(
        `Imported ${result.added} new, updated ${result.updated}, skipped ${result.skipped}.`
      );
    } catch {
      onMessage("Import failed. Use a Civic Asset Audit Walker JSON export.");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function exportJson() {
    downloadText("civic-asset-audit-reports.json", reportsToJson(reports), "application/json");
  }

  function exportCsv() {
    downloadText("civic-asset-audit-reports.csv", reportsToCsv(reports), "text/csv");
  }

  async function handleReset() {
    if (!resetArmed) {
      setResetArmed(true);
      onMessage("Press reset again to clear local reports.");
      return;
    }

    await onReset();
    setResetArmed(false);
    onMessage("Local reports cleared.");
  }

  return (
    <section className="surface report-list">
      <div className="section-heading">
        <h2>Local reports</h2>
        <span>{reports.length}</span>
      </div>

      <div className="toolbar">
        <button
          className="ghost-button"
          disabled={reports.length === 0}
          onClick={exportJson}
          type="button"
        >
          <Download size={16} />
          JSON
        </button>
        <button
          className="ghost-button"
          disabled={reports.length === 0}
          onClick={exportCsv}
          type="button"
        >
          <FileDown size={16} />
          CSV
        </button>
        <button
          className="ghost-button"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Upload size={16} />
          Import
        </button>
        <button
          className="icon-button danger"
          onClick={handleReset}
          title="Reset local reports"
          type="button"
        >
          <Trash2 size={16} />
        </button>
        <input
          accept="application/json,.json"
          hidden
          onChange={(event) => void handleImport(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />
      </div>

      <div className="report-stack">
        {reports.length === 0 ? (
          <p className="empty-state">No local reports yet.</p>
        ) : (
          reports.slice(0, 8).map((report) => (
            <article className="report-row" key={report.id}>
              <div>
                <strong>{report.assetTag}</strong>
                <span>
                  {assetKindLabels[report.assetKind]} · {conditionLabels[report.condition]}
                </span>
                <small>{new Date(report.createdAt).toLocaleString()}</small>
              </div>
              <button
                className="icon-button"
                onClick={() => void onDelete(report.id)}
                title="Delete report"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
