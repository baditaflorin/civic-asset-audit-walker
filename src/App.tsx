import {
  ExternalLink,
  GitFork,
  HeartHandshake,
  MapPin,
  Star,
  Wifi,
  WifiOff
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { buildInfo } from "./lib/buildInfo";
import { conditionLabels, LIVE_URL, PAYPAL_URL, REPOSITORY_URL } from "./lib/constants";
import { ErrorBoundary } from "./lib/ErrorBoundary";
import { type AuditReport } from "./lib/schema";
import { useAuditReports } from "./lib/useAuditReports";
import {
  appendActivity,
  buildWorkspaceSnapshot,
  clearWorkspaceLocalState,
  createWorkspaceShareUrl,
  defaultReportDraft,
  defaultWorkspaceSettings,
  MAX_SHARE_URL_LENGTH,
  parseWorkspaceSnapshotText,
  parseWorkspaceShareHash,
  readActivityHistory,
  readReportDraft,
  readWorkspaceSettings,
  saveActivityHistory,
  saveReportDraft,
  saveWorkspaceSettings,
  type ReportDraft,
  type WorkspaceSettings
} from "./lib/workspace";
import { downloadText } from "./features/reports/exportReports";

const AssetMap = lazy(() => import("./features/map/AssetMap"));
const GuidedScanner = lazy(() => import("./features/scanner/GuidedScanner"));
const AnalyticsPanel = lazy(() => import("./features/analytics/AnalyticsPanel"));
const WebRtcSync = lazy(() => import("./features/sync/WebRtcSync"));
const ReportForm = lazy(() => import("./features/reports/ReportForm"));
const ReportList = lazy(() => import("./features/reports/ReportList"));
const WorkspacePanel = lazy(() => import("./features/workspace/WorkspacePanel"));

export default function App() {
  const { reports, status, error, upsert, remove, importReports, reset, replaceAll } =
    useAuditReports();
  const [scannedTag, setScannedTag] = useState("");
  const [scannedTagId, setScannedTagId] = useState<number | undefined>();
  const [toast, setToast] = useState("Ready.");
  const [settings, setSettings] = useState<WorkspaceSettings>(() => readWorkspaceSettings());
  const [draft, setDraft] = useState<ReportDraft>(() =>
    readReportDraft(readWorkspaceSettings())
  );
  const [activity, setActivity] = useState(() => readActivityHistory());
  const online = useOnlineStatus();
  const commitSha = buildInfo.buildCommit;
  const commitUrl = `${REPOSITORY_URL}/commit/${encodeURIComponent(commitSha)}`;
  const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";
  const [sharedStateHandled, setSharedStateHandled] = useState(false);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    saveWorkspaceSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveReportDraft(draft, settings);
  }, [draft, settings]);

  useEffect(() => {
    saveActivityHistory(activity);
  }, [activity]);

  const locatedCount = useMemo(
    () => reports.filter((report) => report.location).length,
    [reports]
  );
  const debugSnapshot = useMemo(
    () => ({
      version: buildInfo.version,
      commit: commitSha,
      reports: reports.length,
      located: locatedCount,
      settings,
      draft,
      lowConfidence: reports.filter((report) => (report.confidence?.overall ?? 1) < 0.7).length,
      sourceTypes: reports.reduce<Record<string, number>>((accumulator, report) => {
        const sourceType = report.provenance?.sourceType ?? report.source;
        accumulator[sourceType] = (accumulator[sourceType] ?? 0) + 1;
        return accumulator;
      }, {}),
      assetKinds: reports.reduce<Record<string, number>>((accumulator, report) => {
        accumulator[report.assetKind] = (accumulator[report.assetKind] ?? 0) + 1;
        return accumulator;
      }, {})
    }),
    [commitSha, draft, locatedCount, reports, settings]
  );

  async function saveReport(report: AuditReport) {
    await upsert(report);
    setActivity((current) =>
      appendActivity(
        current,
        "Report saved",
        `${report.assetTag} · ${conditionLabels[report.condition]}`
      )
    );
  }

  async function deleteReport(id: string) {
    const report = reports.find((entry) => entry.id === id);
    await remove(id);
    if (report) {
      setActivity((current) => appendActivity(current, "Report deleted", report.assetTag));
    }
  }

  async function importFromSource(incoming: AuditReport[], sourceLabel: string) {
    const result = await importReports(incoming);
    setActivity((current) =>
      appendActivity(
        current,
        "Reports imported",
        `${result.added} new, ${result.updated} updated from ${sourceLabel}.`
      )
    );
    return result;
  }

  function handleSettingsChange(next: WorkspaceSettings) {
    setSettings(next);
    setDraft((current) => {
      const draftIsBlank =
        !current.assetTag && !current.notes && !current.location && current.tagId === undefined;
      return draftIsBlank ? defaultReportDraft(next) : current;
    });
  }

  async function restoreWorkspaceSnapshot(snapshotText: string, sourceLabel: string) {
    const snapshot = parseWorkspaceSnapshotText(snapshotText);
    if (!snapshot) {
      setToast(`Workspace restore from ${sourceLabel} failed validation.`);
      return;
    }

    await replaceAll(snapshot.reports);
    setSettings(snapshot.settings);
    setDraft(snapshot.draft);
    setActivity((current) =>
      appendActivity(
        snapshot.activity.length > 0 ? snapshot.activity : current,
        "Workspace restored",
        `Restored from ${sourceLabel}.`
      )
    );
    setToast(`Workspace restored from ${sourceLabel}.`);
  }

  async function clearSavedReports() {
    await reset();
    setActivity((current) =>
      appendActivity(current, "Reports cleared", "Cleared saved local reports.")
    );
  }

  async function factoryResetWorkspace() {
    await reset();
    const nextSettings = defaultWorkspaceSettings();
    const nextDraft = defaultReportDraft(nextSettings);
    clearWorkspaceLocalState();
    setSettings(nextSettings);
    setDraft(nextDraft);
    setActivity([
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        action: "Workspace reset",
        detail: "Cleared reports, draft, activity history, and restored default settings."
      }
    ]);
    setToast("Workspace reset. Reports, settings, and draft were cleared.");
  }

  function downloadWorkspaceSnapshot() {
    const snapshot = buildWorkspaceSnapshot({
      reports,
      settings,
      draft,
      activity
    });
    downloadText(
      `civic-asset-audit-workspace-${buildInfo.version}.json`,
      JSON.stringify(snapshot, null, 2),
      "application/json"
    );
    setActivity((current) =>
      appendActivity(
        current,
        "Workspace backed up",
        `${snapshot.reports.length} reports saved to a workspace file.`
      )
    );
    setToast("Workspace backup downloaded.");
  }

  async function shareWorkspace() {
    const snapshot = buildWorkspaceSnapshot({
      reports,
      settings,
      draft,
      activity,
      includeDraft: settings.includeDraftInShareLinks
    });
    const url = createWorkspaceShareUrl(snapshot);
    if (url.length > MAX_SHARE_URL_LENGTH) {
      setToast("Workspace is too large for a share link. Download a workspace backup instead.");
      return;
    }

    await navigator.clipboard.writeText(url);
    setActivity((current) =>
      appendActivity(
        current,
        "Share link copied",
        `${snapshot.reports.length} reports prepared for a shareable URL.`
      )
    );
    setToast("Workspace share link copied.");
  }

  function printReports() {
    setActivity((current) =>
      appendActivity(
        current,
        "Printed reports",
        `${reports.length} reports in the current workspace.`
      )
    );
    window.print();
  }

  useEffect(() => {
    if (status !== "ready" || sharedStateHandled) {
      return;
    }

    setSharedStateHandled(true);
    const sharedSnapshot = parseWorkspaceShareHash(window.location.hash);
    if (!sharedSnapshot) {
      return;
    }

    void (async () => {
      if (reports.length === 0) {
        await replaceAll(sharedSnapshot.reports);
        setSettings(sharedSnapshot.settings);
        setDraft(sharedSnapshot.draft);
        setActivity((current) =>
          appendActivity(
            sharedSnapshot.activity.length > 0 ? sharedSnapshot.activity : current,
            "Shared workspace loaded",
            `Loaded ${sharedSnapshot.reports.length} shared reports from the URL.`
          )
        );
        setToast("Shared workspace loaded from the URL.");
        return;
      }

      const result = await importReports(sharedSnapshot.reports);
      setActivity((current) =>
        appendActivity(
          current,
          "Shared reports merged",
          `${result.added} new, ${result.updated} updated from the URL.`
        )
      );
      setToast("Shared reports were merged into the current workspace.");
    })();
  }, [importReports, replaceAll, reports.length, sharedStateHandled, status]);

  return (
    <ErrorBoundary>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark">
              <MapPin size={24} />
            </div>
            <div>
              <h1>Civic Asset Audit Walker</h1>
              <p>
                {reports.length} reports · {locatedCount} mapped
              </p>
            </div>
          </div>

          <nav className="top-actions" aria-label="Project links">
            <a href={REPOSITORY_URL} rel="noreferrer" target="_blank">
              <GitFork size={17} />
              GitHub
            </a>
            <a href={`${REPOSITORY_URL}/stargazers`} rel="noreferrer" target="_blank">
              <Star size={17} />
              Star
            </a>
            <a href={PAYPAL_URL} rel="noreferrer" target="_blank">
              <HeartHandshake size={17} />
              PayPal
            </a>
          </nav>
        </header>

        <div className="build-strip">
          <span className={online ? "status-pill online" : "status-pill offline"}>
            {online ? <Wifi size={15} /> : <WifiOff size={15} />}
            {online ? "Online" : "Offline"}
          </span>
          <span>v{buildInfo.version}</span>
          <a href={commitUrl} rel="noreferrer" target="_blank">
            commit {commitSha}
          </a>
          <a href={LIVE_URL} rel="noreferrer" target="_blank">
            live <ExternalLink size={14} />
          </a>
        </div>

        {status === "error" && <div className="banner error">{error}</div>}

        <main className="workspace">
          <Suspense fallback={<PanelSkeleton label="Map" />}>
            <AssetMap reports={reports} />
          </Suspense>

          <div className="control-grid">
            <Suspense fallback={<PanelSkeleton label="Scanner" />}>
              <GuidedScanner
                onDetected={(assetTag, tagId) => {
                  setScannedTag(assetTag);
                  setScannedTagId(tagId);
                }}
                onMessage={setToast}
              />
            </Suspense>

            <Suspense fallback={<PanelSkeleton label="Report" />}>
              <ReportForm
                draft={draft}
                onDraftChange={setDraft}
                onMessage={setToast}
                onSaved={saveReport}
                scannedTag={scannedTag}
                scannedTagId={scannedTagId}
                settings={settings}
              />
            </Suspense>

            <Suspense fallback={<PanelSkeleton label="Aggregate" />}>
              <AnalyticsPanel onMessage={setToast} reports={reports} />
            </Suspense>

            <Suspense fallback={<PanelSkeleton label="Sync" />}>
              <WebRtcSync
                onImport={(incoming) => importFromSource(incoming, "peer sync")}
                onMessage={setToast}
                reports={reports}
              />
            </Suspense>

            <Suspense fallback={<PanelSkeleton label="Reports" />}>
              <ReportList
                onDelete={deleteReport}
                onImport={importFromSource}
                onMessage={setToast}
                onReset={clearSavedReports}
                onRestoreSnapshot={restoreWorkspaceSnapshot}
                reports={reports}
                settings={settings}
              />
            </Suspense>

            <Suspense fallback={<PanelSkeleton label="Workspace" />}>
              <WorkspacePanel
                activity={activity}
                onDownloadSnapshot={downloadWorkspaceSnapshot}
                onFactoryReset={factoryResetWorkspace}
                onPrintReports={printReports}
                onSettingsChange={handleSettingsChange}
                onShareWorkspace={() => void shareWorkspace()}
                settings={settings}
              />
            </Suspense>
          </div>
        </main>

        <footer className="site-footer">
          <a href={REPOSITORY_URL} rel="noreferrer" target="_blank">
            {REPOSITORY_URL}
          </a>
          <a href={PAYPAL_URL} rel="noreferrer" target="_blank">
            {PAYPAL_URL}
          </a>
        </footer>

        {debugEnabled && (
          <aside className="debug-panel" aria-label="Debug state">
            <strong>Debug</strong>
            <pre>{JSON.stringify(debugSnapshot, null, 2)}</pre>
          </aside>
        )}

        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function PanelSkeleton({ label }: { label: string }) {
  return (
    <section className="surface skeleton">
      <div className="section-heading">
        <h2>{label}</h2>
      </div>
    </section>
  );
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return online;
}
