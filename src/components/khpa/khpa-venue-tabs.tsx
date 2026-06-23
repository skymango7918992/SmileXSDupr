"use client";

import type { KhpaVenue } from "@/types/khpa";
import { cn } from "@/lib/utils";

type Props = {
  venues: KhpaVenue[];
  activeVenueId: string;
  onChange: (venue: KhpaVenue) => void;
  matchCounts?: Record<string, number>;
  disabled?: boolean;
};

export function KhpaVenueTabs({
  venues,
  activeVenueId,
  onChange,
  matchCounts,
  disabled,
}: Props) {
  if (venues.length <= 1) {
    const venue = venues[0];
    if (!venue) return null;
    return (
      <div className="rounded-xl border border-border bg-surface-muted/50 px-3 py-2 text-sm text-muted">
        地點：<span className="font-semibold text-foreground">{venue.name}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="flex min-w-min gap-2 px-1"
        role="tablist"
        aria-label="活動地點"
      >
        {venues.map((venue) => {
          const active = venue.id === activeVenueId;
          const count = matchCounts?.[venue.id];
          return (
            <button
              key={venue.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(venue)}
              className={cn(
                "btn-touch shrink-0 rounded-xl px-3 py-2.5 text-left transition-colors sm:min-w-[8.5rem] sm:px-4 sm:py-3",
                active
                  ? "glass-nav-active"
                  : "border border-border bg-surface hover:bg-surface-muted",
                disabled && "opacity-60",
              )}
            >
              <p className="text-sm font-semibold leading-tight">{venue.name}</p>
              {count != null && (
                <p className="mt-0.5 text-[11px] text-muted">{count} 場</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
