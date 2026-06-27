"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PracticeLocationOption } from "@/types/technique-practice";

export function getDefaultLocationId(
  locations: PracticeLocationOption[],
): string {
  return (
    locations.find((l) => l.id !== "custom")?.id ??
    locations[0]?.id ??
    "custom"
  );
}

export function resolveLocationName(
  locations: PracticeLocationOption[],
  locationId: string,
  customLocation: string,
): string {
  if (locationId === "custom") return customLocation.trim();
  return (
    locations.find((l) => l.id === locationId)?.name ?? customLocation.trim()
  );
}

type VenueLocationFieldProps = {
  locations: PracticeLocationOption[];
  locationId: string;
  onLocationIdChange: (id: string) => void;
  customLocation: string;
  onCustomLocationChange: (value: string) => void;
  label?: string;
  customPlaceholder?: string;
  variant?: "default" | "modal";
  className?: string;
};

export function VenueLocationField({
  locations,
  locationId,
  onLocationIdChange,
  customLocation,
  onCustomLocationChange,
  label = "地點",
  customPlaceholder = "輸入地點名稱",
  variant = "default",
  className,
}: VenueLocationFieldProps) {
  const selectClass =
    variant === "modal"
      ? "cj-input"
      : "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground";

  const inputClass =
    variant === "modal"
      ? "cj-input mt-2 h-11"
      : "mt-2 h-11";

  return (
    <div className={className}>
      {label ? (
        <p
          className={cn(
            "mb-1.5 text-sm font-medium",
            variant === "modal" ? "cj-field-label" : "text-muted",
          )}
        >
          {label}
        </p>
      ) : null}
      <select
        value={locationId}
        onChange={(e) => onLocationIdChange(e.target.value)}
        className={selectClass}
      >
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
      {locationId === "custom" && (
        <Input
          value={customLocation}
          onChange={(e) => onCustomLocationChange(e.target.value)}
          placeholder={customPlaceholder}
          className={inputClass}
        />
      )}
    </div>
  );
}
