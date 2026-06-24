export {
  CULTIVATION_DEFAULT,
  CULTIVATION_TIERS,
  getCultivationTier,
  getNextCultivationTier,
  type CultivationTier,
} from "@/lib/cultivation-tiers";

/** @deprecated 請改用 CULTIVATION_DEFAULT */
export { CULTIVATION_DEFAULT as KHPA_DEFAULT_BADGE } from "@/lib/cultivation-tiers";

/** @deprecated 請改用 CULTIVATION_TIERS */
export { CULTIVATION_TIERS as KHPA_BADGE_TIERS } from "@/lib/cultivation-tiers";

/** @deprecated 請改用 getCultivationTier */
export { getCultivationTier as getKhpaBadgeForWins } from "@/lib/cultivation-tiers";

/** @deprecated 請改用 getNextCultivationTier */
export { getNextCultivationTier as getKhpaNextBadge } from "@/lib/cultivation-tiers";

/** @deprecated 請改用 CultivationTier */
export type { CultivationTier as KhpaBadgeTier } from "@/lib/cultivation-tiers";
