import type { PlaySavedPlace } from "@/types/play-journey";

export function durationToHoursMinutes(totalMinutes: number | null | undefined): {
  hours: string;
  minutes: string;
} {
  const total = totalMinutes && totalMinutes > 0 ? totalMinutes : 120;
  return {
    hours: String(Math.floor(total / 60)),
    minutes: String(total % 60),
  };
}

export function isSameSavedPlace(
  a: Pick<PlaySavedPlace, "venue_name" | "team_name" | "latitude" | "longitude">,
  b: Pick<PlaySavedPlace, "venue_name" | "team_name" | "latitude" | "longitude">,
): boolean {
  const venueMatch =
    a.venue_name.trim().toLowerCase() === b.venue_name.trim().toLowerCase();
  const teamMatch =
    a.team_name.trim().toLowerCase() === b.team_name.trim().toLowerCase();
  if (!venueMatch || !teamMatch) return false;

  if (
    a.latitude != null &&
    a.longitude != null &&
    b.latitude != null &&
    b.longitude != null
  ) {
    return (
      a.latitude.toFixed(5) === b.latitude.toFixed(5) &&
      a.longitude.toFixed(5) === b.longitude.toFixed(5)
    );
  }

  return true;
}
