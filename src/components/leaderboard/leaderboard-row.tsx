import { formatDuprRating } from "@/lib/player-display";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { CultivationBadge, CultivationPill } from "@/components/cultivation/cultivation-badge";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="absolute -left-1 -top-1 z-[2] flex h-5 w-5 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="absolute -left-1 -top-1 z-[2] flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="absolute -left-1 -top-1 z-[2] flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
        3
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center text-sm font-medium text-muted">
      {rank}
    </span>
  );
}

type Props = {
  entry: LeaderboardEntry;
  compact?: boolean;
};

export function LeaderboardRow({ entry, compact }: Props) {
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[12px] border border-border bg-surface px-3 py-2.5 transition-colors hover:bg-surface-muted/30",
        isTop3 && "border-primary/20 bg-primary-soft/20",
      )}
    >
      {!isTop3 && <RankBadge rank={entry.rank} />}

      <div className="relative shrink-0">
        {isTop3 && <RankBadge rank={entry.rank} />}
        <CultivationBadge
          wins={entry.wins}
          winRate={entry.winRate}
          gender={entry.avatarGender}
          name={entry.name}
          size={compact ? "sm" : "md"}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{entry.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <CultivationPill
            wins={entry.wins}
            winRate={entry.winRate}
            gender={entry.avatarGender}
          />
          <span className="text-xs text-muted">
            {entry.wins} 勝 {entry.losses} 敗 · 勝率 {entry.winRate}%
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="font-data text-lg font-semibold tabular-nums text-foreground">
          {formatDuprRating(entry.duprRating)}
        </p>
        <p className="text-xs text-muted">DUPR</p>
      </div>
    </div>
  );
}
