"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  defaultCourtCount: number;
  selectedCount: number;
  onGenerate: (courtCount: number) => Promise<void>;
  onManualAdd: () => void;
  onClearDay: () => Promise<void>;
  loading?: boolean;
  cardClassName?: string;
};

export function MatchGenerator({
  defaultCourtCount,
  selectedCount,
  onGenerate,
  onManualAdd,
  onClearDay,
  loading,
  cardClassName,
}: Props) {
  const [courtCount, setCourtCount] = useState(defaultCourtCount);
  const { confirm } = useAppUi();

  return (
    <Card className={cn("h-full", cardClassName)}>
      <CardTitle className="mb-1">產生對戰</CardTitle>
      <p className="mb-4 flex items-center gap-1.5 text-xs text-muted">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        智慧排程 · 優先配對較少同隊的組合
      </p>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-muted">
          場數
        </label>
        <Input
          type="number"
          min={1}
          max={20}
          value={courtCount}
          onChange={(e) => setCourtCount(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="accent"
          loading={loading}
          disabled={selectedCount < 4}
          onClick={() => onGenerate(courtCount)}
          className="btn-touch max-md:flex-1"
        >
          自動排場
        </Button>
        <Button variant="secondary" onClick={onManualAdd} disabled={loading}>
          手動新增
        </Button>
        <Button
          variant="danger"
          disabled={loading}
          onClick={() => {
            void (async () => {
              const ok = await confirm({
                title: "清空未打場次？",
                description: "僅刪除「待進行」場次，已完成場次不受影響。",
                confirmLabel: "清空",
                variant: "danger",
              });
              if (ok) await onClearDay();
            })();
          }}
        >
          清空未打
        </Button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        系統會參考本組已完成場次與歷史紀錄，盡量避免重複搭檔。新場次接續編號。
      </p>
    </Card>
  );
}
