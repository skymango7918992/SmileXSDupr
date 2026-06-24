import type {
  CultivationTier,
  PlayerAvatarGender,
} from "@/lib/cultivation-tiers";
import { getCultivationImageSrc } from "@/lib/cultivation-tiers";
import { cn } from "@/lib/utils";

type Props = {
  tier: CultivationTier;
  gender?: PlayerAvatarGender | null;
  size?: number;
  className?: string;
};

/** 與 CultivationAvatar 共用同一張境界圖 */
export function CultivationMedal({
  tier,
  gender = null,
  size = 48,
  className,
}: Props) {
  const src = getCultivationImageSrc(tier.level, gender);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-black shadow-md ring-1 ring-black/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${tier.name}勳章`}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
