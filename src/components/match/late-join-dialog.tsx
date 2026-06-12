"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { playerDisplayName } from "@/lib/player-display";
import type { Player } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  players: Player[];
  sessionPlayerIds: string[];
  completedRounds: number;
  onSubmit: (playerId: string, courtCount: number) => Promise<void>;
  onClose: () => void;
};

export function LateJoinDialog({
  players,
  sessionPlayerIds,
  completedRounds,
  onSubmit,
  onClose,
}: Props) {
  const available = players.filter(
    (p) => p.active && !sessionPlayerIds.includes(p.id),
  );
  const [playerId, setPlayerId] = useState("");
  const [courtCount, setCourtCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const { error: toastError, success } = useAppUi();

  const handleSubmit = async () => {
    if (!playerId) {
      toastError("請選擇晚到球員");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(playerId, courtCount);
      success("晚到球員已加入並重排場次");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const selectClass = cn(
    "glass-input min-h-11 w-full rounded-[10px] px-3 text-base text-foreground outline-none",
    "focus:border-primary focus:ring-2 focus:ring-primary/20",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="glass-overlay absolute inset-0" aria-hidden />
      <Card className="glass-modal relative w-full max-w-md">
        <CardTitle className="mb-1 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          晚到加入
        </CardTitle>
        <p className="mb-4 text-xs leading-relaxed text-muted">
          已完成 <strong className="text-foreground">{completedRounds}</strong>{" "}
          場將維持不變；所有「未打」場次會清除，並用更新名單重排後續場次（盡量避免重複搭檔）。
        </p>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              選擇晚到球員
            </label>
            <select
              className={selectClass}
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
            >
              <option value="">請選擇</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {playerDisplayName(p)} ({p.dupr_id})
                </option>
              ))}
            </select>
            {available.length === 0 && (
              <p className="mt-1 text-xs text-warning">沒有可加入的球員（皆已在名單中）</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              重排後續場數
            </label>
            <Input
              type="number"
              min={0}
              max={20}
              value={courtCount}
              onChange={(e) => setCourtCount(Number(e.target.value))}
              className="min-h-11 text-base"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            variant="secondary"
            className="min-h-11 flex-1"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            className="min-h-11 flex-1"
            onClick={() => void handleSubmit()}
            loading={loading}
            disabled={!playerId}
          >
            確認加入並排場
          </Button>
        </div>
      </Card>
    </div>
  );
}
