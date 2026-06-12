"use client";

import {
  DEFAULT_MAP_TILE_STYLE,
  MAP_STYLE_STORAGE_KEY,
  MAP_TILE_STYLES,
  type MapTileStyleId,
} from "@/lib/map-tile-styles";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Props = {
  value: MapTileStyleId;
  onChange: (id: MapTileStyleId) => void;
  className?: string;
};

export function useMapTileStylePreference(): [
  MapTileStyleId,
  (id: MapTileStyleId) => void,
] {
  const [styleId, setStyleId] = useState<MapTileStyleId>(DEFAULT_MAP_TILE_STYLE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MAP_STYLE_STORAGE_KEY) as MapTileStyleId | null;
      if (saved && MAP_TILE_STYLES.some((s) => s.id === saved)) {
        setStyleId(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const update = (id: MapTileStyleId) => {
    setStyleId(id);
    try {
      localStorage.setItem(MAP_STYLE_STORAGE_KEY, id);
    } catch {
      // ignore
    }
  };

  return [styleId, update];
}

export function MapStyleSwitch({ value, onChange, className }: Props) {
  const active = MAP_TILE_STYLES.find((s) => s.id === value);

  return (
    <div className={cn("play-map-style-switch", className)}>
      <div className="play-map-style-switch__pills" role="tablist" aria-label="地圖樣式">
        {MAP_TILE_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            role="tab"
            aria-selected={value === style.id}
            className={cn(
              "play-map-style-switch__pill",
              value === style.id && "play-map-style-switch__pill--active",
            )}
            onClick={() => onChange(style.id)}
          >
            {style.label}
          </button>
        ))}
      </div>
      {active && (
        <p className="play-map-style-switch__hint">{active.description}</p>
      )}
    </div>
  );
}
