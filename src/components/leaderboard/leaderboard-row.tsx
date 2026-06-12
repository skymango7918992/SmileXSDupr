import { CuteAvatar } from "@/components/brand/cute-avatar";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { BadgeMedal } from "./badge-medal";

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
        <CuteAvatar
          name={entry.name}
          variant="chibi"
          size={compact ? "md" : "lg"}
        />
      </div>

      <BadgeMedal wins={entry.wins} size={compact ? "sm" : "md"} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{entry.name}</p>
        <p className="truncate text-xs text-muted">{entry.duprId}</p>
      </div>

      <div className="text-right">
        <p className="text-lg font-semibold tabular-nums text-foreground">
          {entry.wins}
          <span className="ml-0.5 text-xs font-medium text-muted">勝</span>
        </p>
        {!compact && (
          <p className="text-xs text-muted">
            {entry.winRate}% · {entry.matches} 場
          </p>
        )}
      </div>
    </div>
  );
}
