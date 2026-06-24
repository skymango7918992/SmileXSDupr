import { CultivationAvatar } from "@/components/cultivation/cultivation-avatar";
import { CultivationAvatar } from "@/components/cultivation/cultivation-avatar";
import {
  getCultivationTier,
  type CultivationTier,
} from "@/lib/cultivation-tiers";
import { cn } from "@/lib/utils";

type Props = {
  wins: number;
  winRate?: number;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { box: "h-11 w-11", px: 44, text: "text-[10px]" },
  md: { box: "h-14 w-14 sm:h-16 sm:w-16", px: 56, text: "text-xs" },
  lg: { box: "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]", px: 68, text: "text-sm" },
  xl: { box: "h-20 w-20 sm:h-24 sm:w-24", px: 88, text: "text-sm" },
};

export function CultivationBadge({
  wins,
  winRate,
  name,
  size = "md",
  showLabel = false,
  className,
}: Props) {
  const tier = getCultivationTier(wins, winRate);
  const s = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn("shrink-0", s.box)}
        title={`${tier.name} · ${tier.tagline}`}
        aria-label={
          name
            ? `${name}，${tier.name}，${wins} 勝，勝率 ${winRate ?? "—"}%`
            : `${tier.name}，${wins} 勝`
        }
      >
        <CultivationAvatar tier={tier} size={s.px} className="h-full w-full" />
      </div>
      {showLabel && (
        <span
          className={cn(
            "max-w-[5rem] text-center font-medium leading-tight text-muted",
            s.text,
          )}
        >
          {tier.name}
        </span>
      )}
    </div>
  );
}

export function CultivationPill({
  wins,
  winRate,
}: {
  wins: number;
  winRate?: number;
}) {
  const tier = getCultivationTier(wins, winRate);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tier.pillBg,
        tier.pillText,
      )}
    >
      <CultivationAvatar tier={tier} size={26} compact className="!shadow-none" />
      {tier.name}
    </span>
  );
}

export function CultivationLabel({ tier }: { tier: CultivationTier }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        tier.pillText,
      )}
    >
      <CultivationAvatar tier={tier} size={26} compact className="!shadow-none" />
      {tier.name}
    </span>
  );
}
