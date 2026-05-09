import { Download, Link2, Printer, RefreshCcw } from "lucide-react";
import { assetKindLabels, conditionLabels, DEFAULT_MAP_CENTER } from "../../lib/constants";
import {
  assetKinds,
  conditions,
  type AssetKind,
  type AuditLocation,
  type Condition
} from "../../lib/schema";
import type { ActivityEntry, WorkspaceSettings } from "../../lib/workspace";

type WorkspacePanelProps = {
  settings: WorkspaceSettings;
  activity: ActivityEntry[];
  onSettingsChange: (settings: WorkspaceSettings) => void;
  onDownloadSnapshot: () => void;
  onShareWorkspace: () => void;
  onPrintReports: () => void;
  onFactoryReset: () => Promise<void>;
};

export default function WorkspacePanel({
  settings,
  activity,
  onSettingsChange,
  onDownloadSnapshot,
  onShareWorkspace,
  onPrintReports,
  onFactoryReset
}: WorkspacePanelProps) {
  return (
    <section className="surface workspace-panel">
      <div className="section-heading">
        <h2>Workspace</h2>
        <span>settings and history</span>
      </div>

      <div className="field-grid workspace-settings-grid">
        <label className="field">
          <span>Default asset</span>
          <select
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                defaultAssetKind: event.target.value as AssetKind
              })
            }
            value={settings.defaultAssetKind}
          >
            {assetKinds.map((kind) => (
              <option key={kind} value={kind}>
                {assetKindLabels[kind]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Default condition</span>
          <select
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                defaultCondition: event.target.value as Condition
              })
            }
            value={settings.defaultCondition}
          >
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {conditionLabels[condition]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings-stack">
        <label className="checkbox-row">
          <input
            checked={settings.rememberDraft}
            onChange={(event) =>
              onSettingsChange({ ...settings, rememberDraft: event.target.checked })
            }
            type="checkbox"
          />
          <span>Remember unsaved report draft between visits</span>
        </label>
        <label className="checkbox-row">
          <input
            checked={settings.confirmReset}
            onChange={(event) =>
              onSettingsChange({ ...settings, confirmReset: event.target.checked })
            }
            type="checkbox"
          />
          <span>Require a confirmation step before clearing reports</span>
        </label>
        <label className="checkbox-row">
          <input
            checked={settings.includeDraftInShareLinks}
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                includeDraftInShareLinks: event.target.checked
              })
            }
            type="checkbox"
          />
          <span>Include the current unsaved draft in share links</span>
        </label>
      </div>

      <div className="toolbar workspace-actions">
        <button className="ghost-button" onClick={onDownloadSnapshot} type="button">
          <Download size={16} />
          Backup workspace
        </button>
        <button className="ghost-button" onClick={onShareWorkspace} type="button">
          <Link2 size={16} />
          Share link
        </button>
        <button className="ghost-button" onClick={onPrintReports} type="button">
          <Printer size={16} />
          Print reports
        </button>
        <button className="ghost-button" onClick={() => void onFactoryReset()} type="button">
          <RefreshCcw size={16} />
          Start fresh
        </button>
      </div>

      <div className="import-summary">
        <strong>Notes</strong>
        <p>Share links stay in the URL hash and work best for small neighborhoods.</p>
        <p>Browser print hides the map and control chrome to leave a compact report summary.</p>
        <p>
          If geolocation is unavailable, reports still save and the map falls back to{" "}
          {formatLocation(DEFAULT_MAP_CENTER)}.
        </p>
      </div>

      <div className="aggregate-list">
        <div className="section-heading workspace-history-heading">
          <h2>Recent activity</h2>
          <span>{activity.length}</span>
        </div>
        {activity.length === 0 ? (
          <p className="empty-state">No local activity yet.</p>
        ) : (
          activity.slice(0, 8).map((entry) => (
            <article className="report-row" key={entry.id}>
              <div>
                <strong>{entry.action}</strong>
                <span>{entry.detail}</span>
                <small>{new Date(entry.at).toLocaleString()}</small>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function formatLocation(location: AuditLocation): string {
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}
