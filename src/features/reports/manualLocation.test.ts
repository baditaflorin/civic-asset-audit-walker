import { describe, expect, it } from "vitest";
import { parseManualLocation } from "./manualLocation";

describe("parseManualLocation", () => {
  it("accepts an in-range pair", () => {
    const result = parseManualLocation("44.4268", "26.1025");
    expect(result).toEqual({
      ok: true,
      location: { lat: 44.4268, lng: 26.1025 }
    });
  });

  it("rounds to 7 decimals so we don't carry float noise forward", () => {
    expect(parseManualLocation("44.426812345678", "26.102587654321")).toEqual({
      ok: true,
      location: { lat: 44.4268123, lng: 26.1025877 }
    });
  });

  it("rejects an out-of-range latitude without clamping", () => {
    expect(parseManualLocation("144.4", "26")).toEqual({
      ok: false,
      reason: "lat-out-of-range"
    });
    expect(parseManualLocation("-90.1", "0")).toEqual({
      ok: false,
      reason: "lat-out-of-range"
    });
  });

  it("rejects an out-of-range longitude without clamping", () => {
    expect(parseManualLocation("44", "200")).toEqual({
      ok: false,
      reason: "lng-out-of-range"
    });
    expect(parseManualLocation("0", "-180.5")).toEqual({
      ok: false,
      reason: "lng-out-of-range"
    });
  });

  it("rejects non-numeric input as out-of-range rather than producing NaN", () => {
    expect(parseManualLocation("forty", "twenty")).toEqual({
      ok: false,
      reason: "lat-out-of-range"
    });
  });

  it("accepts the exact corners (boundary inclusive)", () => {
    expect(parseManualLocation("90", "180").ok).toBe(true);
    expect(parseManualLocation("-90", "-180").ok).toBe(true);
  });

  it("trims whitespace before parsing", () => {
    expect(parseManualLocation("  44.42  ", "  26.10  ").ok).toBe(true);
  });
});
