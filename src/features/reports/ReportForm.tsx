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
import { parseManualLocation } from "./manualLocation";

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
  const [manualLocationOpen, setManualLocationOpen] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

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
      setManualLocationOpen(true);
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
    } catch (error) {
      // Geolocation failed (permission denied, indoors with no GPS, or
      // device location switched off). Surface the manual entry path
      // so the volunteer can still attach coordinates from a map app
      // or a printed plate without losing the rest of the report.
      const isDenied =
        error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED;
      onMessage(
        isDenied
          ? "Location permission was denied. Type coordinates manually or save without them."
          : "Could not read GPS. Type coordinates manually or save without them."
      );
      setManualLocationOpen(true);
    } finally {
      setLocating(false);
    }
  }

  /**
   * Apply manually-typed lat / lng. Validation lives in
   * `parseManualLocation` so a unit test covers the bounds.
   */
  function applyManualLocation() {
    const result = parseManualLocation(manualLat, manualLng);
    if (result.ok === false) {
      onMessage(
        result.reason === "lat-out-of-range"
          ? "Latitude must be a number between -90 and 90."
          : "Longitude must be a number between -180 and 180."
      );
      return;
    }
    const { lat, lng } = result.location;
    setLocation({ lat, lng });
    setManualLocationOpen(false);
    onMessage("Location set manually.");
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
        <button
          className="ghost-button"
          onClick={() => {
            // Seed the inputs from the current location so the user can
            // edit a small correction rather than re-type both values.
            if (location && !manualLocationOpen) {
              setManualLat(location.lat.toString());
              setManualLng(location.lng.toString());
            }
            setManualLocationOpen(!manualLocationOpen);
          }}
          type="button"
        >
          {manualLocationOpen ? "Hide manual" : "Type coords"}
        </button>
        <span>
          {location
            ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
            : "Location optional"}
        </span>
      </div>
      {manualLocationOpen ? (
        <div className="field-grid">
          <label className="field">
            <span>Latitude</span>
            <input
              value={manualLat}
              onChange={(event) => setManualLat(event.target.value)}
              inputMode="decimal"
              placeholder="44.4268"
              aria-label="Latitude"
            />
          </label>
          <label className="field">
            <span>Longitude</span>
            <input
              value={manualLng}
              onChange={(event) => setManualLng(event.target.value)}
              inputMode="decimal"
              placeholder="26.1025"
              aria-label="Longitude"
            />
          </label>
          <button className="ghost-button" onClick={applyManualLocation} type="button">
            Apply
          </button>
        </div>
      ) : null}

      <button className="primary-button" disabled={saving} type="submit">
        <Save size={18} />
        {saving ? "Saving" : "Save report"}
      </button>
    </form>
  );
}
