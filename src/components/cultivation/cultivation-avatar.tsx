import Image from "next/image";
import type { CultivationTier } from "@/lib/cultivation-tiers";
import { getCultivationAvatarSrc } from "@/lib/cultivation-tiers";
import { cn } from "@/lib/utils";

type Props = {
  tier: CultivationTier;
  size?: number;
  compact?: boolean;
  className?: string;
};

function MortalFallback({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className="h-full w-full"
      aria-hidden
    >
      <circle cx="32" cy="32" r="31" fill="#f1f5f9" />
      <circle cx="32" cy="28" r="10" fill="#e2e8f0" />
      <circle cx="29" cy="27" r="1.2" fill="#64748b" />
      <circle cx="35" cy="27" r="1.2" fill="#64748b" />
      <path
        d="M29 31 Q32 33 35 31"
        stroke="#94a3b8"
        strokeWidth="1"
        fill="none"
      />
      <text
        x="32"
        y="50"
        textAnchor="middle"
        fontSize="8"
        fontWeight="600"
        fill="#94a3b8"
      >
        凡人
      </text>
    </svg>
  );
}

export function CultivationAvatar({
  tier,
  size = 48,
  compact,
  className,
}: Props) {
  const src = getCultivationAvatarSrc(tier.level);

  if (!src) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <MortalFallback size={size} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-black/5 shadow-md",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={`${tier.name}修行頭像`}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        sizes={`${size}px`}
        priority={!compact && tier.level <= 3}
      />
    </div>
  );
}
