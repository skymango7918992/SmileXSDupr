"use client";

import { playerDisplayName } from "@/lib/player-display";
import { cn } from "@/lib/utils";
import type { Player } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

type Props = {
  players: Player[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  cardClassName?: string;
};

export function PlayerChipGrid({
  players,
  selectedIds,
  onSelectionChange,
  cardClassName,
}: Props) {
  const togglePlayer = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((pid) => pid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onSelectionChange(players.map((p) => p.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <Card className={cn("h-full", cardClassName)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <CardTitle>今日到場球員</CardTitle>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={selectAll}>
            全選有效球員
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            清除
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {players.map((player) => {
          const selected = selectedIds.includes(player.id);
          return (
            <button
              key={player.id}
              type="button"
              onClick={() => togglePlayer(player.id)}
              className={cn(
                "rounded-2xl border px-4 py-2 text-left text-sm transition duration-200",
                selected
                  ? "border-emerald-300 bg-emerald-100 text-emerald-900 shadow-lg"
                  : "border-gray-200 bg-white text-gray-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50",
              )}
            >
              <span className="font-semibold">{playerDisplayName(player)}</span>
              <span className="ml-2 text-xs opacity-60">{player.dupr_id}</span>
            </button>
          );
        })}
      </div>

      {players.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">
          尚無有效球員，請先到球員管理新增。
        </p>
      )}

      <p className="mt-4 text-xs text-gray-500">
        已選 {selectedIds.length} 人（至少 4 人才能排場）
      </p>
    </Card>
  );
}
