import {
  ClipboardPaste,
  Copy,
  Download,
  FileDown,
  Link2,
  RefreshCcw,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useRef, useState } from "react";
import { assetKindLabels, conditionLabels } from "../../lib/constants";
import type { AuditReport } from "../../lib/schema";
import {
  buildSampleReports,
  describeImportSourceLabel,
  parseWorkspaceSnapshotText,
  type WorkspaceSettings
} from "../../lib/workspace";
import {
  analyzeImportText,
  decodeImportFile,
  type ImportAnalysis,
  type ImportProgress
} from "../importer/importEngine";
import { copyText, downloadText, reportsToCsv, reportsToJson } from "./exportReports";

type ReportListProps = {
  reports: AuditReport[];
  settings: WorkspaceSettings;
  onDelete: (id: string) => Promise<void>;
  onImport: (
    reports: AuditReport[],
    sourceLabel: string
  ) => Promise<{ added: number; updated: number; skipped: number }>;
  onRestoreSnapshot: (snapshotText: string, sourceLabel: string) => Promise<void>;
  onReset: () => Promise<void>;
  onMessage: (message: string) => void;
};

export default function ReportList({
  reports,
  settings,
  onDelete,
  onImport,
  onRestoreSnapshot,
  onReset,
  onMessage
}: ReportListProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [resetArmed, setResetArmed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<ImportAnalysis | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [urlValue, setUrlValue] = useState("");

  async function handleImportFiles(files: File[]) {
    if (files.length === 0 || importing) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setImporting(true);

    try {
      let handled = 0;

      for (const file of files) {
        controller.signal.throwIfAborted();
        setProgress({ phase: "reading", completed: handled, total: files.length });
        const text = await decodeImportFile(file);
        await importTextPayload(text, file.name, "file", controller.signal);
        handled += 1;
      }

      onMessage(
        files.length === 1
          ? `Imported ${describeImportSourceLabel("file")} successfully.`
          : `Imported ${files.length} files. Review notes appear below the toolbar.`
      );
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        onMessage("Import cancelled. Local reports were left unchanged.");
      } else {
        onMessage(
          "Import could not be read. Choose a CSV, JSON, workspace backup, OSM export, 311 export, or field note."
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

  async function importTextPayload(
    text: string,
    sourceLabel: string,
    sourceKind: "file" | "paste" | "clipboard" | "url" | "sample",
    signal?: AbortSignal
  ) {
    const workspaceSnapshot = parseWorkspaceSnapshotText(text);
    if (workspaceSnapshot) {
      await onRestoreSnapshot(text, sourceLabel);
      setLastAnalysis(null);
      return;
    }

    const analysis = await analyzeImportText(text, {
      filename: sourceLabel,
      sourceIdentifier: sourceLabel,
      signal,
      onProgress: setProgress
    });
    setLastAnalysis(analysis);

    if (analysis.reports.length > 0) {
      const result = await onImport(analysis.reports, sourceLabel);
      onMessage(
        `Imported ${result.added} new, updated ${result.updated}, skipped ${result.skipped} from ${describeImportSourceLabel(sourceKind)}; ${analysis.issues.length} review notes.`
      );
      return;
    }

    const first = analysis.issues[0];
    onMessage(first ? `${first.what} ${first.nowWhat}` : "No civic asset rows were found.");
  }

  async function handlePasteImport() {
    if (!pasteValue.trim() || importing) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setImporting(true);

    try {
      await importTextPayload(pasteValue, "pasted-text", "paste", controller.signal);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        onMessage("Paste import cancelled. Local reports were left unchanged.");
      } else {
        onMessage("Pasted text could not be imported. Check the content and try again.");
      }
    } finally {
      abortRef.current = null;
      setImporting(false);
      setProgress(null);
    }
  }

  async function handleClipboardImport() {
    if (importing) {
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        onMessage("Clipboard is empty. Copy JSON, CSV, or field notes first.");
        return;
      }

      setPasteValue(text);
      const controller = new AbortController();
      abortRef.current = controller;
      setImporting(true);
      await importTextPayload(text, "clipboard", "clipboard", controller.signal);
    } catch {
      onMessage("Clipboard import failed. Paste into the text box instead.");
    } finally {
      abortRef.current = null;
      setImporting(false);
      setProgress(null);
    }
  }

  async function handleUrlImport() {
    const url = urlValue.trim();
    if (!url || importing) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setImporting(true);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      await importTextPayload(text, url, "url", controller.signal);
    } catch {
      onMessage(
        "URL import failed. The source may block cross-origin fetches, so use file upload or paste rendered text instead."
      );
    } finally {
      abortRef.current = null;
      setImporting(false);
      setProgress(null);
    }
  }

  async function handleSampleImport() {
    if (importing) {
      return;
    }

    const sampleReports = buildSampleReports();
    const result = await onImport(sampleReports, "sample dataset");
    setLastAnalysis(null);
    onMessage(
      `Loaded sample dataset: ${result.added} new, updated ${result.updated}, skipped ${result.skipped}.`
    );
  }

  function exportJson() {
    downloadText("civic-asset-audit-reports.json", reportsToJson(reports), "application/json");
    onMessage("Downloaded report JSON.");
  }

  function exportCsv() {
    downloadText("civic-asset-audit-reports.csv", reportsToCsv(reports), "text/csv");
    onMessage("Downloaded report CSV.");
  }

  async function copyJson() {
    await copyText(reportsToJson(reports));
    onMessage("Copied report JSON.");
  }

  async function copyCsv() {
    await copyText(reportsToCsv(reports));
    onMessage("Copied report CSV.");
  }

  async function handleReset() {
    if (settings.confirmReset && !resetArmed) {
      setResetArmed(true);
      onMessage("Press reset again to clear saved reports.");
      return;
    }

    await onReset();
    setResetArmed(false);
    setLastAnalysis(null);
    onMessage("Saved reports cleared.");
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
          onClick={() => void exportJson()}
          type="button"
        >
          <Download size={16} />
          JSON
        </button>
        <button
          className="ghost-button"
          disabled={reports.length === 0}
          onClick={() => void exportCsv()}
          type="button"
        >
          <FileDown size={16} />
          CSV
        </button>
        <button
          className="ghost-button"
          disabled={reports.length === 0}
          onClick={() => void copyJson()}
          type="button"
        >
          <Copy size={16} />
          Copy JSON
        </button>
        <button
          className="ghost-button"
          disabled={reports.length === 0}
          onClick={() => void copyCsv()}
          type="button"
        >
          <Copy size={16} />
          Copy CSV
        </button>
        <button
          className="ghost-button"
          disabled={importing}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Upload size={16} />
          {importing ? "Importing" : "Import files"}
        </button>
        <button
          className="ghost-button"
          disabled={importing}
          onClick={handleSampleImport}
          type="button"
        >
          <RefreshCcw size={16} />
          Load sample
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
          onClick={() => void handleReset()}
          title="Clear saved reports"
          type="button"
        >
          <Trash2 size={16} />
        </button>
        <input
          accept="application/json,.json,.csv,text/csv,text/plain,.txt"
          hidden
          multiple
          onChange={(event) => void handleImportFiles(Array.from(event.target.files ?? []))}
          ref={inputRef}
          type="file"
        />
      </div>

      <div
        className={`drop-zone${dragActive ? " active" : ""}`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleImportFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <strong>Drop files, paste text, or fetch a public URL.</strong>
        <span>
          Accepted: report JSON, CSV, TXT field notes, OSM/311 exports, and full workspace
          backups.
        </span>
      </div>

      <div className="field">
        <span>Pasted text</span>
        <textarea
          onChange={(event) => setPasteValue(event.target.value)}
          placeholder="Paste JSON, CSV, or field notes here."
          rows={4}
          value={pasteValue}
        />
      </div>

      <div className="toolbar">
        <button
          className="ghost-button"
          disabled={!pasteValue.trim() || importing}
          onClick={() => void handlePasteImport()}
          type="button"
        >
          <ClipboardPaste size={16} />
          Import paste
        </button>
        <button
          className="ghost-button"
          disabled={importing}
          onClick={() => void handleClipboardImport()}
          type="button"
        >
          <ClipboardPaste size={16} />
          Import clipboard
        </button>
      </div>

      <label className="field">
        <span>Public URL</span>
        <input
          onChange={(event) => setUrlValue(event.target.value)}
          placeholder="https://example.org/export.json"
          type="url"
          value={urlValue}
        />
      </label>

      <div className="toolbar">
        <button
          className="ghost-button"
          disabled={!urlValue.trim() || importing}
          onClick={() => void handleUrlImport()}
          type="button"
        >
          <Link2 size={16} />
          Import URL
        </button>
      </div>

      {progress && (
        <p className="import-progress">
          {progress.phase}{" "}
          {progress.total > 1
            ? `${Math.min(progress.completed + 1, progress.total)}/${progress.total}`
            : ""}
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
