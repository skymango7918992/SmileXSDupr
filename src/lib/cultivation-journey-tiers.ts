import { ALL_CULTIVATION_TIERS, type CultivationTier } from "@/lib/cultivation-tiers";

/** 修行軌跡境界：依累積修為值（與獲勝榜境界分開計算） */
export type JourneyRealmTier = CultivationTier & {
  minXp: number;
};

/** 大帝修為門檻（約 2 年持續紀錄 + DUPR 關鍵場次加成） */
export const JOURNEY_EMPEROR_MIN_XP = 40_000;

/** 封大帝需同時達標的 DUPR 雙打評分 */
export const JOURNEY_EMPEROR_MIN_DUPR = 4.0;

/**
 * 修行軌跡境界門檻（累積修為）。
 * 友誼切磋修為較少；DUPR 匯入場次有額外關鍵加分，可加速衝刺大帝。
 */
const XP_THRESHOLDS: { level: number; minXp: number }[] = [
  { level: 0, minXp: 0 },
  { level: 1, minXp: 80 },
  { level: 2, minXp: 250 },
  { level: 3, minXp: 600 },
  { level: 4, minXp: 1_200 },
  { level: 5, minXp: 2_200 },
  { level: 6, minXp: 3_500 },
  { level: 7, minXp: 5_500 },
  { level: 8, minXp: 9_000 },
  { level: 9, minXp: 15_000 },
  { level: 10, minXp: JOURNEY_EMPEROR_MIN_XP },
];

export const JOURNEY_REALM_TIERS: JourneyRealmTier[] = XP_THRESHOLDS.map(
  ({ level, minXp }) => {
    const tier = ALL_CULTIVATION_TIERS.find((t) => t.level === level)!;
    return { ...tier, minXp };
  },
);

export function isEmperorDuprQualified(duprRating: number | null | undefined): boolean {
  return duprRating != null && duprRating >= JOURNEY_EMPEROR_MIN_DUPR;
}

/** 依修為判定境界等級（不考慮 DUPR 封頂） */
export function getJourneyRealmLevelByXp(totalXp: number): number {
  let level = 0;
  for (const tier of JOURNEY_REALM_TIERS) {
    if (totalXp >= tier.minXp) level = tier.level;
  }
  return level;
}

export function getJourneyRealmTierByLevel(level: number): JourneyRealmTier {
  return JOURNEY_REALM_TIERS.find((t) => t.level === level) ?? JOURNEY_REALM_TIERS[0]!;
}

export function getEffectiveJourneyRealmLevel(
  totalXp: number,
  duprRating: number | null | undefined,
): number {
  const xpLevel = getJourneyRealmLevelByXp(totalXp);
  if (xpLevel >= 10 && !isEmperorDuprQualified(duprRating)) {
    return 9;
  }
  return xpLevel;
}

export function getJourneyRealm(
  totalXp: number,
  duprRating?: number | null,
): JourneyRealmTier {
  return getJourneyRealmTierByLevel(
    getEffectiveJourneyRealmLevel(totalXp, duprRating),
  );
}

export function getNextJourneyRealm(
  totalXp: number,
  duprRating?: number | null,
): JourneyRealmTier | null {
  const effectiveLevel = getEffectiveJourneyRealmLevel(totalXp, duprRating);
  const xpLevel = getJourneyRealmLevelByXp(totalXp);

  if (effectiveLevel >= 10) return null;

  if (xpLevel >= 10 && effectiveLevel === 9) {
    return getJourneyRealmTierByLevel(10);
  }

  return (
    JOURNEY_REALM_TIERS.find((tier) => tier.level === effectiveLevel + 1) ?? null
  );
}

export type JourneyRealmProgress = {
  current: JourneyRealmTier;
  next: JourneyRealmTier | null;
  xpIntoTier: number;
  xpNeeded: number;
  percent: number;
  /** 修為已達大帝門檻，但 DUPR 尚未 ≥ 4.0 */
  emperorXpReady: boolean;
  emperorDuprReady: boolean;
  duprRating: number | null;
};

export function getJourneyRealmProgress(
  totalXp: number,
  duprRating: number | null = null,
): JourneyRealmProgress {
  const current = getJourneyRealm(totalXp, duprRating);
  const next = getNextJourneyRealm(totalXp, duprRating);
  const emperorXpReady = totalXp >= JOURNEY_EMPEROR_MIN_XP;
  const emperorDuprReady = isEmperorDuprQualified(duprRating);

  if (!next) {
    return {
      current,
      next: null,
      xpIntoTier: totalXp - current.minXp,
      xpNeeded: 0,
      percent: 100,
      emperorXpReady,
      emperorDuprReady,
      duprRating,
    };
  }

  const xpIntoTier = totalXp - current.minXp;
  const xpNeeded = next.minXp - current.minXp;
  const percent =
    xpNeeded > 0 ? Math.min(100, Math.round((xpIntoTier / xpNeeded) * 100)) : 0;

  return {
    current,
    next,
    xpIntoTier,
    xpNeeded,
    percent,
    emperorXpReady,
    emperorDuprReady,
    duprRating,
  };
}
