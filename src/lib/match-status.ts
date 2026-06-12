import type { MatchWithPlayers } from "@/types/database";

export type MatchDisplayStatus =
  | "live"
  | "upcoming"
  | "in_progress"
  | "ended";

export const MATCH_STATUS_LABEL: Record<MatchDisplayStatus, string> = {
  live: "LIVE",
  upcoming: "即將開始",
  in_progress: "進行中",
  ended: "已結束",
};

/** 依場次順序與完成狀態推導 UI 狀態（不改 DB schema） */
export function getMatchDisplayStatus(
  match: MatchWithPlayers,
  allMatches: MatchWithPlayers[],
): MatchDisplayStatus {
  if (match.status === "completed") return "ended";

  const maxCompletedRound = allMatches
    .filter((m) => m.status === "completed")
    .reduce((max, m) => Math.max(max, m.round_number), 0);

  const nextRound = maxCompletedRound + 1;

  if (match.round_number === nextRound) return "live";
  if (match.round_number === nextRound + 1) return "upcoming";
  return "in_progress";
}
