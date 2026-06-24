"use client";

import { CultivationBadge } from "@/components/cultivation/cultivation-badge";

type Props = {
  wins: number;
  winRate?: number;
  gender?: import("@/lib/cultivation-tiers").PlayerAvatarGender | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
};

export function BadgeMedal({
  wins,
  winRate,
  gender,
  size = "md",
  showLabel = false,
  className,
}: Props) {
  return (
    <CultivationBadge
      wins={wins}
      winRate={winRate}
      gender={gender}
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}
