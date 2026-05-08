import { BarChart3, DatabaseZap, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { conditionTone } from "../../lib/constants";
import type { AuditReport } from "../../lib/schema";
import { aggregateReports, reportsNeedingAction, type AuditAggregate } from "./aggregate";
import { runDuckDbAggregate } from "./duckdbAggregate";

type AnalyticsPanelProps = {
  reports: AuditReport[];
  onMessage: (message: string) => void;
};

export default function AnalyticsPanel({ reports, onMessage }: AnalyticsPanelProps) {
  const fallbackRows = useMemo(() => aggregateReports(reports), [reports]);
  const [rows, setRows] = useState<AuditAggregate[]>(fallbackRows);
  const [engine, setEngine] = useState<"typescript" | "duckdb">("typescript");
  const [running, setRunning] = useState(false);
  const actionCount = reportsNeedingAction(reports);

  async function runDuckDb() {
    setRunning(true);
    const next = await runDuckDbAggregate(reports);
    setRows(next);
    setEngine("duckdb");
    setRunning(false);
    onMessage("DuckDB-WASM aggregate refreshed.");
  }

  return (
    <section className="surface analytics-panel">
      <div className="section-heading">
        <h2>Aggregate</h2>
        <span>{engine}</span>
      </div>

      <div className="metric-grid">
        <div className="metric">
          <BarChart3 size={18} />
          <strong>{reports.length}</strong>
          <span>Total</span>
        </div>
        <div className="metric warning">
          <ShieldAlert size={18} />
          <strong>{actionCount}</strong>
          <span>Action</span>
        </div>
      </div>

      <button
        className="ghost-button wide"
        disabled={running || reports.length === 0}
        onClick={runDuckDb}
        type="button"
      >
        <DatabaseZap size={16} />
        {running ? "Running DuckDB" : "Run DuckDB aggregate"}
      </button>

      <div className="aggregate-list">
        {(engine === "typescript" ? fallbackRows : rows).slice(0, 6).map((row) => (
          <div className="aggregate-row" key={`${row.assetKind}:${row.condition}`}>
            <span
              className="condition-dot"
              style={{ background: conditionTone[row.condition] }}
              aria-hidden="true"
            />
            <strong>{row.label}</strong>
            <span>{row.count}</span>
          </div>
        ))}
        {reports.length === 0 && (
          <p className="empty-state">Aggregates appear after reports.</p>
        )}
      </div>
    </section>
  );
}
