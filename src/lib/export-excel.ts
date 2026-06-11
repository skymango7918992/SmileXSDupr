import * as XLSX from "xlsx";
import type { MatchWithPlayers, Player } from "@/types/database";

function getTeamPlayers(
  match: MatchWithPlayers,
  team: 1 | 2,
): (Player | undefined)[] {
  return match.match_players
    .filter((mp) => mp.team === team)
    .sort((a, b) => a.position - b.position)
    .map((mp) => mp.player);
}

export function exportMatchesToExcel(
  matchDate: string,
  matches: MatchWithPlayers[],
): void {
  const rows = matches.map((match) => {
    const t1 = getTeamPlayers(match, 1);
    const t2 = getTeamPlayers(match, 2);
    const score =
      match.team1_score != null && match.team2_score != null
        ? `${match.team1_score} : ${match.team2_score}`
        : "";

    return {
      日期: matchDate,
      場次: match.round_number,
      隊伍1球員1: t1[0]?.name ?? "",
      隊伍1DUPR1: t1[0]?.dupr_id ?? "",
      隊伍1球員2: t1[1]?.name ?? "",
      隊伍1DUPR2: t1[1]?.dupr_id ?? "",
      隊伍2球員1: t2[0]?.name ?? "",
      隊伍2DUPR1: t2[0]?.dupr_id ?? "",
      隊伍2球員2: t2[1]?.name ?? "",
      隊伍2DUPR2: t2[1]?.dupr_id ?? "",
      比分: score,
      狀態: match.status === "completed" ? "已完成" : "待進行",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "對戰紀錄");
  XLSX.writeFile(workbook, `DUPR對戰_${matchDate}.xlsx`);
}
