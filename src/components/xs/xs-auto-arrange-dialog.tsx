"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { SCORE_TYPE_LABEL } from "@/lib/dupr-score-type";
import { playerDisplayName, playerPickerSubtitle } from "@/lib/player-display";
import type { Player, ScoreType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  players: Player[];
  onSubmit: (input: {
    playerIds: string[];
    matchCount: number;
    scoreType: ScoreType;
  }) => Promise<void>;
  onClose: () => void;
};

const SCORE_OPTIONS: ScoreType[] = ["sideout", "rally"];

export function XsAutoArrangeDialog({ players, onSubmit, onClose }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [matchCount, setMatchCount] = useState("4");
  const [scoreType, setScoreType] = useState<ScoreType>("sideout");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { error: toastError, success } = useAppUi();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const selectFiltered = () => {
    const ids = new Set(selectedIds);
    for (const p of filtered) ids.add(p.id);
    setSelectedIds([...ids]);
  };

  const handleSubmit = async () => {
    if (selectedIds.length < 4) {
      toastError("請至少選擇 4 位球員");
      return;
    }
    const count = Number(matchCount);
    if (Number.isNaN(count) || count < 1 || count > 30) {
      toastError("場數請介於 1～30");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        playerIds: selectedIds,
        matchCount: count,
        scoreType,
      });
      success(`已排列 ${count} 場對戰`);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="glass-overlay absolute inset-0" aria-hidden onClick={onClose} />
      <Card className="glass-modal relative flex max-h-[min(96dvh,100%)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:max-h-[min(90dvh,720px)] sm:rounded-2xl">
        <div className="shrink-0 border-b border-divider px-4 py-3 sm:px-6">
          <CardTitle className="mb-1 text-base sm:text-lg">自動排列對戰</CardTitle>
          <p className="text-xs text-muted sm:text-sm">
            選擇參與球員與場數 · 系統會盡量安排不同搭檔組合
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">參與球員</p>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" onClick={selectFiltered}>
                全選{query.trim() ? "搜尋結果" : ""}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                清除
              </Button>
            </div>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋姓名或 DUPR ID"
              className="h-11 pl-10"
            />
          </div>

          <p className="mb-2 text-xs text-muted">
            已選 {selectedIds.length} 人 · 至少 4 人
          </p>

          <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-border p-2">
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted">找不到符合的球員</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {filtered.map((player) => {
                  const selected = selectedIds.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => togglePlayer(player.id)}
                      className={cn(
                        "btn-touch relative min-h-[4rem] rounded-lg border px-1.5 py-2 text-center transition-colors",
                        selected
                          ? "border-primary bg-primary-subtle/90 ring-1 ring-primary/25"
                          : "border-border bg-surface hover:border-primary/30",
                      )}
                    >
                      {selected && (
                        <Check className="absolute right-1 top-1 h-3.5 w-3.5 text-primary" />
                      )}
                      <span className="line-clamp-2 text-[11px] font-semibold leading-tight">
                        {playerDisplayName(player)}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-primary">
                        {playerPickerSubtitle(player)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-4">
            <p className="mb-1.5 text-sm font-medium text-muted">排列場數</p>
            <Input
              type="number"
              min={1}
              max={30}
              value={matchCount}
              onChange={(e) => setMatchCount(e.target.value)}
              className="h-11"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-muted">計分制度</p>
            <div className="grid grid-cols-2 gap-2">
              {SCORE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setScoreType(opt)}
                  className={cn(
                    "btn-touch rounded-xl border px-3 py-2.5 text-left transition-colors",
                    scoreType === opt
                      ? "border-primary bg-primary/10 ring-1 ring-primary/25"
                      : "border-border bg-surface hover:bg-surface-muted",
                  )}
                >
                  <p className="text-sm font-semibold">{SCORE_TYPE_LABEL[opt]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex gap-2 border-t border-divider p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="secondary" onClick={onClose} className="btn-touch flex-1">
            取消
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            loading={loading}
            disabled={selectedIds.length < 4}
            className="btn-touch flex-1"
          >
            開始排列
          </Button>
        </div>
      </Card>
    </div>
  );
}
