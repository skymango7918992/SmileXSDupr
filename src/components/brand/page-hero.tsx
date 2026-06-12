import { PickleballIcon, PickleballPaddleIcon } from "@/components/brand/sport-icons";
import { CuteAvatar } from "@/components/brand/cute-avatar";
import { cn } from "@/lib/utils";

type Variant = "checkin" | "players" | "match" | "leaderboard";

const COPY: Record<
  Variant,
  { title: string; subtitle: string; sampleName: string }
> = {
  checkin: {
    title: "報到收款",
    subtitle: "貼名單、現場加人、一鍵標記收款",
    sampleName: "收款小幫手",
  },
  players: {
    title: "球員管理",
    subtitle: "Club 同步 · 手動維護名單",
    sampleName: "球員管家",
  },
  match: {
    title: "對戰中心",
    subtitle: "排場、計分、DUPR 匯出",
    sampleName: "賽事控台",
  },
  leaderboard: {
    title: "獲勝榜",
    subtitle: "勝場越多勳章越高 · 衝刺 TOP 3",
    sampleName: "冠軍候選",
  },
};

type Props = {
  variant: Variant;
  className?: string;
};

export function PageHero({ variant, className }: Props) {
  const { title, subtitle, sampleName } = COPY[variant];

  return (
    <div
      className={cn(
        "page-hero-cute relative mb-5 overflow-hidden rounded-2xl border-2 border-primary-soft/70 px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
    >
      <div className="sport-hero-spark sport-hero-spark--left" aria-hidden>
        <PickleballIcon className="h-9 w-9 text-primary/40" />
      </div>
      <div className="sport-hero-spark sport-hero-spark--right" aria-hidden>
        <PickleballPaddleIcon className="h-12 w-8 text-primary/50" />
      </div>
      <span className="page-hero-dot page-hero-dot--a" aria-hidden />
      <span className="page-hero-dot page-hero-dot--b" aria-hidden />
      <span className="page-hero-dot page-hero-dot--c" aria-hidden />

      <div className="relative z-[1] flex items-center gap-3 sm:gap-4">
        <div className="relative">
          <CuteAvatar name={sampleName} size="lg" variant="chibi" />
          <span className="absolute -right-1 -top-1 text-sm">🏓</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-primary sm:text-xl">{title}</h1>
          <p className="text-sm text-secondary-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
