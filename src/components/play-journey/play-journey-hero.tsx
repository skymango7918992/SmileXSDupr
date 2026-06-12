import { CuteAvatar } from "@/components/brand/cute-avatar";
import { BadmintonIcon, PickleballIcon } from "@/components/brand/sport-icons";
import { formatDuration, formatHoursDecimal } from "@/lib/play-achievements";
import type { JourneyStats } from "@/types/play-journey";
import { cn } from "@/lib/utils";

type Props = {
  stats: JourneyStats;
  unlockedCount: number;
  totalAchievements: number;
  className?: string;
};

export function PlayJourneyHero({
  stats,
  unlockedCount,
  totalAchievements,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "page-hero-cute play-journey-hero relative mb-5 overflow-hidden rounded-2xl border-2 border-primary-soft/70 px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
    >
      <div className="sport-hero-spark sport-hero-spark--left" aria-hidden>
        <PickleballIcon className="h-9 w-9 text-primary/40" />
      </div>
      <div className="sport-hero-spark sport-hero-spark--right" aria-hidden>
        <BadmintonIcon className="h-9 w-9 text-violet-400/50" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CuteAvatar name="打球軌跡" size="lg" variant="chibi" />
          <div>
            <p className="text-xs font-medium text-primary">我的成長史</p>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              打球軌跡
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              每次開打就紀錄 · 地圖足跡 · 獎章成就
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span className="play-stat-pill">
            <span className="play-stat-pill__value font-data">
              {formatHoursDecimal(stats.total_minutes)}
            </span>
            <span className="play-stat-pill__label">累積小時</span>
          </span>
          <span className="play-stat-pill">
            <span className="play-stat-pill__value font-data">
              {stats.mapped_venue_count}
            </span>
            <span className="play-stat-pill__label">地圖地點</span>
          </span>
          <span className="play-stat-pill play-stat-pill--accent">
            <span className="play-stat-pill__value font-data">
              {unlockedCount}/{totalAchievements}
            </span>
            <span className="play-stat-pill__label">獎章</span>
          </span>
        </div>
      </div>

      {stats.week_streak > 0 && (
        <p className="relative mt-3 text-sm text-secondary-foreground">
          <span aria-hidden>💫</span> 連續{" "}
          <strong className="text-primary">{stats.week_streak}</strong>{" "}
          週都有打球紀錄
          {stats.this_week_sessions > 0 && (
            <>
              {" "}
              · 本週已{" "}
              <strong>{formatDuration(stats.this_week_minutes)}</strong>
            </>
          )}
        </p>
      )}
    </div>
  );
}
