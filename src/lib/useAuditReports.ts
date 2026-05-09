import { useCallback, useEffect, useMemo, useState } from "react";
import { mergeReports, type MergeResult } from "./mergeReports";
import { auditReportSchema, type AuditReport } from "./schema";
import { clearReports, deleteReport, listReports, saveReport, saveReports } from "./storage";

type Status = "idle" | "loading" | "ready" | "error";

export function useAuditReports() {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const stored = await listReports();
      setReports(stored);
      setStatus("ready");
      setError(null);
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Could not load local reports.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upsert = useCallback(async (report: AuditReport) => {
    const parsed = auditReportSchema.parse(report);
    await saveReport(parsed);
    setReports((current) => {
      const next = mergeReports(current, [parsed]).reports;
      return next;
    });
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteReport(id);
    setReports((current) => current.filter((report) => report.id !== id));
  }, []);

  const importReports = useCallback(
    async (incoming: AuditReport[]): Promise<MergeResult> => {
      const merged = mergeReports(reports, incoming);
      await saveReports(merged.reports);
      setReports(merged.reports);
      return merged;
    },
    [reports]
  );

  const reset = useCallback(async () => {
    await clearReports();
    setReports([]);
  }, []);

  const replaceAll = useCallback(async (incoming: AuditReport[]) => {
    const parsed = incoming.map((report) => auditReportSchema.parse(report));
    await clearReports();
    await saveReports(parsed);
    setReports(parsed.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
  }, []);

  const latestReport = useMemo(() => reports[0], [reports]);

  return {
    reports,
    status,
    error,
    latestReport,
    refresh,
    upsert,
    remove,
    importReports,
    reset,
    replaceAll
  };
}
