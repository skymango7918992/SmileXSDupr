"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { KhpaBadgeAvatar } from "@/components/khpa/badge-avatar";
import type { KhpaPlayer } from "@/types/khpa";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  value: string;
  players: KhpaPlayer[];
  excludeIds: string[];
  playerWins?: Record<string, number>;
  onChange: (playerId: string) => void;
  disabled?: boolean;
};

export function KhpaPlayerPicker({
  label,
  value,
  players,
  excludeIds,
  playerWins,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = players.find((p) => p.id === value);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => p.id === value || !excludeIds.includes(p.id))
      .filter((p) => {
        if (!q) return true;
        return (
          p.display_name.toLowerCase().includes(q) ||
          p.dupr_id.toLowerCase().includes(q)
        );
      })
      .slice(0, 80);
  }, [players, excludeIds, value, query]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <div>
        <p className="mb-1.5 text-sm font-medium text-muted">{label}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={cn(
            "btn-touch flex h-14 w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 text-left transition-colors",
            "hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            disabled && "opacity-50",
          )}
        >
          {selected ? (
            <>
              <KhpaBadgeAvatar
                wins={playerWins?.[selected.id] ?? 0}
                name={selected.display_name}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{selected.display_name}</p>
                <p className="truncate text-xs text-muted">{selected.dupr_id}</p>
              </div>
            </>
          ) : (
            <span className="text-sm text-muted">點選搜尋球員…</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center">
          <div
            className="glass-overlay absolute inset-0"
            aria-hidden
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          />
          <div className="glass-modal relative flex max-h-[min(85vh,640px)] w-full flex-col rounded-t-2xl sm:max-w-md sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-divider px-4 py-3">
              <p className="font-semibold">{label}</p>
              <button
                type="button"
                className="btn-touch rounded-lg p-2 text-muted hover:bg-surface-muted"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                aria-label="關閉"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-divider px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜尋姓名或 DUPR ID"
                  className="h-12 pl-10 text-base"
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                共 {players.length} 位啟用球員 · 顯示 {options.length} 筆
              </p>
            </div>

            <ul className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              {options.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-muted">找不到符合的球員</li>
              ) : (
                options.map((player) => {
                  const isSelected = player.id === value;
                  return (
                    <li key={player.id}>
                      <button
                        type="button"
                        onClick={() => pick(player.id)}
                        className={cn(
                          "btn-touch flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                          isSelected
                            ? "bg-primary/10 ring-1 ring-primary/30"
                            : "hover:bg-surface-muted",
                        )}
                      >
                        <KhpaBadgeAvatar
                          wins={playerWins?.[player.id] ?? 0}
                          name={player.display_name}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{player.display_name}</p>
                          <p className="truncate text-xs text-muted">{player.dupr_id}</p>
                        </div>
                        {isSelected && <Check className="h-5 w-5 shrink-0 text-primary" />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            {value && (
              <div className="border-t border-divider p-3">
                <button
                  type="button"
                  className="btn-touch w-full rounded-xl py-3 text-sm text-muted hover:bg-surface-muted"
                  onClick={() => pick("")}
                >
                  清除選擇
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
