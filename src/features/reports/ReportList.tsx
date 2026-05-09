import { Download, FileDown, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { assetKindLabels, conditionLabels } from "../../lib/constants";
import type { AuditReport } from "../../lib/schema";
import {
  analyzeImportText,
  decodeImportFile,
  type ImportAnalysis,
  type ImportProgress
} from "../importer/importEngine";
import { downloadText, reportsToCsv, reportsToJson } from "./exportReports";

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
  const abortRef = useRef<AbortController | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<ImportAnalysis | null>(null);

  async function handleImport(file: File | undefined) {
    if (!file || importing) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setImporting(true);
    setProgress({ phase: "reading", completed: 0, total: 1 });

    try {
      if (file.size > 5 * 1024 * 1024) {
        onMessage("Large civic file detected. Import is cancellable and will report progress.");
      }

      const text = await decodeImportFile(file);
      controller.signal.throwIfAborted();
      const analysis = await analyzeImportText(text, {
        filename: file.name,
        signal: controller.signal,
        onProgress: setProgress
      });
      setLastAnalysis(analysis);

      if (analysis.reports.length > 0) {
        const result = await onImport(analysis.reports);
        onMessage(
          `Imported ${result.added} new, updated ${result.updated}, skipped ${result.skipped}; ${analysis.issues.length} review notes.`
        );
      } else {
        const first = analysis.issues[0];
        onMessage(first ? `${first.what} ${first.nowWhat}` : "No civic asset rows were found.");
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        onMessage("Import cancelled. Local reports were left unchanged.");
      } else {
        onMessage(
          "Import could not be read. Choose a CSV, JSON, OSM export, 311 export, or field note."
        );
      }
    } finally {
      abortRef.current = null;
      setImporting(false);
      setProgress(null);
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
          disabled={importing}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Upload size={16} />
          {importing ? "Importing" : "Import"}
        </button>
        {importing && (
          <button
            className="ghost-button"
            onClick={() => abortRef.current?.abort()}
            type="button"
          >
            <X size={16} />
            Cancel
          </button>
        )}
        <button
          className="icon-button danger"
          onClick={handleReset}
          title="Reset local reports"
          type="button"
        >
          <Trash2 size={16} />
        </button>
        <input
          accept="application/json,.json,.csv,text/csv,text/plain,.txt"
          hidden
          onChange={(event) => void handleImport(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />
      </div>

      {progress && (
        <p className="import-progress">
          {progress.phase} {progress.total > 1 ? `${progress.completed}/${progress.total}` : ""}
        </p>
      )}

      {lastAnalysis && (
        <div className="import-summary">
          <strong>
            {lastAnalysis.reports.length} candidate reports · {lastAnalysis.stats.shape}
          </strong>
          {lastAnalysis.issues.slice(0, 4).map((issue) => (
            <p key={`${issue.code}:${issue.rowNumber ?? "all"}`}>
              {issue.rowNumber ? `Row ${issue.rowNumber}: ` : ""}
              {issue.what} {issue.nowWhat}
            </p>
          ))}
        </div>
      )}

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
                {report.confidence && (
                  <small>
                    confidence {(report.confidence.overall * 100).toFixed(0)}% ·{" "}
                    {report.provenance?.sourceType ?? "local"}
                  </small>
                )}
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
