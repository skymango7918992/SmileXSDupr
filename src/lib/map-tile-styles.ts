export type MapTileStyleId = "minimal" | "soft" | "standard";

export type MapTileStyle = {
  id: MapTileStyleId;
  label: string;
  description: string;
  url: string;
  attribution: string;
};

export const MAP_TILE_STYLES: MapTileStyle[] = [
  {
    id: "minimal",
    label: "簡潔",
    description: "淡色極簡，突出你的打球足跡",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: "soft",
    label: "柔和",
    description: "清爽配色，路名較清楚",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: "standard",
    label: "標準",
    description: "OpenStreetMap 原始樣式",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
];

export const DEFAULT_MAP_TILE_STYLE: MapTileStyleId = "minimal";

export function getMapTileStyle(id: MapTileStyleId): MapTileStyle {
  return MAP_TILE_STYLES.find((s) => s.id === id) ?? MAP_TILE_STYLES[0];
}

export const MAP_STYLE_STORAGE_KEY = "play-map-tile-style";
