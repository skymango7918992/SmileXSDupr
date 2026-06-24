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
  compact?: boolean;
  className?: string;
};

/** 靜態 public 圖：用原生 img，避免 Cloudflare 上 next/image 優化失敗 */
export function CultivationAvatar({
  tier,
  gender = null,
  size = 48,
  className,
}: Props) {
  const src = getCultivationImageSrc(tier.level, gender);

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-black/5 shadow-md",
        className,
      )}
      style={{ width: size, height: size }}
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
