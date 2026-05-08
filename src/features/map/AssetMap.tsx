import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import {
  assetKindLabels,
  conditionLabels,
  conditionTone,
  DEFAULT_MAP_CENTER,
  PAYPAL_URL,
  REPOSITORY_URL
} from "../../lib/constants";
import type { AuditReport } from "../../lib/schema";

type AssetMapProps = {
  reports: AuditReport[];
};

export default function AssetMap({ reports }: AssetMapProps) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!nodeRef.current || mapRef.current) {
      return;
    }

    const map = L.map(nodeRef.current, {
      center: [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) {
      return;
    }

    layer.clearLayers();
    const located = reports.filter((report) => report.location);

    for (const report of located) {
      const location = report.location!;
      const marker = L.circleMarker([location.lat, location.lng], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: conditionTone[report.condition],
        fillOpacity: 0.92
      });
      marker.bindPopup(
        `<strong>${escapeHtml(report.assetTag)}</strong><br>${escapeHtml(
          assetKindLabels[report.assetKind]
        )} · ${escapeHtml(conditionLabels[report.condition])}<br><small>${new Date(
          report.createdAt
        ).toLocaleString()}</small>`
      );
      marker.addTo(layer);
    }

    if (located.length > 0) {
      const bounds = L.latLngBounds(
        located.map((report) => [report.location!.lat, report.location!.lng])
      );
      map.fitBounds(bounds.pad(0.18), { maxZoom: 17 });
    }
  }, [reports]);

  return (
    <section className="map-panel surface">
      <div className="section-heading">
        <h2>Map</h2>
        <span>{reports.filter((report) => report.location).length} located</span>
      </div>
      <div className="map-canvas" ref={nodeRef} />
      <div className="map-links" aria-label="Map project links">
        <a href={REPOSITORY_URL} rel="noreferrer" target="_blank">
          GitHub
        </a>
        <a href={PAYPAL_URL} rel="noreferrer" target="_blank">
          PayPal
        </a>
      </div>
    </section>
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
