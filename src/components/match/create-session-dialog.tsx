"use client";

import { useState } from "react";
import {
  SCORE_TYPE_HINT,
  SCORE_TYPE_LABEL,
} from "@/lib/dupr-score-type";
import type { ScoreType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  defaultName?: string;
  onSubmit: (input: { name: string; scoreType: ScoreType }) => void;
  onClose: () => void;
  loading?: boolean;
};

const SCORE_OPTIONS: ScoreType[] = ["rally", "sideout"];

export function CreateSessionDialog({
  defaultName = "",
  onSubmit,
  onClose,
  loading,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [scoreType, setScoreType] = useState<ScoreType>("rally");

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div
        className="glass-card max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain p-5 shadow-modal [-webkit-overflow-scrolling:touch]"
        role="dialog"
        aria-labelledby="create-session-title"
      >
        <h2 id="create-session-title" className="text-lg font-semibold text-foreground">
          新增賽程組
        </h2>
        <p className="mt-1 text-sm text-muted">
          請選擇此賽程的計分制度，匯出 DUPR CSV 時會帶入正確的 scoreType
        </p>

        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">賽程名稱（選填）</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：賽程 2、下午場"
            />
          </label>

          <div>
            <span className="mb-2 block text-sm text-muted">計分制度</span>
            <div className="flex flex-col gap-2">
              {SCORE_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={cn(
                    "w-full min-w-0 rounded-[10px] border px-3 py-3 text-left transition-colors",
                    scoreType === type
                      ? "border-primary bg-primary-subtle text-primary"
                      : "border-border bg-surface text-secondary-foreground hover:bg-surface-muted",
                  )}
                  onClick={() => setScoreType(type)}
                >
                  <p className="text-sm font-semibold">{SCORE_TYPE_LABEL[type]}</p>
                  <p className="mt-0.5 text-xs opacity-80">{SCORE_TYPE_HINT[type]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                name: name.trim(),
                scoreType,
              })
            }
            loading={loading}
          >
            建立賽程
          </Button>
        </div>
      </div>
    </div>
  );
}
