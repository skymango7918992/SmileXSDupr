/** 可序列化的勳章資料（Server / Client 共用，不含 React 元件） */
export type BadgeTier = {
  level: number;
  name: string;
  minWins: number;
  description: string;
  bg: string;
  ring: string;
  iconColor: string;
};

export const BADGE_TIERS: BadgeTier[] = [
  {
    level: 1,
    name: "新星入門",
    minWins: 1,
    description: "拿下第一場勝利",
    bg: "bg-surface-muted",
    ring: "ring-border",
    iconColor: "text-muted",
  },
  {
    level: 2,
    name: "小試身手",
    minWins: 3,
    description: "累積 3 場勝利",
    bg: "bg-primary-soft",
    ring: "ring-primary/20",
    iconColor: "text-primary",
  },
  {
    level: 3,
    name: "漸入佳境",
    minWins: 5,
    description: "累積 5 場勝利",
    bg: "bg-primary/20",
    ring: "ring-primary/25",
    iconColor: "text-primary",
  },
  {
    level: 4,
    name: "場上常客",
    minWins: 10,
    description: "累積 10 場勝利",
    bg: "bg-primary/35",
    ring: "ring-primary/30",
    iconColor: "text-primary-hover",
  },
  {
    level: 5,
    name: "勝場收割",
    minWins: 15,
    description: "累積 15 場勝利",
    bg: "bg-primary/50",
    ring: "ring-primary/25",
    iconColor: "text-white",
  },
  {
    level: 6,
    name: "匹克悍將",
    minWins: 25,
    description: "累積 25 場勝利",
    bg: "bg-primary",
    ring: "ring-primary/30",
    iconColor: "text-white",
  },
  {
    level: 7,
    name: "星鑽之星",
    minWins: 40,
    description: "累積 40 場勝利",
    bg: "bg-primary-hover",
    ring: "ring-primary/35",
    iconColor: "text-white",
  },
  {
    level: 8,
    name: "金牌戰神",
    minWins: 60,
    description: "累積 60 場勝利",
    bg: "bg-success/80",
    ring: "ring-success/25",
    iconColor: "text-white",
  },
  {
    level: 9,
    name: "冠軍傳說",
    minWins: 85,
    description: "累積 85 場勝利",
    bg: "bg-accent/80",
    ring: "ring-accent/25",
    iconColor: "text-white",
  },
  {
    level: 10,
    name: "XS 不朽殿堂",
    minWins: 120,
    description: "累積 120 場勝利",
    bg: "bg-primary",
    ring: "ring-primary/30",
    iconColor: "text-white",
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
