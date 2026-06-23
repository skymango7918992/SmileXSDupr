"use server";

import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/types/leaderboard";
import type { Player } from "@/types/database";

type CompletedMatch = {
  id: string;
  team1_score: number | null;
  team2_score: number | null;
};

type MatchPlayerRow = {
  match_id: string;
  player_id: string;
  team: number;
};

type PlayerStats = {
  player: Player;
  wins: number;
  losses: number;
  matches: number;
};

export type LeaderboardBundle = {
  all: LeaderboardEntry[];
  top3: LeaderboardEntry[];
};

function aggregateStats(
  matches: CompletedMatch[],
  matchPlayers: MatchPlayerRow[],
  playerMap: Map<string, Player>,
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

function toEntries(stats: Map<string, PlayerStats>): LeaderboardEntry[] {
  const sorted = [...stats.values()].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const rateA = a.matches > 0 ? a.wins / a.matches : 0;
    const rateB = b.matches > 0 ? b.wins / b.matches : 0;
    if (rateB !== rateA) return rateB - rateA;
    if (b.matches !== a.matches) return b.matches - a.matches;
    const nameA = a.player.display_name?.trim() || a.player.name;
    const nameB = b.player.display_name?.trim() || b.player.name;
    return nameA.localeCompare(nameB, "zh-Hant");
  });

  return sorted.map((row, index) => ({
    playerId: row.player.id,
    name: row.player.display_name?.trim() || row.player.name,
    duprId: row.player.dupr_id,
    wins: row.wins,
    losses: row.losses,
    matches: row.matches,
    winRate: row.matches > 0 ? Math.round((row.wins / row.matches) * 100) : 0,
    rank: index + 1,
  }));
}

/** 僅查詢指定年份的已完成場次（避免載入全部歷史） */
async function fetchYearCompletedMatches(
  year: number,
): Promise<CompletedMatch[]> {
  const supabase = await createClient();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const { data: days, error: dayError } = await supabase
    .from("match_days")
    .select("id")
    .gte("match_date", yearStart)
    .lte("match_date", yearEnd);

  if (dayError) throw new Error(dayError.message);
  if (!days?.length) return [];

  const dayIds = days.map((d) => d.id as string);

  const { data: sessions, error: sessionError } = await supabase
    .from("schedule_sessions")
    .select("id")
    .in("match_day_id", dayIds);

  if (sessionError) throw new Error(sessionError.message);
  if (!sessions?.length) return [];

  const sessionIds = sessions.map((s) => s.id as string);

  const { data, error } = await supabase
    .from("matches")
    .select("id, team1_score, team2_score")
    .eq("status", "completed")
    .in("schedule_session_id", sessionIds);

  if (error) throw new Error(error.message);

  return (data ?? []) as CompletedMatch[];
}

export async function getLeaderboard(
  year = new Date().getFullYear(),
): Promise<LeaderboardEntry[]> {
  const completed = await fetchYearCompletedMatches(year);
  if (completed.length === 0) return [];

  const supabase = await createClient();
  const matchIds = completed.map((m) => m.id);

  const { data: matchPlayers, error: mpError } = await supabase
    .from("match_players")
    .select("match_id, player_id, team")
    .in("match_id", matchIds);

  if (mpError) throw new Error(mpError.message);

  const rows = (matchPlayers ?? []) as MatchPlayerRow[];
  if (rows.length === 0) return [];

  const playerIds = [...new Set(rows.map((r) => r.player_id))];

  const { data: players, error: playerError } = await supabase
    .from("players")
    .select("id, name, dupr_id, active, dupr_rating, created_at, updated_at")
    .in("id", playerIds);

  if (playerError) throw new Error(playerError.message);

  const playerMap = new Map(
    ((players ?? []) as Player[]).map((p) => [p.id, p]),
  );

  return toEntries(aggregateStats(completed, rows, playerMap));
}

export async function getLeaderboardBundle(
  year = new Date().getFullYear(),
): Promise<LeaderboardBundle> {
  const all = await getLeaderboard(year);
  return {
    all,
    top3: all.slice(0, 3),
  };
}

export async function getLeaderboardTop3(
  year = new Date().getFullYear(),
): Promise<LeaderboardEntry[]> {
  const all = await getLeaderboard(year);
  return all.slice(0, 3);
}
