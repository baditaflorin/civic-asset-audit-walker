import { describe, expect, test } from "vitest";
import type { AuditReport } from "./schema";
import {
  appendActivity,
  buildWorkspaceSnapshot,
  createWorkspaceShareUrl,
  defaultReportDraft,
  defaultWorkspaceSettings,
  parseWorkspaceShareHash,
  parseWorkspaceSnapshotText,
  workspaceSnapshotToText
} from "./workspace";

const sampleReport: AuditReport = {
  schemaVersion: 1,
  id: "f20ec3ee-2204-438b-b1f6-138a50764498",
  assetTag: "CAW-36H11-000999",
  tagFamily: "tag36h11",
  tagId: 999,
  assetKind: "bench",
  condition: "watch",
  notes: "Loose screws on the left side.",
  createdAt: "2026-05-09T10:00:00.000Z",
  updatedAt: "2026-05-09T10:00:00.000Z",
  source: "local"
};

describe("workspace snapshot", () => {
  test("round-trips through text parsing", () => {
    const settings = defaultWorkspaceSettings();
    const draft = defaultReportDraft(settings);
    const activity = appendActivity([], "Report saved", "CAW-36H11-000999");
    const snapshot = buildWorkspaceSnapshot({
      reports: [sampleReport],
      settings,
      draft,
      activity
    });

    const text = workspaceSnapshotToText(snapshot);
    expect(parseWorkspaceSnapshotText(text)).toEqual(snapshot);
  });

  test("round-trips through a share hash", () => {
    const settings = defaultWorkspaceSettings();
    const snapshot = buildWorkspaceSnapshot({
      reports: [sampleReport],
      settings,
      draft: defaultReportDraft(settings),
      activity: []
    });

    const url = createWorkspaceShareUrl(snapshot);
    const parsed = parseWorkspaceShareHash(new URL(url).hash);
    expect(parsed).toEqual(snapshot);
  });
});
