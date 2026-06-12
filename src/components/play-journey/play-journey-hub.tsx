"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AchievementGrid } from "@/components/play-journey/achievement-grid";
import { PlayHoursChart } from "@/components/play-journey/play-hours-chart";
import { PlayJourneyHero } from "@/components/play-journey/play-journey-hero";
import { PlayMapOsm } from "@/components/play-journey/play-map-osm";
import { SavedPlacesSection } from "@/components/play-journey/saved-places-section";
import { SessionFormPanel } from "@/components/play-journey/session-form-panel";
import { SessionTimeline } from "@/components/play-journey/session-timeline";
import { sessionsToMapMarkers } from "@/lib/play-map-markers";
import type {
  Achievement,
  JourneyStats,
  PlaySavedPlace,
  PlaySession,
} from "@/types/play-journey";
import { Button } from "@/components/ui/button";

type Props = {
  sessions: PlaySession[];
  savedPlaces: PlaySavedPlace[];
  stats: JourneyStats;
  achievements: Achievement[];
};

export function PlayJourneyHub({
  sessions,
  savedPlaces,
  stats,
  achievements,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formPreset, setFormPreset] = useState<PlaySavedPlace | null>(null);
  const markers = useMemo(() => sessionsToMapMarkers(sessions), [sessions]);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const openForm = (preset?: PlaySavedPlace) => {
    setFormPreset(preset ?? null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormPreset(null);
  };

  return (
    <div className="space-y-5">
      <PlayJourneyHero
        stats={stats}
        unlockedCount={unlockedCount}
        totalAchievements={achievements.length}
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4" />
          紀錄這次打球
        </Button>
      </div>

      <SavedPlacesSection
        places={savedPlaces}
        onQuickRecord={(place) => openForm(place)}
      />

      {showForm && (
        <SessionFormPanel
          savedPlaces={savedPlaces}
          preset={formPreset}
          onClose={closeForm}
          onSaved={() => router.refresh()}
        />
      )}

      <section className="glass-card overflow-hidden p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              打球地圖
            </h2>
            <p className="text-xs text-muted">
              已標記 {markers.length} 個地點 · 可切換地圖樣式
            </p>
          </div>
        </div>
        <PlayMapOsm markers={markers} />
      </section>

      <PlayHoursChart sessions={sessions} />

      <AchievementGrid achievements={achievements} />

      <SessionTimeline sessions={sessions} />
    </div>
  );
}
