/** 可序列化的勳章資料（Server / Client 共用，不含 React 元件） */
export type BadgeTier = {
  level: number;
  name: string;
  minWins: number;
  description: string;
  gradient: string;
  ring: string;
};

export const BADGE_TIERS: BadgeTier[] = [
  {
    level: 1,
    name: "新星入門",
    minWins: 1,
    description: "拿下第一場勝利",
    gradient: "from-stone-400 to-stone-500",
    ring: "ring-stone-300/60",
  },
  {
    level: 2,
    name: "小試身手",
    minWins: 3,
    description: "累積 3 場勝利",
    gradient: "from-amber-600 to-amber-700",
    ring: "ring-amber-400/50",
  },
  {
    level: 3,
    name: "漸入佳境",
    minWins: 5,
    description: "累積 5 場勝利",
    gradient: "from-amber-400 to-orange-500",
    ring: "ring-orange-300/60",
  },
  {
    level: 4,
    name: "場上常客",
    minWins: 10,
    description: "累積 10 場勝利",
    gradient: "from-lime-500 to-green-600",
    ring: "ring-lime-300/60",
  },
  {
    level: 5,
    name: "勝場收割",
    minWins: 15,
    description: "累積 15 場勝利",
    gradient: "from-emerald-500 to-emerald-700",
    ring: "ring-emerald-300/60",
  },
  {
    level: 6,
    name: "匹克悍將",
    minWins: 25,
    description: "累積 25 場勝利",
    gradient: "from-teal-500 to-cyan-600",
    ring: "ring-teal-300/60",
  },
  {
    level: 7,
    name: "星鑽之星",
    minWins: 40,
    description: "累積 40 場勝利",
    gradient: "from-sky-500 to-blue-600",
    ring: "ring-sky-300/60",
  },
  {
    level: 8,
    name: "金牌戰神",
    minWins: 60,
    description: "累積 60 場勝利",
    gradient: "from-indigo-500 to-violet-600",
    ring: "ring-indigo-300/60",
  },
  {
    level: 9,
    name: "冠軍傳說",
    minWins: 85,
    description: "累積 85 場勝利",
    gradient: "from-violet-500 to-purple-700",
    ring: "ring-violet-300/60",
  },
  {
    level: 10,
    name: "XS 不朽殿堂",
    minWins: 120,
    description: "累積 120 場勝利",
    gradient: "from-amber-300 via-yellow-400 to-amber-500",
    ring: "ring-amber-200/80",
  },
];

export function getBadgeForWins(wins: number): BadgeTier | null {
  if (wins < 1) return null;
  let current: BadgeTier | null = null;
  for (const tier of BADGE_TIERS) {
    if (wins >= tier.minWins) current = tier;
  }
  return current;
}

export function getNextBadge(wins: number): BadgeTier | null {
  return BADGE_TIERS.find((t) => wins < t.minWins) ?? null;
}
