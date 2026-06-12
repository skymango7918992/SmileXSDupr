import { PlayJourneyHub } from "@/components/play-journey/play-journey-hub";
import { Card } from "@/components/ui/card";
import { getPlaySessions } from "@/lib/actions/play-journey";
import { getSavedPlaces } from "@/lib/actions/play-saved-places";
import {
  computeAchievements,
  computeJourneyStats,
} from "@/lib/play-achievements";

export default async function PlayMapPage() {
  try {
    const [sessions, savedPlaces] = await Promise.all([
      getPlaySessions(500),
      getSavedPlaces(),
    ]);
    const stats = computeJourneyStats(sessions);
    const achievements = computeAchievements(sessions, stats);

    return (
      <PlayJourneyHub
        sessions={sessions}
        savedPlaces={savedPlaces}
        stats={stats}
        achievements={achievements}
      />
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "無法載入打球軌跡";
    return (
      <Card>
        <h1 className="text-lg font-semibold text-foreground">打球軌跡</h1>
        <p className="mt-2 text-sm text-live">{message}</p>
        <p className="mt-3 text-sm text-muted">
          若為首次使用，請在 Supabase SQL Editor 依序執行{" "}
          <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">
            009_play_journey.sql
          </code>{" "}
          與{" "}
          <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">
            010_play_sessions_geo.sql
          </code>{" "}
          與{" "}
          <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">
            011_play_saved_places.sql
          </code>
        </p>
      </Card>
    );
  }
}
