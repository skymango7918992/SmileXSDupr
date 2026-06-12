"use client";

import { Smartphone } from "lucide-react";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  days: number;
  disabled?: boolean;
};

export function TrustDeviceCheckbox({
  checked,
  onChange,
  days,
  disabled,
}: Props) {
  return (
    <label
      className={
        disabled
          ? "flex cursor-not-allowed items-start gap-3 rounded-[10px] border border-border bg-surface-muted/30 p-3 opacity-60"
          : "flex cursor-pointer items-start gap-3 rounded-[10px] border border-border bg-surface-muted/30 p-3 transition-colors hover:bg-surface-muted/50"
      }
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0 text-left text-sm text-foreground">
        <span className="flex items-center gap-1.5 font-medium">
          <Smartphone className="h-3.5 w-3.5 shrink-0 text-primary" />
          信任此裝置 {days} 天
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">
          此期間開啟網站可略過 OTP（仍須帳密）。換手機或共用裝置請勿勾選。
        </span>
      </span>
    </label>
  );
}
