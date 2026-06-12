"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deletePlaySession } from "@/lib/actions/play-journey";
import { formatDuration } from "@/lib/play-achievements";
import { formatTimeLabel } from "@/lib/play-achievements";
import { formatDate } from "@/lib/utils";
import {
  JOURNEY_SPORT_LABELS,
  type PlaySession,
} from "@/types/play-journey";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  sessions: PlaySession[];
};

export function SessionTimeline({ sessions }: Props) {
  const [pending, startTransition] = useTransition();

  if (!sessions.length) {
    return (
      <section className="glass-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-foreground">成長軌跡</h2>
        <p className="mt-2 text-sm text-muted">
          每次打完球記一筆，這裡會變成你的運動成長史 📖
        </p>
      </section>
    );
  }

  return (
    <section className="glass-card p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">成長軌跡</h2>
        <p className="text-xs text-muted">最近 {sessions.length} 筆打球紀錄</p>
      </div>

      <ol className="play-timeline">
        {sessions.map((s, i) => (
          <li key={s.id} className="play-timeline__item">
            <div
              className={cn(
                "play-timeline__dot",
                s.sport_type === "pickleball"
                  ? "play-timeline__dot--pickleball"
                  : "play-timeline__dot--badminton",
              )}
              aria-hidden
            />
            {i < sessions.length - 1 && (
              <div className="play-timeline__line" aria-hidden />
            )}
            <div className="play-timeline__body">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">
                    {formatDate(s.played_on)}
                    {s.start_time && (
                      <span className="ml-2 font-data text-sm font-normal text-muted">
                        {formatTimeLabel(s.start_time)}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-secondary-foreground">
                    <span
                      className={cn(
                        "mr-1.5 inline-flex rounded px-1.5 py-0.5 text-xs font-medium",
                        s.sport_type === "pickleball"
                          ? "bg-primary-subtle text-primary"
                          : "bg-violet-100 text-violet-700",
                      )}
                    >
                      {JOURNEY_SPORT_LABELS[s.sport_type]}
                    </span>
                    {s.venue_name}
                    {s.team_name ? ` · ${s.team_name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-data text-sm font-semibold text-primary">
                    {formatDuration(s.duration_minutes)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted hover:text-live"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deletePlaySession(s.id);
                      })
                    }
                    aria-label="刪除紀錄"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {s.notes && (
                <p className="mt-1 text-xs text-muted">{s.notes}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
