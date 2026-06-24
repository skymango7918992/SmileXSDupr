import type { Player } from "@/types/database";

/** 對戰中心與介面顯示用名稱（優先顯示名稱，否則 DUPR 名稱） */
export function playerDisplayName(
  player: Pick<Player, "name" | "display_name">,
): string {
  const custom = player.display_name?.trim();
  return custom || player.name;
}

/** DUPR 雙打評分顯示（無資料為 NR） */
export function formatDuprRating(rating: number | null | undefined): string {
  if (rating == null || Number.isNaN(rating)) return "NR";
  return rating.toFixed(2);
}

/** 選人列表副標：DUPR 分數 */
export function playerPickerSubtitle(
  player: { dupr_rating?: number | null },
): string {
  return `DUPR ${formatDuprRating(player.dupr_rating ?? null)}`;
}
