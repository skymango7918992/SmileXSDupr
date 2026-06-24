/** 星鑽 XS / 協會共用修行境界（勝場 + 勝率） */
export type PlayerCultivationStats = {
  wins: number;
  winRate: number;
};

/** 境界頭像性別（對應 public/cultivation 與 female/ 子目錄） */
export type PlayerAvatarGender = "male" | "female";

/** 未設定性別或 Lv.0 凡人時使用的預設圖 */
export const CULTIVATION_MORTAL_IMAGE_SRC = "/cultivation/mortal_default.png";

export function normalizePlayerAvatarGender(
  value: string | null | undefined,
): PlayerAvatarGender | null {
  if (value === "male") return "male";
  if (value === "female") return "female";
  return null;
}

export function formatAvatarGenderLabel(
  gender: PlayerAvatarGender | null | undefined,
): string {
  if (gender === "male") return "男生";
  if (gender === "female") return "女生";
  return "預設";
}

export type CultivationTier = {
  level: number;
  name: string;
  subtitle: string;
  minWins: number;
  /** 0 表示不限勝率 */
  minWinRate: number;
  tagline: string;
  /** public/cultivation/ 下的境界圖（頭像與勳章共用） */
  imageFile: string;
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
  subtitle: "還在撿球",
  minWins: 0,
  minWinRate: 0,
  tagline: "球道漫漫，修行尚未開始。",
  imageFile: "",
  bg: "bg-slate-100",
  ring: "ring-teal-200/60",
  accent: "#5eead4",
  glow: "#ccfbf1",
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
    imageFile: "level_01_lianqi.png",
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
    imageFile: "level_02_zhuji.png",
    bg: "bg-sky-100",
    ring: "ring-sky-300/50",
    accent: "#0284c7",
    glow: "#7dd3fc",
    pillBg: "bg-sky-100",
    pillText: "text-sky-900",
  },
  {
    level: 3,
    name: "金丹期",
    subtitle: "穩定成長",
    minWins: 30,
    minWinRate: 45,
    tagline: "你開始會 Dink 了，對手也開始懷疑人生了。",
    imageFile: "level_03_jindan.png",
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
    imageFile: "level_04_yuanying.png",
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
    imageFile: "level_05_huashen.png",
    bg: "bg-emerald-100",
    ring: "ring-emerald-400/50",
    accent: "#10b981",
    glow: "#6ee7b7",
    pillBg: "bg-emerald-100",
    pillText: "text-emerald-900",
  },
  {
    level: 6,
    name: "煉虛期",
    subtitle: "頂尖玩家",
    minWins: 200,
    minWinRate: 45,
    tagline: "你的球看起來很慢，但對手就是接不到。",
    imageFile: "level_06_lianxu.png",
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
    subtitle: "球場名將",
    minWins: 300,
    minWinRate: 45,
    tagline: "技術、跑位、隊友默契終於合體，不再各打各的。",
    imageFile: "level_07_heti.png",
    bg: "bg-teal-100",
    ring: "ring-teal-300/50",
    accent: "#14b8a6",
    glow: "#fcd34d",
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
    imageFile: "level_08_dacheng.png",
    bg: "bg-amber-100",
    ring: "ring-amber-300/50",
    accent: "#f59e0b",
    glow: "#fde68a",
    pillBg: "bg-amber-100",
    pillText: "text-amber-950",
  },
  {
    level: 9,
    name: "渡劫期",
    subtitle: "巔峰霸主",
    minWins: 600,
    minWinRate: 45,
    tagline: "你每打一場都像渡劫，贏了是修仙，輸了是修心。",
    imageFile: "level_09_dujie.png",
    bg: "bg-slate-800",
    ring: "ring-violet-400/40",
    accent: "#a78bfa",
    glow: "#fbbf24",
    pillBg: "bg-slate-800",
    pillText: "text-violet-200",
  },
  {
    level: 10,
    name: "大帝期",
    subtitle: "至高無上",
    minWins: 1000,
    minWinRate: 45,
    tagline: "你不是來比賽的，你是來讓大家截圖膜拜的。",
    imageFile: "level_10_dadi.png",
    bg: "bg-gradient-to-br from-amber-200 to-emerald-200",
    ring: "ring-amber-400/60",
    accent: "#ca8a04",
    glow: "#fbbf24",
    pillBg: "bg-gradient-to-r from-amber-200 to-emerald-200",
    pillText: "text-emerald-950",
  },
];

/** Lv.0 凡人 + Lv.1–10 */
export const ALL_CULTIVATION_TIERS: CultivationTier[] = [
  CULTIVATION_DEFAULT,
  ...CULTIVATION_TIERS,
];

export function getCultivationTierByLevel(level: number): CultivationTier | null {
  return ALL_CULTIVATION_TIERS.find((t) => t.level === level) ?? null;
}

export function formatWinRateRequirement(tier: CultivationTier): string {
  if (tier.minWinRate <= 0) return "勝率不限";
  return `勝率 ${tier.minWinRate}% 以上`;
}

export function formatWinsRequirement(tier: CultivationTier): string {
  if (tier.level === 0) return "0 勝";
  return `${tier.minWins} 勝以上`;
}

/** 境界圖（頭像與勳章共用） */
export function getCultivationImageSrc(
  level: number,
  gender?: PlayerAvatarGender | null,
): string {
  if (level === 0 || !gender) {
    return CULTIVATION_MORTAL_IMAGE_SRC;
  }
  const tier = getCultivationTierByLevel(level);
  if (!tier?.imageFile) {
    return CULTIVATION_MORTAL_IMAGE_SRC;
  }
  if (gender === "female") {
    return `/cultivation/female/${tier.imageFile}`;
  }
  return `/cultivation/${tier.imageFile}`;
}

/** @deprecated 請改用 getCultivationImageSrc */
export const getCultivationAvatarSrc = getCultivationImageSrc;

/** @deprecated 請改用 getCultivationImageSrc */
export const getCultivationMedalSrc = getCultivationImageSrc;

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
