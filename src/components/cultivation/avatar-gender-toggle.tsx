"use client";

import type { PlayerAvatarGender } from "@/lib/cultivation-tiers";
import { cn } from "@/lib/utils";

type Props = {
  value: PlayerAvatarGender | null;
  onChange: (gender: PlayerAvatarGender | null) => void;
  disabled?: boolean;
  className?: string;
};

const OPTIONS = [
  { id: null, label: "預設" },
  { id: "male" as const, label: "男生" },
  { id: "female" as const, label: "女生" },
] as const;

export function AvatarGenderToggle({
  value,
  onChange,
  disabled,
  className,
}: Props) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs font-medium text-muted">境界頭像</p>
      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={cn(
              "min-h-10 flex-1 rounded-lg border px-3 text-sm font-medium transition-colors",
              value === option.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-muted hover:border-primary/30 hover:text-foreground",
              disabled && "cursor-not-allowed opacity-50",
            )}
            aria-pressed={value === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">
        預設與凡人境界使用同一張頭像；選男生或女生後依等級顯示對應圖
      </p>
    </div>
  );
}
