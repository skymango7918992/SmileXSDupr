import { CultivationBadge, CultivationPill } from "@/components/cultivation/cultivation-badge";
import { CultivationLegend } from "@/components/cultivation/cultivation-legend";
import { formatDuprRating } from "@/lib/player-display";
import type { KhpaLeaderboardEntry } from "@/types/khpa";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  entries: KhpaLeaderboardEntry[];
  year: number;
  error?: string | null;
};

export function KhpaLeaderboardFull({ entries, year, error }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardTitle className="mb-4">{year} 協會獲勝榜 TOP 10</CardTitle>
        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted">{year} 年尚無完成對戰紀錄。</p>
        ) : (
          <ol className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.playerId}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3",
                  entry.rank <= 3 && "border-teal-500/30 bg-teal-500/5",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    entry.rank === 1 && "bg-amber-400 text-amber-950",
                    entry.rank === 2 && "bg-slate-300 text-slate-800",
                    entry.rank === 3 && "bg-orange-300 text-orange-900",
                    entry.rank > 3 && "bg-surface-muted text-muted",
                  )}
                >
                  {entry.rank}
                </span>
                <CultivationBadge
                  wins={entry.wins}
                  winRate={entry.winRate}
                  gender={entry.avatarGender}
                  name={entry.name}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{entry.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <CultivationPill
                      wins={entry.wins}
                      winRate={entry.winRate}
                      gender={entry.avatarGender}
                    />
                    <span className="text-xs text-muted">
                      {entry.wins}勝 {entry.losses}敗 · 勝率 {entry.winRate}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-data text-xl font-bold text-primary">
                    {formatDuprRating(entry.duprRating)}
                  </p>
                  <p className="text-[10px] text-muted">DUPR</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <CultivationLegend />
    </div>
  );
}
