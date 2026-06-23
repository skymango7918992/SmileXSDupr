"use client";

import { SCORE_TYPE_LABEL } from "@/lib/dupr-score-type";
import type { ScoreType } from "@/types/database";
import { cn } from "@/lib/utils";

type Props = {
  value: ScoreType;
  disabled?: boolean;
  onChange: (scoreType: ScoreType) => void;
};

const OPTIONS: ScoreType[] = ["rally", "sideout"];

export function SessionScorePicker({ value, disabled, onChange }: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted/30 p-3">
      <p className="mb-2 text-xs font-medium text-muted">此賽程計分制度（匯出 DUPR 用）</p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((type) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(type)}
            className={cn(
              "btn-touch rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
              value === type
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border bg-surface text-secondary-foreground hover:bg-surface-muted",
            )}
          >
            {SCORE_TYPE_LABEL[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
