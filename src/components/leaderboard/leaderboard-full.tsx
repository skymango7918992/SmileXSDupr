"use client";

import { useMemo, useState } from "react";
import { Search, Trophy } from "lucide-react";
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
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-4 shadow-[0_30px_80px_rgba(15,77,60,0.12)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/30">
              <Trophy className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                獲勝榜
              </h1>
              <p className="text-sm text-slate-500">
                共 {entries.length} 位球員 · 勝場越多勳章越高
              </p>
            </div>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋姓名或 DUPR ID"
              className="min-h-11 pl-9"
            />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-12 text-center text-sm text-slate-500">
            {entries.length === 0
              ? "尚無已完成對戰紀錄"
              : "找不到符合的球員"}
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
