/** KHPA 協會獲勝榜勳章（最高 1000 勝） */
export type KhpaMedalColors = {
  rim: string;
  face: string;
  faceLight: string;
  ribbon: string;
};

export type KhpaBadgeTier = {
  level: number;
  name: string;
  minWins: number;
  description: string;
  emoji: string;
  medal: KhpaMedalColors;
  pillBg: string;
  pillText: string;
};

/** 預設：0 勝新芽（小草） */
export const KHPA_DEFAULT_BADGE: KhpaBadgeTier = {
  level: 0,
  name: "新芽",
  minWins: 0,
  description: "尚未取得勝場",
  emoji: "🌱",
  medal: {
    rim: "#94a3b8",
    face: "#e2e8f0",
    faceLight: "#f8fafc",
    ribbon: "#cbd5e1",
  },
  pillBg: "bg-slate-100",
  pillText: "text-slate-600",
};

export const KHPA_BADGE_TIERS: KhpaBadgeTier[] = [
  {
    level: 1,
    name: "協會新秀",
    minWins: 1,
    description: "第一場勝利",
    emoji: "🥉",
    medal: { rim: "#b87333", face: "#e8a86b", faceLight: "#f5d4b3", ribbon: "#cd7f32" },
    pillBg: "bg-orange-100",
    pillText: "text-orange-800",
  },
  {
    level: 2,
    name: "穩定輸出",
    minWins: 10,
    description: "10 勝",
    emoji: "🎯",
    medal: { rim: "#a8a9ad", face: "#d8d9dd", faceLight: "#f0f1f3", ribbon: "#9ca3af" },
    pillBg: "bg-sky-100",
    pillText: "text-sky-700",
  },
  {
    level: 3,
    name: "場上悍將",
    minWins: 25,
    description: "25 勝",
    emoji: "⚡",
    medal: { rim: "#0891b2", face: "#67e8f9", faceLight: "#cffafe", ribbon: "#06b6d4" },
    pillBg: "bg-cyan-100",
    pillText: "text-cyan-800",
  },
  {
    level: 4,
    name: "高雄之星",
    minWins: 50,
    description: "50 勝",
    emoji: "⭐",
    medal: { rim: "#0d9488", face: "#5eead4", faceLight: "#ccfbf1", ribbon: "#14b8a6" },
    pillBg: "bg-teal-100",
    pillText: "text-teal-800",
  },
  {
    level: 5,
    name: "百勝俱樂部",
    minWins: 100,
    description: "100 勝",
    emoji: "💯",
    medal: { rim: "#ca8a04", face: "#fde047", faceLight: "#fef9c3", ribbon: "#eab308" },
    pillBg: "bg-emerald-100",
    pillText: "text-emerald-800",
  },
  {
    level: 6,
    name: "協會菁英",
    minWins: 200,
    description: "200 勝",
    emoji: "🏅",
    medal: { rim: "#d97706", face: "#fbbf24", faceLight: "#fef3c7", ribbon: "#f59e0b" },
    pillBg: "bg-amber-100",
    pillText: "text-amber-900",
  },
  {
    level: 7,
    name: "傳奇戰將",
    minWins: 350,
    description: "350 勝",
    emoji: "🔥",
    medal: { rim: "#ea580c", face: "#fb923c", faceLight: "#ffedd5", ribbon: "#f97316" },
    pillBg: "bg-orange-100",
    pillText: "text-orange-900",
  },
  {
    level: 8,
    name: "冠軍之師",
    minWins: 500,
    description: "500 勝",
    emoji: "👑",
    medal: { rim: "#e11d48", face: "#fb7185", faceLight: "#ffe4e6", ribbon: "#f43f5e" },
    pillBg: "bg-rose-100",
    pillText: "text-rose-900",
  },
  {
    level: 9,
    name: "不朽傳說",
    minWins: 750,
    description: "750 勝",
    emoji: "💎",
    medal: { rim: "#7c3aed", face: "#c4b5fd", faceLight: "#ede9fe", ribbon: "#8b5cf6" },
    pillBg: "bg-violet-100",
    pillText: "text-violet-900",
  },
  {
    level: 10,
    name: "千勝殿堂",
    minWins: 1000,
    description: "1000 勝以上",
    emoji: "🏆",
    medal: { rim: "#b45309", face: "#fcd34d", faceLight: "#fffbeb", ribbon: "#d97706" },
    pillBg: "bg-gradient-to-r from-amber-200 to-orange-200",
    pillText: "text-amber-950",
  },
];

export function getKhpaBadgeForWins(wins: number): KhpaBadgeTier {
  let current: KhpaBadgeTier = KHPA_DEFAULT_BADGE;
  for (const tier of KHPA_BADGE_TIERS) {
    if (wins >= tier.minWins) current = tier;
  }
  return current;
}

export function getKhpaNextBadge(wins: number): KhpaBadgeTier | null {
  return KHPA_BADGE_TIERS.find((t) => wins < t.minWins) ?? null;
}
