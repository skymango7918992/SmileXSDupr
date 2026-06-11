import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { BadgeMedal } from "./badge-medal";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-xs font-black text-slate-900 shadow">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-xs font-black text-slate-800 shadow">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-xs font-black text-slate-900 shadow">
        3
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center text-sm font-semibold text-slate-500">
      {rank}
    </span>
  );
}

type Props = {
  entry: LeaderboardEntry;
  compact?: boolean;
};

export function LeaderboardRow({ entry, compact }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-2.5 transition hover:bg-white",
        entry.rank <= 3 && "border-amber-100/80 bg-gradient-to-r from-amber-50/50 to-white/80",
      )}
    >
      <RankBadge rank={entry.rank} />
      <BadgeMedal wins={entry.wins} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{entry.name}</p>
        <p className="truncate text-xs text-slate-500">{entry.duprId}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold tabular-nums text-emerald-800">
          {entry.wins}
          <span className="ml-0.5 text-xs font-medium text-slate-500">勝</span>
        </p>
        {!compact && (
          <p className="text-xs text-slate-500">
            {entry.winRate}% · {entry.matches} 場
          </p>
        )}
      </div>
    </div>
  );
}
