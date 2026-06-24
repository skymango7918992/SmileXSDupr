export {
  CULTIVATION_DEFAULT,
  CULTIVATION_TIERS,
  getCultivationTier,
  getNextCultivationTier,
  formatWinRateRequirement,
  formatWinsRequirement,
  type CultivationTier,
} from "@/lib/cultivation-tiers";

/** @deprecated 請改用 CultivationTier */
export type { CultivationTier as BadgeTier } from "@/lib/cultivation-tiers";

/** @deprecated 請改用 CULTIVATION_TIERS */
export { CULTIVATION_TIERS as BADGE_TIERS } from "@/lib/cultivation-tiers";

/** @deprecated 請改用 getCultivationTier */
export { getCultivationTier as getBadgeForWins } from "@/lib/cultivation-tiers";

/** @deprecated 請改用 getNextCultivationTier */
export { getNextCultivationTier as getNextBadge } from "@/lib/cultivation-tiers";
