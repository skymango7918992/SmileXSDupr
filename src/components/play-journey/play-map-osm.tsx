"use client";

import dynamic from "next/dynamic";
import {
  MapStyleSwitch,
  useMapTileStylePreference,
} from "@/components/play-journey/map-style-switch";
import type { MapMarker } from "@/types/play-journey";

const PlayMapOsmInner = dynamic(
  () =>
    import("@/components/play-journey/play-map-osm-inner").then(
      (m) => m.PlayMapOsmInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="play-map-shell flex h-[min(420px,58vh)] items-center justify-center text-sm text-muted">
        載入地圖中…
      </div>
    ),
  },
);

type Props = {
  markers: MapMarker[];
};

export function PlayMapOsm({ markers }: Props) {
  const [styleId, setStyleId] = useMapTileStylePreference();

  return (
    <div className="space-y-2">
      <MapStyleSwitch value={styleId} onChange={setStyleId} />
      <PlayMapOsmInner markers={markers} styleId={styleId} />
    </div>
  );
}
