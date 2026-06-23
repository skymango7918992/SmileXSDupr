"use client";

import { useCallback, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KhpaLeaderboardFull } from "@/components/khpa/khpa-leaderboard-full";
import { KhpaLeaderboardTop3 } from "@/components/khpa/khpa-leaderboard-top3";
import {
  getKhpaLeaderboardTop10,
  getKhpaLeaderboardTop3,
} from "@/lib/actions/khpa/leaderboard";
import type { KhpaLeaderboardEntry } from "@/types/khpa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  availableYears: number[];
  initialYear: number;
  initialTop3: KhpaLeaderboardEntry[];
  initialTop10: KhpaLeaderboardEntry[];
  compact?: boolean;
  showFull?: boolean;
  onViewAll?: () => void;
};

export function KhpaLeaderboardPanel({
  availableYears,
  initialYear,
  initialTop3,
  initialTop10,
  compact,
  showFull = false,
  onViewAll,
}: Props) {
  const currentCalendarYear = new Date().getFullYear();
  const years =
    availableYears.length > 0
      ? availableYears
      : [currentCalendarYear, currentCalendarYear - 1];

  const [year, setYear] = useState(initialYear);
  const [top3, setTop3] = useState(initialTop3);
  const [top10, setTop10] = useState(initialTop10);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadYear = useCallback((nextYear: number) => {
    setYear(nextYear);
    setError(null);
    startTransition(async () => {
      try {
        const [t3, t10] = await Promise.all([
          getKhpaLeaderboardTop3(nextYear),
          getKhpaLeaderboardTop10(nextYear),
        ]);
        setTop3(t3);
        setTop10(t10);
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      }
    });
  }, []);

  const yearIndex = years.indexOf(year);
  const canPrev = yearIndex < years.length - 1;
  const canNext = yearIndex > 0;

  return (
    <div className={cn(isPending && "opacity-70 transition-opacity")}>
      <div className="mb-3 flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canPrev || isPending}
          onClick={() => loadYear(years[yearIndex + 1]!)}
          aria-label="上一年"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-wrap justify-center gap-1.5">
          {years.slice(0, 5).map((y) => (
            <button
              key={y}
              type="button"
              disabled={isPending}
              onClick={() => loadYear(y)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                y === year
                  ? "glass-nav-active text-xs font-semibold"
                  : "bg-surface-muted text-muted hover:text-foreground",
              )}
            >
              {y}
              {y === currentCalendarYear ? " 今年" : ""}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canNext || isPending}
          onClick={() => loadYear(years[yearIndex - 1]!)}
          aria-label="下一年"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!showFull ? (
        <KhpaLeaderboardTop3
          entries={top3}
          year={year}
          error={error}
          compact={compact}
          onViewAll={onViewAll}
        />
      ) : (
        <div className="mt-1">
          <KhpaLeaderboardFull entries={top10} year={year} error={error} />
        </div>
      )}
    </div>
  );
}
