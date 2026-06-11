import type { MatchWithPlayers, Player } from "@/types/database";

const CSV_HEADERS = [
  "matchType",
  "scoreType",
  "event",
  "date",
  "playerA1",
  "playerA1DuprId",
  "playerA2",
  "playerA2DuprId",
  "playerB1",
  "playerB1DuprId",
  "playerB2",
  "playerB2DuprId",
  "teamAGame1",
  "teamBGame1",
  "teamAGame2",
  "teamBGame2",
  "teamAGame3",
  "teamBGame3",
  "teamAGame4",
  "teamBGame4",
  "teamAGame5",
  "teamBGame5",
] as const;

function getTeamPlayers(
  match: MatchWithPlayers,
  team: 1 | 2,
): (Player | undefined)[] {
  return match.match_players
    .filter((mp) => mp.team === team)
    .sort((a, b) => a.position - b.position)
    .map((mp) => mp.player);
}

/** SmileXS-Dupr YYYYMMDD-場次（3 位數） */
export function buildDuprEventName(
  matchDate: string,
  roundNumber: number,
): string {
  const ymd = matchDate.replace(/-/g, "");
  const round = String(roundNumber).padStart(3, "0");
  return `SmileXS-Dupr ${ymd}-${round}`;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function matchToCsvRow(matchDate: string, match: MatchWithPlayers): string[] {
  const teamA = getTeamPlayers(match, 1);
  const teamB = getTeamPlayers(match, 2);

  return [
    "D",
    "RALLY",
    buildDuprEventName(matchDate, match.round_number),
    matchDate,
    "",
    teamA[0]?.dupr_id ?? "",
    "",
    teamA[1]?.dupr_id ?? "",
    "",
    teamB[0]?.dupr_id ?? "",
    "",
    teamB[1]?.dupr_id ?? "",
    match.team1_score != null ? String(match.team1_score) : "",
    match.team2_score != null ? String(match.team2_score) : "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];
}

export function exportMatchesToDuprCsv(
  matchDate: string,
  matches: MatchWithPlayers[],
  sessionName?: string,
): { exported: number; skipped: number } {
  const completed = matches.filter((m) => m.status === "completed");
  const skipped = matches.length - completed.length;

  if (completed.length === 0) {
    throw new Error("沒有已完成的對戰可匯出，請先輸入比分");
  }

  const rows = completed
    .sort((a, b) => a.round_number - b.round_number)
    .map((match) => matchToCsvRow(matchDate, match).map(escapeCsvField).join(","));

  const csv = [CSV_HEADERS.join(","), ...rows].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const suffix = sessionName
    ? `_${sessionName.replace(/[^\w\u4e00-\u9fff-]+/g, "")}`
    : "";
  link.download = `SmileXSDupr_${matchDate}${suffix}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  return { exported: completed.length, skipped };
}
