import { describe, expect, it } from "vitest";
import type { AuditReport } from "../../lib/schema";
import { aggregateReports, reportsNeedingAction } from "./aggregate";

const base: Omit<AuditReport, "id" | "condition" | "assetKind"> = {
  schemaVersion: 1,
  assetTag: "CAW-36H11-000010",
  tagFamily: "tag36h11",
  tagId: 10,
  notes: "",
  createdAt: "2026-05-08T08:00:00.000Z",
  updatedAt: "2026-05-08T08:00:00.000Z",
  source: "local"
};

describe("aggregateReports", () => {
  it("groups reports and prioritizes risk", () => {
    const reports: AuditReport[] = [
      {
        ...base,
        id: "00000000-0000-4000-8000-000000000001",
        assetKind: "bench",
        condition: "good"
      },
      {
        ...base,
        id: "00000000-0000-4000-8000-000000000002",
        assetKind: "streetlight",
        condition: "unsafe"
      },
      {
        ...base,
        id: "00000000-0000-4000-8000-000000000003",
        assetKind: "streetlight",
        condition: "unsafe"
      }
    ];

    const rows = aggregateReports(reports);

    expect(rows[0]).toMatchObject({ assetKind: "streetlight", condition: "unsafe", count: 2 });
    expect(reportsNeedingAction(reports)).toBe(2);
  });
});
