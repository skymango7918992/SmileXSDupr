"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPick } from "@/components/play-journey/location-picker-map";
import { getMapTileStyle, DEFAULT_MAP_TILE_STYLE } from "@/lib/map-tile-styles";

const TAIWAN_CENTER: [number, number] = [25.033, 121.565];

function ClickHandler({ onPick }: { onPick: (pick: MapPick) => void }) {
  useMapEvents({
    click(e) {
      onPick({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    },
  });
  return null;
}

function Recenter({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude != null && longitude != null) {
      map.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, map]);

  return null;
}

const pickIcon = L.divIcon({
  className: "play-map-pin-wrap",
  html: '<div class="play-map-pin play-map-pin--pick"><span>📍</span></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 28],
});

type Props = {
  latitude: number | null;
  longitude: number | null;
  onPick: (pick: MapPick) => void;
};

export function LocationPickerMapInner({
  latitude,
  longitude,
  onPick,
}: Props) {
  const center: [number, number] =
    latitude != null && longitude != null
      ? [latitude, longitude]
      : TAIWAN_CENTER;
  const zoom = latitude != null && longitude != null ? 15 : 11;
  const tile = getMapTileStyle(DEFAULT_MAP_TILE_STYLE);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        zoom={zoom}
        className="play-map-picker"
        scrollWheelZoom
      >
        <TileLayer attribution={tile.attribution} url={tile.url} />
        <ClickHandler onPick={onPick} />
        <Recenter latitude={latitude} longitude={longitude} />
        {latitude != null && longitude != null && (
          <Marker position={[latitude, longitude]} icon={pickIcon} />
        )}
      </MapContainer>
      <p className="bg-surface-muted px-3 py-2 text-xs text-muted">
        點地圖放置球館位置，或先用上方搜尋
      </p>
    </div>
  );
}
