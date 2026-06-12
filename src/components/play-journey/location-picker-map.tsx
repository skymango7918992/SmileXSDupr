"use client";

import dynamic from "next/dynamic";

export type MapPick = {
  latitude: number;
  longitude: number;
};

const LocationPickerMapInner = dynamic(
  () =>
    import("@/components/play-journey/location-picker-map-inner").then(
      (m) => m.LocationPickerMapInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface-muted text-sm text-muted">
        載入地圖…
      </div>
    ),
  },
);

type Props = {
  latitude: number | null;
  longitude: number | null;
  onPick: (pick: MapPick) => void;
};

export function LocationPickerMap(props: Props) {
  return <LocationPickerMapInner {...props} />;
}
