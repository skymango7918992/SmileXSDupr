import { KhpaBadgeAvatar, KhpaBadgePill } from "@/components/khpa/badge-avatar";
import { KhpaMedal } from "@/components/khpa/khpa-medal";
import { formatDuprRating } from "@/lib/player-display";
import { KHPA_BADGE_TIERS, KHPA_DEFAULT_BADGE } from "@/lib/khpa/badges";
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
                <KhpaBadgeAvatar wins={entry.wins} name={entry.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{entry.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <KhpaBadgePill wins={entry.wins} />
                    <span className="text-xs text-muted">
                      {entry.wins}勝 {entry.losses}敗
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

      <Card>
        <CardTitle className="mb-3">勳章等級說明</CardTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[KHPA_DEFAULT_BADGE, ...KHPA_BADGE_TIERS].map((tier) => (
            <li
              key={tier.level}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
            >
              <KhpaMedal badge={tier} size={36} />
              <div>
                <p className={cn("text-sm font-semibold", tier.pillText)}>
                  Lv.{tier.level} {tier.name}
                </p>
                <p className="text-xs text-muted">{tier.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
