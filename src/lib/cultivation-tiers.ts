/** 星鑽 XS / 協會共用修行境界（勝場 + 勝率） */
export type PlayerCultivationStats = {
  wins: number;
  winRate: number;
};

export type CultivationTier = {
  level: number;
  name: string;
  subtitle: string;
  minWins: number;
  /** 0 表示不限勝率 */
  minWinRate: number;
  tagline: string;
  bg: string;
  ring: string;
  accent: string;
  glow: string;
  pillBg: string;
  pillText: string;
};

export const CULTIVATION_DEFAULT: CultivationTier = {
  level: 0,
  name: "凡人",
  subtitle: "尚未入道",
  minWins: 0,
  minWinRate: 0,
  tagline: "球道漫漫，修行尚未開始。",
  bg: "bg-slate-100",
  ring: "ring-slate-200",
  accent: "#94a3b8",
  glow: "#cbd5e1",
  pillBg: "bg-slate-100",
  pillText: "text-slate-600",
};

export const CULTIVATION_TIERS: CultivationTier[] = [
  {
    level: 1,
    name: "練氣期",
    subtitle: "新手修行",
    minWins: 1,
    minWinRate: 0,
    tagline: "初入球道，球還沒聽話，但你的腳已經開始亂跑。",
    bg: "bg-emerald-100",
    ring: "ring-emerald-300/50",
    accent: "#34d399",
    glow: "#6ee7b7",
    pillBg: "bg-emerald-100",
    pillText: "text-emerald-800",
  },
  {
    level: 2,
    name: "築基期",
    subtitle: "基礎成形",
    minWins: 10,
    minWinRate: 40,
    tagline: "你終於知道廚房不能亂衝，恭喜少跌一半坑。",
    bg: "bg-amber-100",
    ring: "ring-amber-300/50",
    accent: "#d97706",
    glow: "#fbbf24",
    pillBg: "bg-amber-100",
    pillText: "text-amber-900",
  },
  {
    level: 3,
    name: "金丹期",
    subtitle: "穩定成長",
    minWins: 30,
    minWinRate: 45,
    tagline: "你開始會 Dink 了，對手也開始懷疑人生了。",
    bg: "bg-yellow-100",
    ring: "ring-yellow-400/50",
    accent: "#eab308",
    glow: "#fde047",
    pillBg: "bg-yellow-100",
    pillText: "text-yellow-900",
  },
  {
    level: 4,
    name: "元嬰期",
    subtitle: "真正高手",
    minWins: 60,
    minWinRate: 45,
    tagline: "你不只是會打球，你已經會讓隊友少罵你了。",
    bg: "bg-cyan-100",
    ring: "ring-cyan-300/50",
    accent: "#06b6d4",
    glow: "#67e8f9",
    pillBg: "bg-cyan-100",
    pillText: "text-cyan-900",
  },
  {
    level: 5,
    name: "化神期",
    subtitle: "高端強者",
    minWins: 120,
    minWinRate: 45,
    tagline: "你一站上廚房線，對面就開始想換隊友。",
    bg: "bg-violet-100",
    ring: "ring-violet-300/50",
    accent: "#8b5cf6",
    glow: "#c4b5fd",
    pillBg: "bg-violet-100",
    pillText: "text-violet-900",
  },
  {
    level: 6,
    name: "煉虛期",
    subtitle: "頂尖玩家",
    minWins: 200,
    minWinRate: 45,
    tagline: "你的球看起來很慢，但對手就是接不到。",
    bg: "bg-indigo-100",
    ring: "ring-indigo-300/50",
    accent: "#6366f1",
    glow: "#a5b4fc",
    pillBg: "bg-indigo-100",
    pillText: "text-indigo-900",
  },
  {
    level: 7,
    name: "合體期",
    subtitle: "協會名將",
    minWins: 300,
    minWinRate: 45,
    tagline: "技術、跑位、隊友默契終於合體，不再各打各的。",
    bg: "bg-teal-100",
    ring: "ring-teal-300/50",
    accent: "#14b8a6",
    glow: "#5eead4",
    pillBg: "bg-teal-100",
    pillText: "text-teal-900",
  },
  {
    level: 8,
    name: "大乘期",
    subtitle: "傳奇級",
    minWins: 420,
    minWinRate: 45,
    tagline: "你現在連失誤都很有宗師感，大家只敢說是戰術。",
    bg: "bg-orange-100",
    ring: "ring-orange-300/50",
    accent: "#f97316",
    glow: "#fdba74",
    pillBg: "bg-orange-100",
    pillText: "text-orange-900",
  },
  {
    level: 9,
    name: "渡劫期",
    subtitle: "巔峰霸主",
    minWins: 600,
    minWinRate: 45,
    tagline: "你每打一場都像渡劫，贏了是修仙，輸了是修心。",
    bg: "bg-purple-100",
    ring: "ring-purple-300/50",
    accent: "#a855f7",
    glow: "#d8b4fe",
    pillBg: "bg-purple-100",
    pillText: "text-purple-900",
  },
  {
    level: 10,
    name: "大帝期",
    subtitle: "至高無上",
    minWins: 1000,
    minWinRate: 45,
    tagline: "你不是來比賽的，你是來讓大家截圖膜拜的。",
    bg: "bg-gradient-to-br from-amber-200 to-red-200",
    ring: "ring-amber-400/60",
    accent: "#dc2626",
    glow: "#fbbf24",
    pillBg: "bg-gradient-to-r from-amber-200 to-red-200",
    pillText: "text-red-950",
  },
];

export function formatWinRateRequirement(tier: CultivationTier): string {
  if (tier.minWinRate <= 0) return "勝率不限";
  return `勝率 ${tier.minWinRate}% 以上`;
}

export function formatWinsRequirement(tier: CultivationTier): string {
  return `${tier.minWins} 勝以上`;
}

/** 修行頭像靜態圖（public/cultivation/level-N.png） */
export function getCultivationAvatarSrc(level: number): string | null {
  if (level >= 1 && level <= 10) {
    return `/cultivation/level-${level}.png`;
  }
  return null;
}

/** 修行勳章靜態圖（public/cultivation/medal-N.png） */
export function getCultivationMedalSrc(level: number): string | null {
  if (level >= 1 && level <= 10) {
    return `/cultivation/medal-${level}.png`;
  }
  return null;
}

/** 依勝場與勝率（%）判定境界；未提供勝率時僅套用「勝率不限」的門檻 */
export function getCultivationTier(
  wins: number,
  winRate?: number,
): CultivationTier {
  let current: CultivationTier = CULTIVATION_DEFAULT;
  for (const tier of CULTIVATION_TIERS) {
    const rateOk =
      tier.minWinRate === 0 ||
      (winRate !== undefined && winRate >= tier.minWinRate);
    if (wins >= tier.minWins && rateOk) {
      current = tier;
    }
  }
  return current;
}

export function getNextCultivationTier(
  wins: number,
  winRate = 0,
): CultivationTier | null {
  return (
    CULTIVATION_TIERS.find((tier) => {
      if (wins < tier.minWins) return true;
      if (tier.minWinRate > 0 && winRate < tier.minWinRate) return true;
      return false;
    }) ?? null
  );
}
