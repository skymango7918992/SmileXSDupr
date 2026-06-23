import type { KhpaBadgeTier } from "@/lib/khpa/badges";
import { cn } from "@/lib/utils";

type Props = {
  badge: KhpaBadgeTier;
  size?: number;
  compact?: boolean;
  className?: string;
};

/** 統一勳章外框：圓形獎章 + 緞帶（尺寸隨 size 縮放） */
export function KhpaMedal({ badge, size = 56, compact, className }: Props) {
  const id = `medal-${badge.level}`;
  const { rim, face, faceLight, ribbon } = badge.medal;
  const iconSize = compact
    ? Math.max(14, Math.round(size * 0.55))
    : Math.max(22, Math.round(size * 0.36));

  if (compact) {
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={cn("drop-shadow-md", className)}
        aria-hidden
      >
        <defs>
          <linearGradient id={`${id}-face-c`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={faceLight} />
            <stop offset="50%" stopColor={face} />
            <stop offset="100%" stopColor={rim} />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill={rim} />
        <circle cx="32" cy="32" r="26" fill={`url(#${id}-face-c)`} />
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <text x="32" y="38" textAnchor="middle" fontSize={iconSize}>
          {badge.emoji}
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 80"
      width={size}
      height={size * 1.28}
      className={cn("drop-shadow-lg", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={faceLight} />
          <stop offset="45%" stopColor={face} />
          <stop offset="100%" stopColor={rim} />
        </linearGradient>
        <linearGradient id={`${id}-ribbon`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={ribbon} />
          <stop offset="100%" stopColor={rim} />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={rim} floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        <path d="M18 50 L10 78 L28 54 Z" fill={`url(#${id}-ribbon)`} />
        <path d="M46 50 L54 78 L36 54 Z" fill={`url(#${id}-ribbon)`} />
        <rect x="20" y="47" width="24" height="10" rx="1.5" fill={`url(#${id}-ribbon)`} />

        <circle cx="32" cy="30" r="28" fill={rim} />
        <circle cx="32" cy="30" r="24.5" fill={`url(#${id}-face)`} />
        <circle
          cx="32"
          cy="30"
          r="24.5"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2"
        />
        <circle
          cx="32"
          cy="30"
          r="20"
          fill="none"
          stroke={rim}
          strokeWidth="1.2"
          strokeDasharray="3 3"
          opacity="0.45"
        />
      </g>

      {badge.level > 0 && (
        <text
          x="32"
          y="13"
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill={rim}
        >
          Lv.{badge.level}
        </text>
      )}

      <text x="32" y="37" textAnchor="middle" fontSize={iconSize}>
        {badge.emoji}
      </text>
    </svg>
  );
}
