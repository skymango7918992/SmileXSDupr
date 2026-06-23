"use client";

import { useMemo, useState } from "react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { KhpaPlayerPicker } from "@/components/khpa/khpa-player-picker";
import { SCORE_TYPE_HINT, SCORE_TYPE_LABEL } from "@/lib/dupr-score-type";
import type { KhpaPlayer } from "@/types/khpa";
import type { ScoreType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  players: KhpaPlayer[];
  playerWins?: Record<string, number>;
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

export function KhpaManualMatchDialog({
  players,
  playerWins,
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="glass-overlay absolute inset-0" aria-hidden onClick={onClose} />
      <Card className="glass-modal relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-b-none sm:rounded-b-2xl">
        <CardTitle className="mb-1">新增雙打成績</CardTitle>
        <p className="mb-4 text-sm text-muted">
          點選欄位搜尋球員 · 四位不可重複 · 送出後即鎖定
        </p>

        <div className="grid gap-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
              隊伍 1
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <KhpaPlayerPicker
                label="球員 A"
                value={team1p1}
                players={players}
                playerWins={playerWins}
                excludeIds={selectedIds.filter((id) => id !== team1p1)}
                onChange={setTeam1p1}
              />
              <KhpaPlayerPicker
                label="球員 B"
                value={team1p2}
                players={players}
                playerWins={playerWins}
                excludeIds={selectedIds.filter((id) => id !== team1p2)}
                onChange={setTeam1p2}
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-800">
              隊伍 2
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <KhpaPlayerPicker
                label="球員 A"
                value={team2p1}
                players={players}
                playerWins={playerWins}
                excludeIds={selectedIds.filter((id) => id !== team2p1)}
                onChange={setTeam2p1}
              />
              <KhpaPlayerPicker
                label="球員 B"
                value={team2p2}
                players={players}
                playerWins={playerWins}
                excludeIds={selectedIds.filter((id) => id !== team2p2)}
                onChange={setTeam2p2}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">
              比分
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-3">
              <div className="text-center">
                <p className="mb-2 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary sm:text-sm">
                  隊伍 1
                </p>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="h-14 text-center text-2xl font-bold"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  placeholder="0"
                  aria-label="隊伍 1 比分"
                />
              </div>
              <span className="pb-3 text-2xl font-bold text-muted sm:text-3xl">:</span>
              <div className="text-center">
                <p className="mb-2 rounded-lg bg-amber-500/15 px-2 py-1 text-xs font-bold text-amber-900 sm:text-sm">
                  隊伍 2
                </p>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="h-14 text-center text-2xl font-bold"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  placeholder="0"
                  aria-label="隊伍 2 比分"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">賽制計分：</p>
            <div className="grid grid-cols-2 gap-2">
              {SCORE_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setScoreType(type)}
                  className={cn(
                    "btn-touch rounded-xl border px-3 py-3 text-left transition-colors",
                    scoreType === type
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border bg-surface hover:bg-surface-muted",
                  )}
                >
                  <p className="text-sm font-semibold">{SCORE_TYPE_LABEL[type]}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{SCORE_TYPE_HINT[type]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="btn-touch h-12 flex-1">
            取消
          </Button>
          <Button
            loading={loading}
            onClick={() => void handleSubmit()}
            className="btn-touch h-12 flex-1"
            disabled={players.length < 4}
          >
            送出成績
          </Button>
        </div>
      </Card>
    </div>
  );
}
