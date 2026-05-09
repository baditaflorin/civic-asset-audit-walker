import { z } from "zod";
import { buildInfo } from "./buildInfo";
import {
  assetKindSchema,
  auditReportSchema,
  conditionSchema,
  locationSchema,
  normalizeAssetTag,
  type AuditLocation,
  type AuditReport
} from "./schema";

const SETTINGS_KEY = "caw.workspace.settings.v1";
const DRAFT_KEY = "caw.workspace.draft.v1";
const ACTIVITY_KEY = "caw.workspace.activity.v1";
const MAX_ACTIVITY_ENTRIES = 24;
export const MAX_SHARE_URL_LENGTH = 12000;

export const workspaceSettingsSchema = z.object({
  defaultAssetKind: assetKindSchema.default("streetlight"),
  defaultCondition: conditionSchema.default("watch"),
  rememberDraft: z.boolean().default(true),
  confirmReset: z.boolean().default(true),
  includeDraftInShareLinks: z.boolean().default(true)
});

export const reportDraftSchema = z.object({
  assetTag: z.string().default(""),
  assetKind: assetKindSchema.default("streetlight"),
  condition: conditionSchema.default("watch"),
  notes: z.string().max(500).default(""),
  location: locationSchema.optional(),
  tagId: z.number().int().nonnegative().optional()
});

export const activityEntrySchema = z.object({
  id: z.string().uuid(),
  at: z.string().datetime(),
  action: z.string().min(1).max(80),
  detail: z.string().min(1).max(240)
});

export const workspaceSnapshotSchema = z.object({
  type: z.literal("caw.workspace.v1"),
  schemaVersion: z.literal(1),
  appVersion: z.string().min(1),
  createdAt: z.string().datetime(),
  settings: workspaceSettingsSchema,
  draft: reportDraftSchema,
  reports: z.array(auditReportSchema),
  activity: z.array(activityEntrySchema)
});

export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;
export type ReportDraft = z.infer<typeof reportDraftSchema>;
export type ActivityEntry = z.infer<typeof activityEntrySchema>;
export type WorkspaceSnapshot = z.infer<typeof workspaceSnapshotSchema>;

export function defaultWorkspaceSettings(): WorkspaceSettings {
  return workspaceSettingsSchema.parse({});
}

export function defaultReportDraft(settings: WorkspaceSettings): ReportDraft {
  return reportDraftSchema.parse({
    assetTag: "",
    assetKind: settings.defaultAssetKind,
    condition: settings.defaultCondition,
    notes: ""
  });
}

export function readWorkspaceSettings(): WorkspaceSettings {
  return readStoredValue(SETTINGS_KEY, workspaceSettingsSchema, defaultWorkspaceSettings());
}

export function saveWorkspaceSettings(settings: WorkspaceSettings): void {
  writeStoredValue(SETTINGS_KEY, workspaceSettingsSchema.parse(settings));
}

export function readReportDraft(settings: WorkspaceSettings): ReportDraft {
  return readStoredValue(DRAFT_KEY, reportDraftSchema, defaultReportDraft(settings));
}

export function saveReportDraft(draft: ReportDraft, settings: WorkspaceSettings): void {
  if (!settings.rememberDraft) {
    removeStoredValue(DRAFT_KEY);
    return;
  }

  writeStoredValue(DRAFT_KEY, normalizeDraft(draft, settings));
}

export function clearReportDraft(): void {
  removeStoredValue(DRAFT_KEY);
}

export function readActivityHistory(): ActivityEntry[] {
  return readStoredValue(ACTIVITY_KEY, z.array(activityEntrySchema), []);
}

export function saveActivityHistory(entries: ActivityEntry[]): void {
  writeStoredValue(ACTIVITY_KEY, canonicalActivity(entries).slice(0, MAX_ACTIVITY_ENTRIES));
}

export function clearWorkspaceLocalState(): void {
  removeStoredValue(SETTINGS_KEY);
  removeStoredValue(DRAFT_KEY);
  removeStoredValue(ACTIVITY_KEY);
}

export function createActivityEntry(action: string, detail: string): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    action,
    detail
  };
}

export function appendActivity(
  current: ActivityEntry[],
  action: string,
  detail: string
): ActivityEntry[] {
  return canonicalActivity([createActivityEntry(action, detail), ...current]).slice(
    0,
    MAX_ACTIVITY_ENTRIES
  );
}

export function buildWorkspaceSnapshot(params: {
  reports: AuditReport[];
  settings: WorkspaceSettings;
  draft: ReportDraft;
  activity: ActivityEntry[];
  includeDraft?: boolean;
}): WorkspaceSnapshot {
  return workspaceSnapshotSchema.parse({
    type: "caw.workspace.v1",
    schemaVersion: 1,
    appVersion: buildInfo.version,
    createdAt: new Date().toISOString(),
    settings: params.settings,
    draft: params.includeDraft === false ? defaultReportDraft(params.settings) : params.draft,
    reports: canonicalReports(params.reports),
    activity: canonicalActivity(params.activity)
  });
}

