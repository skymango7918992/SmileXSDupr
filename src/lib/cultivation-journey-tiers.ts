import { ALL_CULTIVATION_TIERS, type CultivationTier } from "@/lib/cultivation-tiers";

/** 修行軌跡境界：依累積修為值（與獲勝榜境界分開計算） */
export type JourneyRealmTier = CultivationTier & {
  minXp: number;
};

const XP_THRESHOLDS: { level: number; minXp: number }[] = [
  { level: 0, minXp: 0 },
  { level: 1, minXp: 30 },
  { level: 2, minXp: 80 },
  { level: 3, minXp: 150 },
  { level: 4, minXp: 250 },
  { level: 5, minXp: 380 },
  { level: 6, minXp: 550 },
  { level: 7, minXp: 750 },
  { level: 8, minXp: 1000 },
  { level: 9, minXp: 1300 },
  { level: 10, minXp: 1700 },
];

export const JOURNEY_REALM_TIERS: JourneyRealmTier[] = XP_THRESHOLDS.map(
  ({ level, minXp }) => {
    const tier = ALL_CULTIVATION_TIERS.find((t) => t.level === level)!;
    return { ...tier, minXp };
  },
);

export function getJourneyRealm(totalXp: number): JourneyRealmTier {
  let current = JOURNEY_REALM_TIERS[0]!;
  for (const tier of JOURNEY_REALM_TIERS) {
    if (totalXp >= tier.minXp) current = tier;
  }
  return current;
}

export function getNextJourneyRealm(totalXp: number): JourneyRealmTier | null {
  return (
    JOURNEY_REALM_TIERS.find((tier) => totalXp < tier.minXp) ?? null
  );
}

export function getJourneyRealmProgress(totalXp: number): {
  current: JourneyRealmTier;
  next: JourneyRealmTier | null;
  xpIntoTier: number;
  xpNeeded: number;
  percent: number;
} {
  const current = getJourneyRealm(totalXp);
  const next = getNextJourneyRealm(totalXp);
  if (!next) {
    return {
      current,
      next: null,
      xpIntoTier: totalXp - current.minXp,
      xpNeeded: 0,
      percent: 100,
    };
  }
  const xpIntoTier = totalXp - current.minXp;
  const xpNeeded = next.minXp - current.minXp;
  const percent =
    xpNeeded > 0 ? Math.min(100, Math.round((xpIntoTier / xpNeeded) * 100)) : 0;
  return { current, next, xpIntoTier, xpNeeded, percent };
}
