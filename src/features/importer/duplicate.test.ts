import { describe, expect, it } from "vitest";
import { analyzeImportText } from "./importEngine";

async function issueCodesFor(record: Record<string, unknown>): Promise<string[]> {
  const result = await analyzeImportText(JSON.stringify([record]));
  return result.issues.map((issue) => issue.code);
}

describe("duplicate-request detection", () => {
  it('flags real "Closed - Duplicate" status text', async () => {
    const codes = await issueCodesFor({
      service_request_number: "SR-1",
      type_of_service_request: "Pothole",
      status: "Closed - Duplicate",
      latitude: 41.85,
      longitude: -87.65,
      created_date: "2026-01-01T00:00:00Z"
    });
    expect(codes).toContain("duplicate_request");
  });

  it('flags status "duplicate" with surrounding punctuation', async () => {
    const codes = await issueCodesFor({
      service_request_number: "SR-2",
      status_text: "Duplicate.",
      latitude: 41.85,
      longitude: -87.65,
      created_date: "2026-01-01T00:00:00Z"
    });
    expect(codes).toContain("duplicate_request");
  });

  it('does NOT flag the address word "duplex" — that is a building type, not a status', async () => {
    const codes = await issueCodesFor({
      service_request_number: "SR-3",
      type_of_service_request: "Streetlight Out",
      status: "Open",
      address: "1234 N Duplex Ave",
      latitude: 41.85,
      longitude: -87.65,
      created_date: "2026-01-01T00:00:00Z"
    });
    expect(codes).not.toContain("duplicate_request");
  });

  it("does NOT flag a field-name-only match like is_duplicate=false", async () => {
    const codes = await issueCodesFor({
      service_request_number: "SR-4",
      type_of_service_request: "Pothole",
      status: "Open",
      is_duplicate: false,
      latitude: 41.85,
      longitude: -87.65,
      created_date: "2026-01-01T00:00:00Z"
    });
    expect(codes).not.toContain("duplicate_request");
  });

  it('does NOT flag a status that explicitly says "not a duplicate"', async () => {
    const codes = await issueCodesFor({
      service_request_number: "SR-5",
      type_of_service_request: "Pothole",
      status: "Resolved — not a duplicate of SR-1",
      latitude: 41.85,
      longitude: -87.65,
      created_date: "2026-01-01T00:00:00Z"
    });
    expect(codes).not.toContain("duplicate_request");
  });

  it('does NOT flag arbitrary text containing "dup" (e.g. "duplicate-issue: false" prose)', async () => {
    const codes = await issueCodesFor({
      service_request_number: "SR-6",
      type_of_service_request: "Pothole",
      status: "Open",
      notes: "Confirmed unique; the duplicate-issue flag is false.",
      latitude: 41.85,
      longitude: -87.65,
      created_date: "2026-01-01T00:00:00Z"
    });
    // Notes aren't in the status set, so this must not fire.
    expect(codes).not.toContain("duplicate_request");
  });
});
