"use client";

import { useState } from "react";
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
};

export function MatchGenerator({
  defaultCourtCount,
  selectedCount,
  onGenerate,
  onManualAdd,
  onClearDay,
  loading,
}: Props) {
  const [courtCount, setCourtCount] = useState(defaultCourtCount);

  return (
    <Card className="h-full">
      <CardTitle className="mb-4">產生對戰</CardTitle>

      <div className="mb-4">
        <label className="mb-1 block text-xs text-gray-500">場數</label>
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

      <p className="mt-4 text-xs leading-relaxed text-gray-500">
        自動排場會依今日到場球員隨機配對，新場次會接在既有場次之後繼續編號。
      </p>
    </Card>
  );
}
