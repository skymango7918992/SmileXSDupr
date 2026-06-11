import type { Player } from "@/types/database";

/** 對戰中心與介面顯示用名稱（優先顯示名稱，否則 DUPR 名稱） */
export function playerDisplayName(
  player: Pick<Player, "name" | "display_name">,
): string {
  const custom = player.display_name?.trim();
  return custom || player.name;
}
