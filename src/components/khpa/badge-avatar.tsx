import {
  CultivationBadge,
  CultivationLabel,
  CultivationPill,
} from "@/components/cultivation/cultivation-badge";
import type { CultivationTier } from "@/lib/cultivation-tiers";

type Props = {
  wins: number;
  winRate?: number;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function KhpaBadgeAvatar({
  wins,
  winRate,
  name,
  size = "md",
  className,
}: Props) {
  return (
    <CultivationBadge
      wins={wins}
      winRate={winRate}
      name={name}
      size={size}
      className={className}
    />
  );
}

export function KhpaBadgePill({
  wins,
  winRate,
}: {
  wins: number;
  winRate?: number;
}) {
  return <CultivationPill wins={wins} winRate={winRate} />;
}

export function KhpaBadgeLabel({ badge }: { badge: CultivationTier }) {
  return <CultivationLabel tier={badge} />;
}
