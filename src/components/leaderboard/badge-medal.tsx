"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  Crown,
  Flame,
  Gem,
  Medal,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { getBadgeForWins } from "@/lib/badges";
import { cn } from "@/lib/utils";

const BADGE_ICONS: Record<number, LucideIcon> = {
  1: Target,
  2: Zap,
  3: Flame,
  4: Medal,
  5: Star,
  6: Award,
  7: Gem,
  8: Trophy,
  9: Crown,
  10: Sparkles,
};

type Props = {
  wins: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { box: "h-8 w-8", icon: "h-3.5 w-3.5", text: "text-[10px]" },
  md: { box: "h-10 w-10", icon: "h-4 w-4", text: "text-xs" },
  lg: { box: "h-14 w-14", icon: "h-6 w-6", text: "text-sm" },
};

export function BadgeMedal({
  wins,
  size = "md",
  showLabel = false,
  className,
}: Props) {
  const badge = getBadgeForWins(wins);
  const s = sizeMap[size];

  if (!badge) {
    return (
      <div className={cn("flex flex-col items-center gap-1", className)}>
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-surface-muted ring-1 ring-border",
            s.box,
          )}
        >
          <span className={cn("font-medium text-muted", s.text)}>—</span>
        </div>
        {showLabel && (
          <span className="text-center text-[10px] text-muted">待啟程</span>
        )}
      </div>
    );
  }

  const Icon = BADGE_ICONS[badge.level];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full ring-1",
          badge.bg,
          badge.ring,
          s.box,
        )}
        title={`${badge.name} · ${badge.description}`}
      >
        <Icon className={cn(badge.iconColor, s.icon)} />
      </div>
      {showLabel && (
        <span className="max-w-[4.5rem] text-center text-[10px] font-medium leading-tight text-muted">
          {badge.name}
        </span>
      )}
    </div>
  );
}
