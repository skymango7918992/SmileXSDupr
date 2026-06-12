"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CuteAvatar } from "@/components/brand/cute-avatar";
import { PageHero } from "@/components/brand/page-hero";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { Input } from "@/components/ui/input";
import { LeaderboardRow } from "./leaderboard-row";
import { BadgeLegend } from "./badge-legend";

type Props = {
  entries: LeaderboardEntry[];
};

export function LeaderboardFull({ entries }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.duprId.toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <div className="space-y-6">
      <PageHero variant="leaderboard" />

      <section className="glass-card p-4 sm:p-5">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋姓名或 DUPR ID"
            className="min-h-11 pl-9"
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted sm:text-left">
          共 {entries.length} 位球員上榜
        </p>
      </section>

      <section className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-[14px] border border-dashed border-border bg-surface py-12 text-center">
            <CuteAvatar
              name={query || "空空"}
              variant="chibi"
              size="xl"
              className="mb-3"
            />
            <p className="text-sm text-muted">
              {entries.length === 0
                ? "尚無已完成對戰紀錄"
                : "找不到符合的球員"}
            </p>
          </div>
        ) : (
          filtered.map((entry) => (
            <LeaderboardRow key={entry.playerId} entry={entry} />
          ))
        )}
      </section>

      <BadgeLegend />
    </div>
  );
}
