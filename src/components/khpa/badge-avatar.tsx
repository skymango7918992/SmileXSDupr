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
  sm: { box: "h-14 w-14", px: 52 },
  md: { box: "h-[4.5rem] w-[4.5rem]", px: 68 },
  lg: { box: "h-20 w-20", px: 80 },
  xl: { box: "h-24 w-24 sm:h-28 sm:w-28", px: 100 },
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
