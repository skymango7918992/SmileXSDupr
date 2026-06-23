"use client";

import { useState } from "react";
import { Hand, Sparkles } from "lucide-react";
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
      <p className="mb-4 text-xs text-muted">
        建議先手動新增，需要時再用自動補排；不會重複本組已有 2v2。
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant="accent"
          disabled={loading || selectedCount < 4}
          onClick={onManualAdd}
          className="btn-touch max-md:flex-1"
        >
          <Hand className="mr-1.5 h-4 w-4" />
          手動新增
        </Button>
        <Button
          variant="secondary"
          loading={loading}
          disabled={selectedCount < 4}
          onClick={() => onGenerate(courtCount)}
          className="btn-touch max-md:flex-1"
        >
          <Sparkles className="mr-1.5 h-4 w-4" />
          自動補排
        </Button>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-muted">
          自動補排場數
        </label>
        <Input
          type="number"
          min={1}
          max={20}
          value={courtCount}
          onChange={(e) => setCourtCount(Number(e.target.value))}
        />
      </div>

      <Button
        variant="danger"
        size="sm"
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
    </Card>
  );
}
