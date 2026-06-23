import { KhpaMedal } from "@/components/khpa/khpa-medal";
import { getKhpaBadgeForWins, type KhpaBadgeTier } from "@/lib/khpa/badges";
import { cn } from "@/lib/utils";

type Props = {
  wins: number;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeMap = {
  sm: { box: "h-12 w-12", px: 46 },
  md: { box: "h-14 w-14 sm:h-16 sm:w-16", px: 56 },
  lg: { box: "h-16 w-16 sm:h-20 sm:w-20", px: 72 },
  xl: { box: "h-20 w-20 sm:h-24 sm:w-24", px: 88 },
};

export function KhpaBadgeAvatar({
  wins,
  name,
  size = "md",
  className,
}: Props) {
  const badge = getKhpaBadgeForWins(wins);
  const s = sizeMap[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white/40 ring-2 ring-white/80",
        s.box,
        className,
      )}
      title={
        wins < 1
          ? `${badge.name} · 尚未有勝場`
          : `${badge.name} · ${wins} 勝`
      }
      aria-label={
        name
          ? wins < 1
            ? `${name}，${badge.name}`
            : `${name}，${badge.name}，${wins} 勝`
          : badge.name
      }
    >
      <KhpaMedal badge={badge} size={s.px} />
    </div>
  );
}

export function KhpaBadgePill({ wins }: { wins: number }) {
  const badge = getKhpaBadgeForWins(wins);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        badge.pillBg,
        badge.pillText,
      )}
    >
      <KhpaMedal badge={badge} size={22} compact className="!drop-shadow-none" />
      {badge.name}
    </span>
  );
}

export function KhpaBadgeLabel({ badge }: { badge: KhpaBadgeTier }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", badge.pillText)}>
      <KhpaMedal badge={badge} size={22} compact className="!drop-shadow-none" />
      {badge.name}
    </span>
  );
}
