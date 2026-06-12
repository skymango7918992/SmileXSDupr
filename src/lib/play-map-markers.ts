import type { JourneySport, MapMarker, PlaySession } from "@/types/play-journey";

function markerKey(s: PlaySession): string | null {
  if (s.latitude != null && s.longitude != null) {
    return `${s.latitude.toFixed(5)},${s.longitude.toFixed(5)}`;
  }
  return null;
}

export function sessionsToMapMarkers(sessions: PlaySession[]): MapMarker[] {
  const map = new Map<string, MapMarker>();

  for (const s of sessions) {
    const key = markerKey(s);
    if (!key || s.latitude == null || s.longitude == null) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        id: key,
        venue_name: s.venue_name.trim() || "未命名場地",
        latitude: s.latitude,
        longitude: s.longitude,
        session_count: 1,
        total_minutes: s.duration_minutes,
        sports: [s.sport_type],
        last_played_on: s.played_on,
      });
      continue;
    }

    existing.session_count += 1;
    existing.total_minutes += s.duration_minutes;
    if (!existing.sports.includes(s.sport_type)) {
      existing.sports.push(s.sport_type);
    }
    if (s.played_on > existing.last_played_on) {
      existing.last_played_on = s.played_on;
      if (s.venue_name.trim()) {
        existing.venue_name = s.venue_name.trim();
      }
    }
  }

  return [...map.values()].sort(
    (a, b) => b.session_count - a.session_count || b.total_minutes - a.total_minutes,
  );
}

export function countDistinctVenues(sessions: PlaySession[]): number {
  const keys = new Set<string>();
  for (const s of sessions) {
    const mk = markerKey(s);
    if (mk) {
      keys.add(mk);
    } else if (s.venue_name.trim()) {
      keys.add(`name:${s.venue_name.trim().toLowerCase()}`);
    }
  }
  return keys.size;
}

export function countMappedVenues(sessions: PlaySession[]): number {
  return sessionsToMapMarkers(sessions).length;
}

export function primarySport(sports: JourneySport[]): JourneySport {
  if (sports.length === 1) return sports[0];
  return "pickleball";
}
