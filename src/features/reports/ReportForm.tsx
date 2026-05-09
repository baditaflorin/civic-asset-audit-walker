import { LocateFixed, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  assetKindLabels,
  conditionLabels,
  conditionTone,
  DEFAULT_MAP_CENTER
} from "../../lib/constants";
import {
  assetKinds,
  conditions,
  normalizeAssetTag,
  type AssetKind,
  type AuditLocation,
  type AuditReport,
  type Condition
} from "../../lib/schema";
import {
  applyDefaultsToDraft,
  defaultReportDraft,
  normalizeDraft,
  type ReportDraft,
  type WorkspaceSettings
} from "../../lib/workspace";

type ReportFormProps = {
  scannedTag: string;
  scannedTagId?: number;
  draft: ReportDraft;
  settings: WorkspaceSettings;
  onDraftChange: (draft: ReportDraft) => void;
  onSaved: (report: AuditReport) => Promise<void>;
  onMessage: (message: string) => void;
};

export default function ReportForm({
  scannedTag,
  scannedTagId,
  draft,
  settings,
  onDraftChange,
  onSaved,
  onMessage
}: ReportFormProps) {
  const [assetTag, setAssetTag] = useState(draft.assetTag || scannedTag);
  const [assetKind, setAssetKind] = useState<AssetKind>(draft.assetKind);
  const [condition, setCondition] = useState<Condition>(draft.condition);
  const [notes, setNotes] = useState(draft.notes);
  const [location, setLocation] = useState<AuditLocation | undefined>(draft.location);
  const [tagId, setTagId] = useState<number | undefined>(draft.tagId ?? scannedTagId);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (scannedTag) {
      setAssetTag(scannedTag);
      setTagId(scannedTagId);
    }
  }, [scannedTag, scannedTagId]);

  useEffect(() => {
    const next = applyDefaultsToDraft(draft, settings);
    setAssetTag(next.assetTag);
    setAssetKind(next.assetKind);
    setCondition(next.condition);
    setNotes(next.notes);
    setLocation(next.location);
    setTagId(next.tagId);
  }, [draft, settings]);

  const normalizedTag = useMemo(() => normalizeAssetTag(assetTag), [assetTag]);

  useEffect(() => {
    onDraftChange(
      normalizeDraft(
        {
          assetTag: normalizedTag,
          assetKind,
          condition,
          notes,
          location,
          tagId
        },
        settings
      )
    );
  }, [assetKind, condition, location, normalizedTag, notes, onDraftChange, settings, tagId]);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocation(DEFAULT_MAP_CENTER);
      onMessage("Geolocation is unavailable; using the default Bucharest map center.");
      return;
    }

    setLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        });
      });

      setLocation({
        lat: Number(position.coords.latitude.toFixed(7)),
        lng: Number(position.coords.longitude.toFixed(7)),
        accuracy: Math.round(position.coords.accuracy)
      });
      onMessage("Location attached to the report.");
    } catch {
      onMessage("Location was skipped. The report can still be saved.");
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedTag) {
      onMessage("Add or scan an asset tag before saving.");
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      await onSaved({
        schemaVersion: 1,
        id: crypto.randomUUID(),
        assetTag: normalizedTag,
        tagFamily: "tag36h11",
        tagId,
        assetKind,
        condition,
        location,
        notes: notes.trim(),
        createdAt: now,
        updatedAt: now,
        source: "local"
      });
      const resetDraft = defaultReportDraft(settings);
      setAssetTag(resetDraft.assetTag);
      setAssetKind(resetDraft.assetKind);
      setCondition(resetDraft.condition);
      setNotes(resetDraft.notes);
      setLocation(resetDraft.location);
      setTagId(undefined);
      onDraftChange(resetDraft);
      onMessage(`Saved ${normalizedTag}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="surface report-form" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>Report</h2>
        <span>{normalizedTag || "No tag"}</span>
      </div>

      <label className="field">
        <span>Asset tag</span>
        <input
          value={assetTag}
          onChange={(event) => setAssetTag(event.target.value)}
          placeholder="CAW-36H11-000123"
          autoComplete="off"
        />
      </label>

      <div className="field-grid">
        <label className="field">
          <span>Asset</span>
          <select
            value={assetKind}
            onChange={(event) => setAssetKind(event.target.value as AssetKind)}
          >
            {assetKinds.map((kind) => (
              <option key={kind} value={kind}>
                {assetKindLabels[kind]}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>Condition</span>
          <div className="segmented" role="group" aria-label="Condition">
            {conditions.map((option) => (
              <button
                aria-pressed={condition === option}
                key={option}
                onClick={() => setCondition(option)}
                style={{ "--tone": conditionTone[option] } as React.CSSProperties}
                type="button"
              >
                {conditionLabels[option]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea
          value={notes}
          maxLength={500}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Broken cover, missing screws, blocked access..."
        />
      </label>

      <div className="location-row">
        <button
          className="ghost-button"
          disabled={locating}
          onClick={useCurrentLocation}
          type="button"
        >
          <LocateFixed size={17} />
          {locating ? "Locating" : "Use location"}
        </button>
        <span>
          {location
            ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
            : "Location optional"}
        </span>
      </div>

      <button className="primary-button" disabled={saving} type="submit">
        <Save size={18} />
        {saving ? "Saving" : "Save report"}
      </button>
    </form>
  );
}