export function workspaceSnapshotToText(snapshot: WorkspaceSnapshot): string {
  return JSON.stringify(workspaceSnapshotSchema.parse(snapshot), null, 2);
}

export function parseWorkspaceSnapshotText(input: string): WorkspaceSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(input);
    return workspaceSnapshotSchema.parse(parsed);
  } catch {
    return null;
  }
}

export function createWorkspaceShareUrl(snapshot: WorkspaceSnapshot): string {
  const encoded = encodeBase64Url(workspaceSnapshotToText(snapshot));
  return `${window.location.origin}${window.location.pathname}#state=${encoded}`;
}

export function parseWorkspaceShareHash(hash: string): WorkspaceSnapshot | null {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalized);
  const value = params.get("state");
  if (!value) {
    return null;
  }

  try {
    return parseWorkspaceSnapshotText(decodeBase64Url(value));
  } catch {
    return null;
  }
}

export function buildSampleReports(): AuditReport[] {
  const now = "2026-05-09T09:30:00.000Z";
  return canonicalReports([
    {
      schemaVersion: 1,
      id: "4e1391d7-7a6a-4b74-a8da-2bce7c07f7a1",
      assetTag: "CAW-36H11-000023",
      tagFamily: "tag36h11",
      tagId: 23,
      assetKind: "bench",
      condition: "needs_repair",
      location: { lat: 44.43032, lng: 26.10161, accuracy: 8 },
      notes: "Seat plank cracked and one leg feels loose.",
      createdAt: now,
      updatedAt: now,
      source: "import"
    },
    {
      schemaVersion: 1,
      id: "1b3083b9-79a4-4da5-9158-3b917e8f816b",
      assetTag: "CAW-36H11-000024",
      tagFamily: "tag36h11",
      tagId: 24,
      assetKind: "streetlight",
      condition: "watch",
      location: { lat: 44.42719, lng: 26.10891, accuracy: 7 },
      notes: "Lamp flickers after dark.",
      createdAt: "2026-05-09T09:34:00.000Z",
      updatedAt: "2026-05-09T09:34:00.000Z",
      source: "import"
    },
    {
      schemaVersion: 1,
      id: "8c53aeb8-5903-451f-bfb5-17fe8f2e5e49",
      assetTag: "CAW-36H11-000025",
      tagFamily: "tag36h11",
      tagId: 25,
      assetKind: "trash_bin",
      condition: "missing",
      location: { lat: 44.42453, lng: 26.10485, accuracy: 10 },
      notes: "Bin removed; concrete anchor still visible.",
      createdAt: "2026-05-09T09:39:00.000Z",
      updatedAt: "2026-05-09T09:39:00.000Z",
      source: "import"
    }
  ]);
}

export function normalizeDraft(
  draft: Partial<ReportDraft>,
  settings: WorkspaceSettings
): ReportDraft {
  return reportDraftSchema.parse({
    assetTag: normalizeAssetTag(draft.assetTag ?? ""),
    assetKind: draft.assetKind ?? settings.defaultAssetKind,
    condition: draft.condition ?? settings.defaultCondition,
    notes: draft.notes ?? "",
    location: normalizeLocation(draft.location),
    tagId: draft.tagId
  });
}

function normalizeLocation(location: AuditLocation | undefined): AuditLocation | undefined {
  if (!location) {
    return undefined;
  }

  return locationSchema.parse({
    lat: Number(location.lat.toFixed(7)),
    lng: Number(location.lng.toFixed(7)),
    accuracy: location.accuracy
  });
}

function canonicalReports(reports: AuditReport[]): AuditReport[] {
  return [...reports]
    .map((report) => auditReportSchema.parse(report))
    .sort((left, right) => {
      return (
        left.assetTag.localeCompare(right.assetTag) ||
        left.id.localeCompare(right.id) ||
        Date.parse(left.updatedAt) - Date.parse(right.updatedAt)
      );
    });
}

function canonicalActivity(entries: ActivityEntry[]): ActivityEntry[] {
  return [...entries]
    .map((entry) => activityEntrySchema.parse(entry))
    .sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
}

function readStoredValue<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return schema.parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function writeStoredValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStoredValue(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBase64Url(value: string): string {
  const normalized = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function applyDefaultsToDraft(
  draft: ReportDraft,
  settings: WorkspaceSettings
): ReportDraft {
  return normalizeDraft(
    {
      ...draft,
      assetKind: draft.assetKind || settings.defaultAssetKind,
      condition: draft.condition || settings.defaultCondition
    },
    settings
  );
}

export function describeImportSourceLabel(
  kind: "file" | "paste" | "clipboard" | "url" | "sample"
) {
  switch (kind) {
    case "file":
      return "file";
    case "paste":
      return "pasted text";
    case "clipboard":
      return "clipboard";
    case "url":
      return "URL";
    case "sample":
      return "sample dataset";
    default:
      return "import";
  }
}
