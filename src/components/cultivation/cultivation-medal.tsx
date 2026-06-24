import type { CultivationTier } from "@/lib/cultivation-tiers";
import { getCultivationImageSrc } from "@/lib/cultivation-tiers";
import { cn } from "@/lib/utils";

type Props = {
  tier: CultivationTier;
  size?: number;
  className?: string;
};

function MortalMedal({ size }: { size: number }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-500"
      style={{ width: size, height: size }}
    >
      <span className="text-[10px] font-semibold">凡人</span>
    </div>
  );
}

/** 與 CultivationAvatar 共用同一張境界圖 */
export function CultivationMedal({ tier, size = 48, className }: Props) {
  const src = getCultivationImageSrc(tier.level);

  if (!src) {
    return (
      <div className={cn("shrink-0", className)} style={{ width: size, height: size }}>
        <MortalMedal size={size} />
      </div>
    );
  }

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
