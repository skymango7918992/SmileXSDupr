"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { KhpaPlayerPicker } from "@/components/khpa/khpa-player-picker";
import { SCORE_TYPE_LABEL } from "@/lib/dupr-score-type";
import type { KhpaPlayer } from "@/types/khpa";
import type { ScoreType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { PlayerCultivationStats } from "@/lib/cultivation-tiers";

type Props = {
  players: KhpaPlayer[];
  playerStats?: Record<string, PlayerCultivationStats>;
  onSubmit: (input: {
    team1: [string, string];
    team2: [string, string];
    team1Score: number;
    team2Score: number;
    scoreType: ScoreType;
  }) => Promise<void>;
  onClose: () => void;
};

const SCORE_OPTIONS: ScoreType[] = ["sideout", "rally"];

const SCORE_TYPE_SHORT: Record<ScoreType, string> = {
  sideout: "僅發球方得分",
  rally: "每球皆計分",
};

export function KhpaManualMatchDialog({
  players,
  playerStats,
  onSubmit,
  onClose,
}: Props) {
  const [team1p1, setTeam1p1] = useState("");
  const [team1p2, setTeam1p2] = useState("");
  const [team2p1, setTeam2p1] = useState("");
  const [team2p2, setTeam2p2] = useState("");
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [scoreType, setScoreType] = useState<ScoreType>("sideout");
  const [loading, setLoading] = useState(false);
  const { error: toastError, success } = useAppUi();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const selectedIds = useMemo(
    () => [team1p1, team1p2, team2p1, team2p2].filter(Boolean),
    [team1p1, team1p2, team2p1, team2p2],
  );

  const handleSubmit = async () => {
    const ids = [team1p1, team1p2, team2p1, team2p2];
    if (ids.some((id) => !id)) {
      toastError("請選滿 4 位不同球員（雙打）");
      return;
    }
    if (new Set(ids).size !== 4) {
      toastError("同一位球員不能重複出場");
      return;
    }
    const s1 = Number(team1Score);
    const s2 = Number(team2Score);
    if (Number.isNaN(s1) || Number.isNaN(s2) || s1 < 0 || s2 < 0) {
      toastError("請輸入有效比分");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        team1: [team1p1, team1p2],
        team2: [team2p1, team2p2],
        team1Score: s1,
        team2Score: s2,
        scoreType,
      });
      success("已新增對戰成績");
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
          <CardTitle className="mb-1 text-base sm:text-lg">新增雙打成績</CardTitle>
          <p className="text-xs text-muted sm:text-sm">
            點選欄位搜尋球員 · 四位不可重複 · 送出後即鎖定
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-4">
          <div className="grid gap-3 sm:gap-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
                隊伍 1
              </p>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <KhpaPlayerPicker
                  label="球員 A"
                  value={team1p1}
                  players={players}
                  playerStats={playerStats}
                  excludeIds={selectedIds.filter((id) => id !== team1p1)}
                  onChange={setTeam1p1}
                />
                <KhpaPlayerPicker
                  label="球員 B"
                  value={team1p2}
                  players={players}
                  playerStats={playerStats}
                  excludeIds={selectedIds.filter((id) => id !== team1p2)}
                  onChange={setTeam1p2}
                />
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-800">
                隊伍 2
              </p>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <KhpaPlayerPicker
                  label="球員 A"
                  value={team2p1}
                  players={players}
                  playerStats={playerStats}
                  excludeIds={selectedIds.filter((id) => id !== team2p1)}
                  onChange={setTeam2p1}
                />
                <KhpaPlayerPicker
                  label="球員 B"
                  value={team2p2}
                  players={players}
                  playerStats={playerStats}
                  excludeIds={selectedIds.filter((id) => id !== team2p2)}
                  onChange={setTeam2p2}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-muted/40 p-3 sm:p-4">
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                比分
              </p>
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div className="text-center">
                  <p className="mb-1.5 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                    隊伍 1
                  </p>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="h-12 text-center text-xl font-bold sm:h-14 sm:text-2xl"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(e.target.value)}
                    placeholder="0"
                    aria-label="隊伍 1 比分"
                  />
                </div>
                <span className="pb-2 text-xl font-bold text-muted sm:pb-3 sm:text-2xl">:</span>
                <div className="text-center">
                  <p className="mb-1.5 rounded-lg bg-amber-500/15 px-2 py-1 text-xs font-bold text-amber-900">
                    隊伍 2
                  </p>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="h-12 text-center text-xl font-bold sm:h-14 sm:text-2xl"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(e.target.value)}
                    placeholder="0"
                    aria-label="隊伍 2 比分"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">賽制計分</p>
              <div className="flex flex-col gap-2">
                {SCORE_OPTIONS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setScoreType(type)}
                    className={cn(
                      "btn-touch flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                      scoreType === type
                        ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                        : "border-border bg-surface hover:bg-surface-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                        scoreType === type
                          ? "border-primary bg-primary text-white"
                          : "border-muted text-transparent",
                      )}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {SCORE_TYPE_LABEL[type]}
                      </span>
                      <span className="block text-xs text-muted">
                        {SCORE_TYPE_SHORT[type]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-divider bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} className="btn-touch h-11 flex-1 sm:h-12">
              取消
            </Button>
            <Button
              loading={loading}
              onClick={() => void handleSubmit()}
              className="btn-touch h-11 flex-1 sm:h-12"
              disabled={players.length < 4}
            >
              送出成績
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
