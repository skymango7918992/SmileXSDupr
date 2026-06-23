import type { ScoreType } from "@/types/database";
import type { KhpaMatchWithPlayers } from "@/types/khpa";
import { toDuprScoreType } from "@/lib/dupr-score-type";

const CSV_HEADERS = [
  "matchType",
  "event",
  "date",
  "playerA1",
  "playerA1DuprId",
  "playerA1ExternalId",
  "playerA2",
  "playerA2DuprId",
  "playerA2ExternalId",
  "playerB1",
  "playerB1DuprId",
  "playerB1ExternalId",
  "playerB2",
  "playerB2DuprId",
  "playerB2ExternalId",
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
  "location",
  "scoreType",
] as const;

function getTeamPlayers(
  match: KhpaMatchWithPlayers,
  team: 1 | 2,
) {
  return match.khpa_match_players
    .filter((mp) => mp.team === team)
    .sort((a, b) => a.position - b.position)
    .map((mp) => mp.player);
}

export function buildKhpaDuprEventName(
  matchDate: string,
  roundNumber: number,
): string {
  const ymd = matchDate.replace(/-/g, "");
  const round = String(roundNumber).padStart(3, "0");
  return `KHPA ${ymd}-${round}`;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function matchToCsvRow(
  matchDate: string,
  match: KhpaMatchWithPlayers,
  scoreType: ScoreType,
  venueName?: string,
): string[] {
  const teamA = getTeamPlayers(match, 1);
  const teamB = getTeamPlayers(match, 2);

  return [
    "D",
    buildKhpaDuprEventName(matchDate, match.round_number),
    matchDate,
    teamA[0]?.display_name ?? "",
    teamA[0]?.dupr_id ?? "",
    "",
    teamA[1]?.display_name ?? "",
    teamA[1]?.dupr_id ?? "",
    "",
    teamB[0]?.display_name ?? "",
    teamB[0]?.dupr_id ?? "",
    "",
    teamB[1]?.display_name ?? "",
    teamB[1]?.dupr_id ?? "",
    "",
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
    venueName ?? "",
    toDuprScoreType(scoreType),
  ];
}

export function exportKhpaMatchesToDuprCsv(
  matchDate: string,
  matches: KhpaMatchWithPlayers[],
  options?: {
    sessionName?: string;
    scoreType?: ScoreType;
    venueName?: string;
  },
): { exported: number; skipped: number } {
  const scoreType = options?.scoreType ?? "sideout";
  const sessionName = options?.sessionName;
  const venueName = options?.venueName;
  const completed = matches.filter((m) => m.status === "completed");
  const skipped = matches.length - completed.length;

  if (completed.length === 0) {
    throw new Error("沒有已完成的對戰可匯出，請先輸入比分");
  }

  const rows = completed
    .sort((a, b) => a.round_number - b.round_number)
    .map((match) =>
      matchToCsvRow(
        matchDate,
        match,
        match.score_type ?? options?.scoreType ?? "sideout",
        venueName,
      )
        .map(escapeCsvField)
        .join(","),
    );

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
  link.download = `KHPA_${matchDate}${suffix}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  return { exported: completed.length, skipped };
}
