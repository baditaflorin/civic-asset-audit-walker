import { describe, expect, it } from "vitest";
import { mergeReports } from "./mergeReports";
import type { AuditReport } from "./schema";

function report(
  id: string,
  updatedAt: string,
  condition: AuditReport["condition"]
): AuditReport {
  return {
    schemaVersion: 1,
    id,
    assetTag: "CAW-36H11-000001",
    tagFamily: "tag36h11",
    tagId: 1,
    assetKind: "bench",
    condition,
    notes: "",
    createdAt: "2026-05-08T08:00:00.000Z",
    updatedAt,
    source: "local"
  };
}

describe("mergeReports", () => {
  it("adds new reports and keeps the freshest duplicate", () => {
    const existing = [
      report("00000000-0000-4000-8000-000000000001", "2026-05-08T08:00:00.000Z", "watch")
    ];
    const incoming = [
      report("00000000-0000-4000-8000-000000000001", "2026-05-08T08:05:00.000Z", "unsafe"),
      report("00000000-0000-4000-8000-000000000002", "2026-05-08T08:03:00.000Z", "good")
    ];

    const result = mergeReports(existing, incoming);

    expect(result.added).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.reports).toHaveLength(2);
    expect(result.reports.find((item) => item.id.endsWith("1"))?.condition).toBe("unsafe");
  });
});
