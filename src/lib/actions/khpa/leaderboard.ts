"use server";

import { createClient } from "@/lib/supabase/server";
import type { KhpaLeaderboardEntry } from "@/types/khpa";
import type { KhpaPlayer } from "@/types/khpa";

type CompletedMatch = {
  id: string;
  team1_score: number | null;
  team2_score: number | null;
  match_date: string;
};

type MatchPlayerRow = {
  match_id: string;
  player_id: string;
  team: number;
};

type PlayerStats = {
  player: KhpaPlayer;
  wins: number;
  losses: number;
  matches: number;
};

function aggregateStats(
  matches: CompletedMatch[],
  matchPlayers: MatchPlayerRow[],
  playerMap: Map<string, KhpaPlayer>,
): Map<string, PlayerStats> {
  const playersByMatch = new Map<string, MatchPlayerRow[]>();
  for (const mp of matchPlayers) {
    const list = playersByMatch.get(mp.match_id) ?? [];
    list.push(mp);
    playersByMatch.set(mp.match_id, list);
  }

  const stats = new Map<string, PlayerStats>();

  for (const match of matches) {
    const s1 = match.team1_score;
    const s2 = match.team2_score;
    if (s1 == null || s2 == null || s1 === s2) continue;

    const winningTeam: 1 | 2 = s1 > s2 ? 1 : 2;
    const losingTeam: 1 | 2 = winningTeam === 1 ? 2 : 1;
    const roster = playersByMatch.get(match.id) ?? [];

    for (const mp of roster) {
      if (mp.team !== 1 && mp.team !== 2) continue;
      const player = playerMap.get(mp.player_id);
      if (!player) continue;

      const existing = stats.get(mp.player_id) ?? {
        player,
        wins: 0,
        losses: 0,
        matches: 0,
      };

      existing.matches += 1;
      if (mp.team === winningTeam) existing.wins += 1;
      if (mp.team === losingTeam) existing.losses += 1;
      stats.set(mp.player_id, existing);
    }
  }

  return stats;
}

function toEntries(stats: Map<string, PlayerStats>): KhpaLeaderboardEntry[] {
  const sorted = [...stats.values()].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const rateA = a.matches > 0 ? a.wins / a.matches : 0;
    const rateB = b.matches > 0 ? b.wins / b.matches : 0;
    if (rateB !== rateA) return rateB - rateA;
    if (b.matches !== a.matches) return b.matches - a.matches;
    return a.player.display_name.localeCompare(b.player.display_name, "zh-Hant");
  });

  return sorted.map((row, index) => ({
    playerId: row.player.id,
    name: row.player.display_name,
    duprId: row.player.dupr_id,
    wins: row.wins,
    losses: row.losses,
    matches: row.matches,
    winRate: row.matches > 0 ? Math.round((row.wins / row.matches) * 100) : 0,
    rank: index + 1,
  }));
}

function extractMatchDate(row: Record<string, unknown>): string {
  const sessions = row.khpa_schedule_sessions;
  if (!sessions) return "";
  const session = Array.isArray(sessions) ? sessions[0] : sessions;
  if (!session || typeof session !== "object") return "";
  const days = (session as Record<string, unknown>).khpa_match_days;
  if (!days) return "";
  const day = Array.isArray(days) ? days[0] : days;
  if (!day || typeof day !== "object") return "";
  const date = (day as Record<string, unknown>).match_date;
  return typeof date === "string" ? date : "";
}

async function fetchYearCompletedMatches(year: number): Promise<CompletedMatch[]> {
  const supabase = await createClient();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const { data, error } = await supabase
    .from("khpa_matches")
    .select(
      `
      id,
      team1_score,
      team2_score,
      khpa_schedule_sessions!inner(
        khpa_match_days!inner(match_date)
      )
    `,
    )
    .eq("status", "completed");

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => ({
      id: row.id as string,
      team1_score: row.team1_score as number | null,
      team2_score: row.team2_score as number | null,
      match_date: extractMatchDate(row as Record<string, unknown>),
    }))
    .filter(
      (m) =>
        m.match_date >= yearStart &&
        m.match_date <= yearEnd,
    );
}

export async function getKhpaLeaderboard(
  year = new Date().getFullYear(),
): Promise<KhpaLeaderboardEntry[]> {
  const completed = await fetchYearCompletedMatches(year);
  if (completed.length === 0) return [];

  const supabase = await createClient();
  const matchIds = completed.map((m) => m.id);

  const { data: matchPlayers, error: mpError } = await supabase
    .from("khpa_match_players")
    .select("match_id, player_id, team")
    .in("match_id", matchIds);

  if (mpError) throw new Error(mpError.message);

  const rows = (matchPlayers ?? []) as MatchPlayerRow[];
  if (rows.length === 0) return [];

  const playerIds = [...new Set(rows.map((r) => r.player_id))];

  const { data: players, error: playerError } = await supabase
    .from("khpa_players")
    .select("*")
    .in("id", playerIds);

  if (playerError) throw new Error(playerError.message);

  const playerMap = new Map(
    ((players ?? []) as KhpaPlayer[]).map((p) => [p.id, p]),
  );

  return toEntries(aggregateStats(completed, rows, playerMap));
}

export async function getKhpaLeaderboardTop3(
  year = new Date().getFullYear(),
): Promise<KhpaLeaderboardEntry[]> {
  const all = await getKhpaLeaderboard(year);
  return all.slice(0, 3);
}

export async function getKhpaLeaderboardTop10(
  year = new Date().getFullYear(),
): Promise<KhpaLeaderboardEntry[]> {
  const all = await getKhpaLeaderboard(year);
  return all.slice(0, 10);
}

export async function getKhpaPlayerWins(
  playerId: string,
  year = new Date().getFullYear(),
): Promise<number> {
  const board = await getKhpaLeaderboard(year);
  return board.find((e) => e.playerId === playerId)?.wins ?? 0;
}

/** 獲勝榜可切換的年份（含有比賽紀錄的年份與今年） */
export async function getKhpaAvailableYears(): Promise<number[]> {
  const current = new Date().getFullYear();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("khpa_match_days")
    .select("match_date");

  if (error) throw new Error(error.message);

  const years = new Set<number>([current]);
  for (const row of data ?? []) {
    const y = Number(String(row.match_date).slice(0, 4));
    if (!Number.isNaN(y)) years.add(y);
  }

  return [...years].sort((a, b) => b - a);
}
