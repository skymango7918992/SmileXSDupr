import type {
  CultivationTier,
  PlayerAvatarGender,
} from "@/lib/cultivation-tiers";
import {
  getJourneyRealmImageSrc,
  resolveCultivationPortraitGender,
} from "@/lib/cultivation-tiers";
import { cn } from "@/lib/utils";

type Props = {
  tier: CultivationTier;
  gender?: PlayerAvatarGender | null;
  size?: number;
  className?: string;
  /** card：修行軌跡大頭照；round：圓形頭像 */
  variant?: "card" | "round";
  /** 填滿外層容器（不設固定 px） */
  fill?: boolean;
};

/** 修行軌跡專用：依境界等級顯示對應 public/cultivation 圖 */
export function CultivationRealmPortrait({
  tier,
  gender = null,
  size = 48,
  className,
  variant = "card",
  fill = false,
}: Props) {
  const resolvedGender = resolveCultivationPortraitGender(gender);
  const src = getJourneyRealmImageSrc(tier.level, resolvedGender);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-black/5 shadow-md ring-2",
        variant === "card" ? "rounded-2xl" : "rounded-full",
        tier.ring,
        fill && "h-full w-full",
        className,
      )}
      style={fill ? undefined : { width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${tier.name}修行頭像`}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
