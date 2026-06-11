"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
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

  return (
    <Card className={cn("h-full", cardClassName)}>
      <CardTitle className="mb-1">產生對戰</CardTitle>
      <p className="mb-4 flex items-center gap-1.5 text-xs text-emerald-700">
        <Sparkles className="h-3.5 w-3.5" />
        智慧排程 · 優先配對較少同隊的組合
      </p>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-slate-500">
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
          disabled={loading || selectedCount < 4}
          onClick={() => onGenerate(courtCount)}
          className="shadow-md shadow-emerald-900/15"
        >
          自動排場
        </Button>
        <Button variant="secondary" onClick={onManualAdd}>
          手動新增
        </Button>
        <Button
          variant="danger"
          disabled={loading}
          onClick={() => {
            if (confirm("確定要清空當日所有對戰嗎？")) {
              void onClearDay();
            }
          }}
        >
          清空當日
        </Button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        系統會參考歷史搭檔紀錄，盡量讓每位球員與不同隊友搭配。新場次會接在既有場次之後繼續編號。
      </p>
    </Card>
  );
}
