import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import { CuteAvatar } from "@/components/brand/cute-avatar";
import { formatDuprRating } from "@/lib/player-display";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { cn } from "@/lib/utils";
import { BadgeMedal } from "./badge-medal";
import { Button } from "@/components/ui/button";

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
    barBg: "bg-primary-soft",
    avatarSize: "lg" as const,
  },
  {
    rank: 1,
    label: "冠軍",
    medal: "🥇",
    bar: "h-28 sm:h-32",
    order: "order-2",
    barBg: "bg-primary/45",
    avatarSize: "xl" as const,
  },
  {
    rank: 3,
    label: "季軍",
    medal: "🥉",
    bar: "h-16 sm:h-20",
    order: "order-3",
    barBg: "bg-primary/30",
    avatarSize: "lg" as const,
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
        <div className="mb-2 flex h-16 w-full max-w-[7rem] flex-col items-center justify-center rounded-[12px] border border-dashed border-border bg-surface-muted/30 px-2 py-3 text-center sm:max-w-[8.5rem]">
          <span className="text-xl opacity-40">{slot.medal}</span>
          <p className="mt-1 text-xs text-muted">{slot.label}</p>
        </div>
        <div className="mt-2 h-3 w-full max-w-[7rem] rounded-t-[8px] bg-surface-muted sm:max-w-[8.5rem]" />
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
      <div
        className={cn(
          "mb-2 flex w-full max-w-[7rem] flex-col items-center rounded-[12px] border border-border bg-surface px-2 py-3 text-center shadow-[var(--shadow-card)] sm:max-w-[8.5rem]",
          slot.rank === 1 && "border-warning/30 bg-gradient-to-b from-warning/10 to-surface",
        )}
      >
        <span className="text-xl leading-none sm:text-2xl">{slot.medal}</span>
        <div className="relative -mt-1 mb-1">
          <CuteAvatar
            name={entry.name}
            variant="chibi"
            size={slot.avatarSize}
            className={slot.rank === 1 ? "ring-2 ring-warning/40 ring-offset-1" : undefined}
          />
        </div>
        <p className="line-clamp-1 text-sm font-semibold text-foreground">
          {entry.name}
        </p>
        <p className="text-[10px] font-medium text-primary">
          DUPR {formatDuprRating(entry.duprRating)}
        </p>
        <div className="mt-1.5">
          <BadgeMedal wins={entry.wins} winRate={entry.winRate} size="sm" />
        </div>
        <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground">
          {formatDuprRating(entry.duprRating)}
        </p>
        <p className="text-[10px] text-muted">{entry.wins} 勝 · {entry.winRate}%</p>
      </div>
      <div
        className={cn(
          "flex w-full max-w-[7rem] items-end justify-center rounded-t-[8px] text-xs font-medium text-foreground sm:max-w-[8.5rem]",
          slot.barBg,
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
    <section className="glass-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-divider bg-surface-muted/50 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <CuteAvatar name="TOP3" variant="chibi" size="md" />
          <div>
            <h2 className="text-base font-semibold text-primary">
              獲勝榜 TOP 3
            </h2>
            <p className="text-xs text-muted">冠軍 · 亞軍 · 季軍</p>
          </div>
        </div>
        <Link href="/leaderboard">
          <Button variant="secondary" size="sm">
            完整排名
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="px-4 py-8 text-center sm:px-6">
          <p className="text-sm text-danger">獲勝榜暫時無法載入：{error}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="px-4 py-10 text-center sm:px-6">
          <CuteAvatar
            name="加油"
            variant="chibi"
            size="xl"
            className="mx-auto mb-3"
          />
          <p className="text-sm text-muted">
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
