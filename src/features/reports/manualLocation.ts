import type { AuditLocation } from "../../lib/schema";

export interface ManualLocationOk {
  ok: true;
  location: AuditLocation;
}
export interface ManualLocationError {
  ok: false;
  reason: "lat-out-of-range" | "lng-out-of-range";
}
export type ManualLocationResult = ManualLocationOk | ManualLocationError;

/**
 * Parse the volunteer's hand-typed lat/lng pair. Strict bounds — out-of-
 * range values are rejected with a discriminated reason rather than
 * silently clamped, so a mistyped "144.4" doesn't pin a far-corner-of-the-
 * map marker that the audit map then carries forward.
 *
 * Pulled out of the React form so we can unit-test the rule without
 * mounting the component.
 */
export function parseManualLocation(latRaw: string, lngRaw: string): ManualLocationResult {
  const lat = Number.parseFloat(latRaw.trim());
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, reason: "lat-out-of-range" };
  }
  const lng = Number.parseFloat(lngRaw.trim());
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { ok: false, reason: "lng-out-of-range" };
  }
  return {
    ok: true,
    location: {
      lat: Number(lat.toFixed(7)),
      lng: Number(lng.toFixed(7))
    }
  };
}
