"use client";

import { CultivationBadge } from "@/components/cultivation/cultivation-badge";

type Props = {
  wins: number;
  winRate?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

export function BadgeMedal({
  wins,
  winRate,
  size = "md",
  showLabel = false,
  className,
}: Props) {
  return (
    <CultivationBadge
      wins={wins}
      winRate={winRate}
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}
