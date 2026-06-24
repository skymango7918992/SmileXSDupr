import {
  CultivationBadge,
  CultivationLabel,
  CultivationPill,
} from "@/components/cultivation/cultivation-badge";
import type { CultivationTier } from "@/lib/cultivation-tiers";

type Props = {
  wins: number;
  winRate?: number;
  gender?: import("@/lib/cultivation-tiers").PlayerAvatarGender | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function KhpaBadgeAvatar({
  wins,
  winRate,
  gender,
  name,
  size = "md",
  className,
}: Props) {
  return (
    <CultivationBadge
      wins={wins}
      winRate={winRate}
      gender={gender}
      name={name}
      size={size}
      className={className}
    />
  );
}

export function KhpaBadgePill({
  wins,
  winRate,
  gender,
}: {
  wins: number;
  winRate?: number;
  gender?: import("@/lib/cultivation-tiers").PlayerAvatarGender | null;
}) {
  return <CultivationPill wins={wins} winRate={winRate} gender={gender} />;
}

export function KhpaBadgeLabel({ badge }: { badge: CultivationTier }) {
  return <CultivationLabel tier={badge} />;
}
