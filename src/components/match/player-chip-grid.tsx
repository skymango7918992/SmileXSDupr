"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Search } from "lucide-react";
import { playerDisplayName, formatDuprRating, playerPickerSubtitle } from "@/lib/player-display";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  players: Player[];
  selectedIds: string[];
  onSave: (ids: string[]) => Promise<void>;
  cardClassName?: string;
};

export function PlayerChipGrid({
  players,
  selectedIds,
  onSave,
  cardClassName,
}: Props) {
  const [draftIds, setDraftIds] = useState(selectedIds);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraftIds(selectedIds);
  }, [selectedIds]);

  const dirty =
    draftIds.length !== selectedIds.length ||
    draftIds.some((id) => !selectedIds.includes(id));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        playerDisplayName(p).toLowerCase().includes(q) ||
        p.dupr_id.toLowerCase().includes(q),
    );
  }, [players, query]);

  const togglePlayer = (id: string) => {
    setDraftIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const selectFiltered = () => {
    const ids = new Set(draftIds);
    for (const p of filtered) ids.add(p.id);
    setDraftIds([...ids]);
  };

  const clearAll = () => setDraftIds([]);

  const handleSave = () => {
    startTransition(async () => {
      await onSave(draftIds);
    });
  };

  return (
    <Card className={cn("flex h-full flex-col", cardClassName)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">今日到場球員</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="secondary" size="sm" onClick={selectFiltered}>
            全選{query.trim() ? "搜尋結果" : ""}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            清除
          </Button>
          <Button
            size="sm"
            loading={isPending}
            disabled={!dirty}
            onClick={handleSave}
          >
            儲存名單
          </Button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋姓名或 DUPR ID"
          className="h-11 pl-10"
        />
      </div>

      <p className="mb-2 text-xs text-muted">
        已選 {draftIds.length} 人 · 顯示 {filtered.length} / {players.length}
        {dirty ? " · 尚未儲存" : ""}
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border [-webkit-overflow-scrolling:touch]">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">找不到符合的球員</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 p-2 sm:gap-2">
            {filtered.map((player) => {
              const selected = draftIds.includes(player.id);
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => togglePlayer(player.id)}
                  className={cn(
                    "btn-touch relative min-h-[4.25rem] rounded-lg border px-1.5 py-2 text-center transition-colors",
                    selected
                      ? "border-primary bg-primary-subtle/90 ring-1 ring-primary/25"
                      : "border-border bg-surface hover:border-primary/30 hover:bg-surface-muted",
                  )}
                >
                  {selected && (
                    <Check className="absolute right-1 top-1 h-3.5 w-3.5 text-primary" />
                  )}
                  <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                    {playerDisplayName(player)}
                  </span>
                  <span className="mt-1 block truncate text-[10px] font-medium text-primary">
                    {playerPickerSubtitle(player)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {players.length === 0 && (
        <p className="mt-3 text-sm text-muted">尚無有效球員，請先到球員管理新增。</p>
      )}

      <p className="mt-2 text-xs text-muted">至少 4 人才能排場</p>
    </Card>
  );
}
