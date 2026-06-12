import { cn } from "@/lib/utils";

type AvatarVariant = "default" | "chibi";
type AvatarSize = "sm" | "md" | "lg" | "xl";

type Props = {
  name: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  className?: string;
};

const SKIN = ["#ffe8d1", "#ffd9b8", "#f5c99a", "#e8b88a"];
const HAIR = ["#1e3a5f", "#4a3728", "#5b21b6", "#c2410c", "#0f766e", "#0284c7"];
const CHEEK = "#fda4af";
const HEADBAND = ["#0284c7", "#f97316", "#10b981", "#8b5cf6"];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 52,
  xl: 68,
};

function PickleballBall({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <circle cx="6" cy="6" r="5.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.6" />
      <circle cx="4" cy="5" r="0.75" fill="#854d0e" opacity="0.5" />
      <circle cx="7.5" cy="4" r="0.75" fill="#854d0e" opacity="0.5" />
      <circle cx="6" cy="8" r="0.75" fill="#854d0e" opacity="0.5" />
      <circle cx="8" cy="7" r="0.55" fill="#854d0e" opacity="0.4" />
    </g>
  );
}

/** 迷你直立球拍：寬扁拍面在上、握把在下 */
function PickleballPaddle({
  x,
  y,
  rotate = 0,
  scale = 0.72,
}: {
  x: number;
  y: number;
  rotate?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
      <rect x="0" y="0" width="11" height="13" rx="2.2" fill="#0284c7" />
      <line
        x1="2.5"
        y1="3"
        x2="8.5"
        y2="10"
        stroke="#bae6fd"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.75"
      />
      <rect x="3.5" y="12.5" width="4" height="7" rx="1.2" fill="#64748b" />
      <rect x="4" y="13" width="3" height="5.5" rx="1" fill="#94a3b8" />
    </g>
  );
}

/** 配件放在臉部外側（下巴以下／臉頰旁），不遮臉 */
function PickleAccent({ h, chibi }: { h: number; chibi: boolean }) {
  const mode = h % 3;

  if (chibi) {
    if (mode === 0) {
      return <PickleballBall x={24} y={30} scale={0.78} />;
    }
    if (mode === 1) {
      return <PickleballPaddle x={27} y={31} rotate={20} scale={0.62} />;
    }
    return (
      <>
        <PickleballBall x={0} y={31} scale={0.7} />
        <PickleballPaddle x={26} y={31} rotate={16} scale={0.6} />
      </>
    );
  }

  if (mode === 0) {
    return <PickleballBall x={23} y={29} scale={0.74} />;
  }
  if (mode === 1) {
    return <PickleballPaddle x={26} y={30} rotate={18} scale={0.6} />;
  }
  return (
    <>
      <PickleballBall x={1} y={30} scale={0.66} />
      <PickleballPaddle x={25} y={30} rotate={14} scale={0.58} />
    </>
  );
}

function DefaultFace({
  skin,
  hair,
  eyeOffset,
  headband,
}: {
  skin: string;
  hair: string;
  eyeOffset: number;
  headband: string;
}) {
  return (
    <>
      <ellipse cx="18" cy="20" rx="11" ry="10" fill={skin} />
      <path d="M8 14 Q18 6 28 14 Q26 8 18 7 Q10 8 8 14" fill={hair} />
      <path d="M7 13 Q18 10 29 13" stroke={headband} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="11.5" cy="22" rx="1.6" ry="1" fill={CHEEK} opacity="0.35" />
      <ellipse cx="24.5" cy="22" rx="1.6" ry="1" fill={CHEEK} opacity="0.35" />
      <circle cx="14" cy="19" r="1.6" fill="#1e293b" />
      <circle cx="22" cy={19 + eyeOffset} r="1.6" fill="#1e293b" />
      <circle cx="14.6" cy="18.2" r="0.5" fill="white" />
      <circle cx="22.6" cy={18.2 + eyeOffset} r="0.5" fill="white" />
      <path
        d="M13 24 Q18 27.5 23 24"
        fill="none"
        stroke="#e11d48"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  );
}

function ChibiFace({
  skin,
  hair,
  h,
  headband,
}: {
  skin: string;
  hair: string;
  h: number;
  headband: string;
}) {
  const wink = h % 5 === 0;
  return (
    <>
      <ellipse cx="18" cy="21" rx="12.5" ry="11.5" fill={skin} />
      <path d="M6 15 Q18 4 30 15 Q28 7 18 5.5 Q8 7 6 15" fill={hair} />
      <path
        d="M5 14.5 Q18 11 31 14.5"
        stroke={headband}
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="11" cy="23" rx="2.4" ry="1.5" fill={CHEEK} opacity="0.5" />
      <ellipse cx="25" cy="23" rx="2.4" ry="1.5" fill={CHEEK} opacity="0.5" />
      <ellipse cx="13.5" cy="20" rx="2.5" ry="3" fill="#1e293b" />
      {wink ? (
        <path
          d="M20.5 20 Q23 18.5 25.5 20"
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <ellipse cx="22.5" cy="20" rx="2.5" ry="3" fill="#1e293b" />
      )}
      <circle cx="14.2" cy="18.6" r="1" fill="white" />
      {!wink && <circle cx="23.2" cy="18.6" r="1" fill="white" />}
      <path
        d="M12 26.5 Q18 31 24 26.5"
        fill="none"
        stroke="#e11d48"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* 小星星裝飾 */}
      {h % 4 === 0 && (
        <text x="5" y="11" fontSize="6" fill="#facc15">
          ✦
        </text>
      )}
    </>
  );
}

export function CuteAvatar({
  name,
  size = "md",
  variant = "default",
  className,
}: Props) {
  const h = hashName(name || "?");
  const skin = SKIN[h % SKIN.length];
  const hair = HAIR[h % HAIR.length];
  const headband = HEADBAND[h % HEADBAND.length];
  const chibi = variant === "chibi";
  const px = SIZE_PX[size];
  const eyeOffset = h % 3 === 0 ? 0.3 : 0;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-visible",
        chibi && "drop-shadow-md",
        className,
      )}
      aria-hidden
      title={name}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 36 36"
        className="overflow-visible"
      >
        <circle
          cx="18"
          cy="18"
          r="17"
          fill={chibi ? "#dbeafe" : "#e0f2fe"}
          stroke={chibi ? "#93c5fd" : "#bae6fd"}
          strokeWidth={chibi ? 1.4 : 1}
        />
        {chibi ? (
          <ChibiFace skin={skin} hair={hair} h={h} headband={headband} />
        ) : (
          <DefaultFace
            skin={skin}
            hair={hair}
            eyeOffset={eyeOffset}
            headband={headband}
          />
        )}
        <PickleAccent h={h} chibi={chibi} />
      </svg>
    </span>
  );
}
