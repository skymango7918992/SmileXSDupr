import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { cn } from "@/lib/utils";
import { BadgeMedal } from "./badge-medal";

type Props = {
  entries: LeaderboardEntry[];
  error?: string | null;
};

const PODIUM = [
  {
    rank: 2,
    label: "亞軍",
    medal: "🥈",
    bar: "h-20 sm:h-24",
    order: "order-1",
    ring: "ring-slate-300/70",
    bg: "from-slate-200 to-slate-300",
  },
  {
    rank: 1,
    label: "冠軍",
    medal: "🥇",
    bar: "h-28 sm:h-32",
    order: "order-2",
    ring: "ring-amber-300/80",
    bg: "from-amber-300 to-amber-500",
  },
  {
    rank: 3,
    label: "季軍",
    medal: "🥉",
    bar: "h-16 sm:h-20",
    order: "order-3",
    ring: "ring-orange-300/70",
    bg: "from-orange-300 to-orange-500",
  },
] as const;

function PodiumSlot({
  slot,
  entry,
}: {
  slot: (typeof PODIUM)[number];
  entry: LeaderboardEntry | undefined;
}) {
  if (!entry) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-end",
          slot.order,
        )}
      >
        <div className="mb-2 flex h-16 w-full max-w-[7rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-2 py-3 text-center sm:max-w-[8.5rem]">
          <span className="text-xl opacity-40">{slot.medal}</span>
          <p className="mt-1 text-xs text-slate-400">{slot.label}</p>
        </div>
        <div className="mt-2 h-3 w-full max-w-[7rem] rounded-t-xl bg-slate-100 sm:max-w-[8.5rem]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-end",
        slot.order,
      )}
    >
      <div className="mb-2 flex w-full max-w-[7rem] flex-col items-center rounded-2xl border border-white/80 bg-white/90 px-2 py-3 text-center shadow-sm sm:max-w-[8.5rem]">
        <span className="text-2xl">{slot.medal}</span>
        <p className="mt-1 line-clamp-1 text-sm font-bold text-slate-900">
          {entry.name}
        </p>
        <p className="text-[10px] text-slate-500">{entry.duprId}</p>
        <div className="mt-2">
          <BadgeMedal wins={entry.wins} size="sm" />
        </div>
        <p className="mt-2 text-lg font-black tabular-nums text-emerald-800">
          {entry.wins}
          <span className="ml-0.5 text-xs font-medium text-slate-500">勝</span>
        </p>
        <p className="text-[10px] text-slate-500">{entry.winRate}% 勝率</p>
      </div>
      <div
        className={cn(
          "flex w-full max-w-[7rem] items-end justify-center rounded-t-xl bg-gradient-to-t text-xs font-bold text-slate-800 sm:max-w-[8.5rem]",
          slot.bg,
          slot.bar,
        )}
      >
        {slot.label}
      </div>
    </div>
  );
}

export function LeaderboardTop3({ entries, error }: Props) {
  const byRank = new Map(entries.map((e) => [e.rank, e]));

  return (
    <section className="overflow-hidden rounded-3xl border border-white/60 bg-white/75 shadow-[0_20px_60px_rgba(15,77,60,0.1)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/25">
            <Trophy className="h-5 w-5 text-slate-900" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">獲勝榜 TOP 3</h2>
            <p className="text-xs text-slate-500">冠軍 · 亞軍 · 季軍</p>
          </div>
        </div>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
        >
          完整排名
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {error ? (
        <div className="px-4 py-8 text-center sm:px-6">
          <p className="text-sm text-amber-800">獲勝榜暫時無法載入：{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-6">
          <p className="text-sm text-slate-500">
            尚無已完成對戰，開始計分後即可上榜
          </p>
        </div>
      ) : (
        <div className="flex items-end justify-center gap-2 px-4 pb-6 pt-4 sm:gap-4 sm:px-6 sm:pt-6">
          {PODIUM.map((slot) => (
            <PodiumSlot
              key={slot.rank}
              slot={slot}
              entry={byRank.get(slot.rank)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
