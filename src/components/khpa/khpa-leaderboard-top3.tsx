import { Trophy } from "lucide-react";
import { KhpaBadgeAvatar, KhpaBadgePill } from "@/components/khpa/badge-avatar";
import { formatDuprRating } from "@/lib/player-display";
import type { KhpaLeaderboardEntry } from "@/types/khpa";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

type Props = {
  entries: KhpaLeaderboardEntry[];
  year: number;
  error?: string | null;
  compact?: boolean;
  onViewAll?: () => void;
};

const PODIUM = [
  { rank: 2, medal: "🥈", order: "order-1", bar: "h-12 sm:h-16" },
  { rank: 1, medal: "🥇", order: "order-2", bar: "h-20 sm:h-24" },
  { rank: 3, medal: "🥉", order: "order-3", bar: "h-10 sm:h-14" },
] as const;

export function KhpaLeaderboardTop3({
  entries,
  year,
  error,
  compact,
  onViewAll,
}: Props) {
  const byRank = new Map(entries.map((e) => [e.rank, e]));

  return (
    <Card className={cn("overflow-hidden", compact && "shadow-sm")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardTitle className={cn("flex items-center gap-2", compact && "text-base")}>
          <Trophy className="h-5 w-5 text-amber-500" />
          {year} 獲勝榜 TOP 3
        </CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" className="text-muted" onClick={onViewAll}>
            完整排名
          </Button>
        )}
      </div>

      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">{year} 年尚無完成對戰紀錄。</p>
      ) : (
        <div className="flex items-end justify-center gap-1 px-0.5 pb-1 sm:gap-3 sm:px-1">
          {PODIUM.map((slot) => {
            const entry = byRank.get(slot.rank);
            return (
              <div
                key={slot.rank}
                className={cn(
                  "flex min-w-0 flex-1 max-w-[6rem] flex-col items-center sm:max-w-[8rem]",
                  slot.order,
                )}
              >
                {entry ? (
                  <>
                    <KhpaBadgeAvatar
                      wins={entry.wins}
                      name={entry.name}
                      size={compact ? "sm" : "md"}
                      className="sm:hidden"
                    />
                    <KhpaBadgeAvatar
                      wins={entry.wins}
                      name={entry.name}
                      size={compact ? "md" : "lg"}
                      className="hidden sm:flex"
                    />
                    <p className="mt-1.5 line-clamp-2 text-center text-xs font-semibold sm:text-sm">
                      {entry.name}
                    </p>
                    <p className="font-data text-base font-bold text-primary sm:text-lg">
                      DUPR {formatDuprRating(entry.duprRating)}
                    </p>
                    <p className="text-[10px] text-muted">{entry.wins} 勝</p>
                    {!compact && <KhpaBadgePill wins={entry.wins} />}
                  </>
                ) : (
                  <div className="flex h-16 w-full items-center justify-center rounded-xl border border-dashed border-border text-xl opacity-40">
                    {slot.medal}
                  </div>
                )}
                <div
                  className={cn(
                    "mt-1.5 w-full rounded-t-lg bg-gradient-to-t from-primary/30 to-primary/5",
                    slot.bar,
                  )}
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
