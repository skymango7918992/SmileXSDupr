"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatDuration } from "@/lib/play-achievements";
import { getMapTileStyle, type MapTileStyleId } from "@/lib/map-tile-styles";
import { primarySport } from "@/lib/play-map-markers";
import { formatDate } from "@/lib/utils";
import {
  JOURNEY_SPORT_LABELS,
  type MapMarker,
} from "@/types/play-journey";

const TAIWAN_CENTER: [number, number] = [23.7, 120.96];
const DEFAULT_ZOOM = 7;

function pinHtml(sports: MapMarker["sports"], count: number): string {
  const sport = primarySport(sports);
  const dual = sports.length > 1;
  const cls = dual
    ? "play-map-pin play-map-pin--dual"
    : sport === "pickleball"
      ? "play-map-pin play-map-pin--pickleball"
      : "play-map-pin play-map-pin--badminton";

  return `<div class="${cls}"><span>${count}</span></div>`;
}

function createPinIcon(marker: MapMarker) {
  return L.divIcon({
    className: "play-map-pin-wrap",
    html: pinHtml(marker.sports, marker.session_count),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -14],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) {
      map.setView(TAIWAN_CENTER, DEFAULT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(
      markers.map((m) => [m.latitude, m.longitude] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.22), { maxZoom: 14 });
  }, [map, markers]);

  return null;
}

type Props = {
  markers: MapMarker[];
  styleId: MapTileStyleId;
};

export function PlayMapOsmInner({ markers, styleId }: Props) {
  const tile = getMapTileStyle(styleId);

  const center = useMemo<[number, number]>(() => {
    if (!markers.length) return TAIWAN_CENTER;
    const lat =
      markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length;
    const lng =
      markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length;
    return [lat, lng];
  }, [markers]);

  return (
    <div className="play-map-shell relative overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        className="play-map-canvas"
        scrollWheelZoom
      >
        <TileLayer
          key={tile.id}
          attribution={tile.attribution}
          url={tile.url}
        />
        <FitBounds markers={markers} />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={createPinIcon(marker)}
          >
            <Popup className="play-map-popup">
              <div className="min-w-[10rem] text-sm">
                <p className="font-semibold text-foreground">
                  {marker.venue_name}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {marker.sports.map((s) => JOURNEY_SPORT_LABELS[s]).join(" · ")}
                </p>
                <p className="mt-1 text-xs">
                  {marker.session_count} 次 ·{" "}
                  {formatDuration(marker.total_minutes)}
                </p>
                <p className="text-xs text-muted">
                  最近 {formatDate(marker.last_played_on)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {!markers.length && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] bg-gradient-to-t from-white/95 to-transparent px-4 py-5 text-center text-sm text-muted">
          紀錄打球時標記地點，足跡會出現在這張地圖上
        </div>
      )}
    </div>
  );
}
