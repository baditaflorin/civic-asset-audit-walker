import { useQuery } from "@tanstack/react-query";
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
import { LIVE_URL, PAYPAL_URL, REPOSITORY_URL } from "./lib/constants";
import { ErrorBoundary } from "./lib/ErrorBoundary";
import { type AuditReport } from "./lib/schema";
import { useAuditReports } from "./lib/useAuditReports";

const AssetMap = lazy(() => import("./features/map/AssetMap"));
const GuidedScanner = lazy(() => import("./features/scanner/GuidedScanner"));
const AnalyticsPanel = lazy(() => import("./features/analytics/AnalyticsPanel"));
const WebRtcSync = lazy(() => import("./features/sync/WebRtcSync"));
const ReportForm = lazy(() => import("./features/reports/ReportForm"));
const ReportList = lazy(() => import("./features/reports/ReportList"));

type GithubCommitResponse = {
  sha: string;
  html_url: string;
};

export default function App() {
  const { reports, status, error, upsert, remove, importReports, reset } = useAuditReports();
  const [scannedTag, setScannedTag] = useState("");
  const [scannedTagId, setScannedTagId] = useState<number | undefined>();
  const [toast, setToast] = useState("Ready.");
  const online = useOnlineStatus();
  const commit = useGithubCommit();
  const commitSha = commit.data?.sha.slice(0, 7) ?? buildInfo.buildCommit;
  const commitUrl =
    commit.data?.html_url ??
    `${REPOSITORY_URL}/commit/${encodeURIComponent(buildInfo.buildCommit)}`;

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const locatedCount = useMemo(
    () => reports.filter((report) => report.location).length,
    [reports]
  );

  async function saveReport(report: AuditReport) {
    await upsert(report);
  }

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
                onMessage={setToast}
                onSaved={saveReport}
                scannedTag={scannedTag}
                scannedTagId={scannedTagId}
              />
            </Suspense>

            <Suspense fallback={<PanelSkeleton label="Aggregate" />}>
              <AnalyticsPanel onMessage={setToast} reports={reports} />
            </Suspense>

            <Suspense fallback={<PanelSkeleton label="Sync" />}>
              <WebRtcSync onImport={importReports} onMessage={setToast} reports={reports} />
            </Suspense>

            <Suspense fallback={<PanelSkeleton label="Reports" />}>
              <ReportList
                onDelete={remove}
                onImport={importReports}
                onMessage={setToast}
                onReset={reset}
                reports={reports}
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

function useGithubCommit() {
  return useQuery({
    queryKey: ["github-main-commit"],
    queryFn: async (): Promise<GithubCommitResponse> => {
      const response = await fetch(
        "https://api.github.com/repos/baditaflorin/civic-asset-audit-walker/commits/main",
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!response.ok) {
        throw new Error("GitHub commit lookup failed.");
      }
      return (await response.json()) as GithubCommitResponse;
    }
  });
}
