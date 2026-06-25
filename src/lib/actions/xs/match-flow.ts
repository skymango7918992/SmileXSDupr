"use server";

import { revalidatePath } from "next/cache";
import { canDeleteMatches, isAdminRole } from "@/lib/auth/roles";
import { getCurrentUserEmail } from "@/lib/auth/require-xs-admin";
import { createClient } from "@/lib/supabase/server";
import { buildTeammateHistory, matchupKey } from "@/lib/pair-history";
import {
  buildPlayCountFromPairings,
  generateMatchPairings,
  type MatchPairing,
  type SessionRosterEntry,
} from "@/lib/scheduler";
import type { MatchDay, MatchWithPlayers, ScoreType } from "@/types/database";

const DAILY_SESSION_NAME = "今日對戰";

const MATCH_SELECT = `
  *,
  match_players (
    *,
    player:players (*)
  )
`;

function revalidateXs() {
  revalidatePath("/");
}

async function getInheritedRosterIds(
  venueId: string,
  matchDate: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data: recentDays, error: dayError } = await supabase
    .from("match_days")
    .select("id, match_date, selected_player_ids")
    .eq("venue_id", venueId)
    .lt("match_date", matchDate)
    .order("match_date", { ascending: false })
    .limit(10);

  if (dayError) throw new Error(dayError.message);

  for (const day of recentDays ?? []) {
    const ids = (day.selected_player_ids ?? []) as string[];
    if (ids.length > 0) return ids;
  }

  const prevDay = recentDays?.[0];
  if (!prevDay) return [];

  const { data: session, error: sessionError } = await supabase
    .from("schedule_sessions")
    .select("id")
    .eq("match_day_id", prevDay.id)
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  if (sessionError) throw new Error(sessionError.message);
  if (!session) return [];

  const { data: roster, error: rosterError } = await supabase
    .from("session_players")
    .select("player_id")
    .eq("schedule_session_id", session.id)
    .eq("joined_after_round", 0);

  if (rosterError) throw new Error(rosterError.message);
  return (roster ?? []).map((r) => r.player_id as string);
}

async function getOrCreateMatchDay(
  venueId: string,
  matchDate: string,
): Promise<MatchDay> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("match_days")
    .select("*")
    .eq("venue_id", venueId)
    .eq("match_date", matchDate)
    .maybeSingle();

  if (existing) return existing as MatchDay;

  const inheritedIds = await getInheritedRosterIds(venueId, matchDate);

  const { data, error } = await supabase
    .from("match_days")
    .insert({
      venue_id: venueId,
      match_date: matchDate,
      selected_player_ids: inheritedIds,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MatchDay;
}

async function getOrCreateDailySession(
  venueId: string,
  matchDate: string,
): Promise<string> {
  const supabase = await createClient();
  const day = await getOrCreateMatchDay(venueId, matchDate);

  const { data: existing } = await supabase
    .from("schedule_sessions")
    .select("id")
    .eq("match_day_id", day.id)
    .eq("name", DAILY_SESSION_NAME)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("schedule_sessions")
    .insert({
      match_day_id: day.id,
      venue_id: venueId,
      name: DAILY_SESSION_NAME,
      score_type: "sideout",
      sort_order: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

async function getSessionIdsForDate(
  venueId: string,
  matchDate: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data: day } = await supabase
    .from("match_days")
    .select("id")
    .eq("venue_id", venueId)
    .eq("match_date", matchDate)
    .maybeSingle();

  if (!day) return [];

  const { data: sessions, error } = await supabase
    .from("schedule_sessions")
    .select("id")
    .eq("match_day_id", day.id);

  if (error) throw new Error(error.message);
  return (sessions ?? []).map((s) => s.id as string);
}

async function getNextRoundNumber(sessionId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("round_number")
    .eq("schedule_session_id", sessionId)
    .order("round_number", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.[0]?.round_number ?? 0) + 1;
}

async function getSessionPairings(sessionId: string): Promise<MatchPairing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `round_number, match_players (player_id, team, position)`,
    )
    .eq("schedule_session_id", sessionId)
    .order("round_number");

  if (error) throw new Error(error.message);

  return (data ?? []).map((m) => {
    const players = (m.match_players ?? []) as {
      player_id: string;
      team: number;
      position: number;
    }[];
    const t1 = players
      .filter((mp) => mp.team === 1)
      .sort((a, b) => a.position - b.position);
    const t2 = players
      .filter((mp) => mp.team === 2)
      .sort((a, b) => a.position - b.position);
    return {
      round_number: m.round_number as number,
      team1: [t1[0].player_id, t1[1].player_id] as [string, string],
      team2: [t2[0].player_id, t2[1].player_id] as [string, string],
    };
  });
}

async function getSessionTeammateHistory(
  sessionId: string,
  playerIds: string[],
): Promise<Map<string, number>> {
  if (playerIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data: sessionMatches } = await supabase
    .from("matches")
    .select("id")
    .eq("schedule_session_id", sessionId);

  const matchIds = (sessionMatches ?? []).map((m) => m.id as string);

  const { data, error } = await supabase
    .from("match_players")
    .select("match_id, player_id, team")
    .in("player_id", playerIds);

  if (error) throw new Error(error.message);

  const globalHistory = buildTeammateHistory(data ?? []);

  if (matchIds.length === 0) return globalHistory;

  const sessionRows = (data ?? []).filter((r) =>
    matchIds.includes(r.match_id as string),
  );
  const sessionHistory = buildTeammateHistory(sessionRows);

  const merged = new Map(globalHistory);
  for (const [key, count] of sessionHistory) {
    merged.set(key, (merged.get(key) ?? 0) + count * 2);
  }
  return merged;
}

async function syncSessionRoster(
  sessionId: string,
  matchDayId: string,
  playerIds: string[],
): Promise<void> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("session_players")
    .select("player_id, joined_after_round")
    .eq("schedule_session_id", sessionId);

  const lateJoiners = new Set(
    (existing ?? [])
      .filter((r) => r.joined_after_round > 0)
      .map((r) => r.player_id as string),
  );

  const toRemove = (existing ?? [])
    .filter(
      (r) =>
        r.joined_after_round === 0 &&
        !playerIds.includes(r.player_id as string),
    )
    .map((r) => r.player_id as string);

  if (toRemove.length > 0) {
    await supabase
      .from("session_players")
      .delete()
      .eq("schedule_session_id", sessionId)
      .in("player_id", toRemove)
      .eq("joined_after_round", 0);
  }

  const toAdd = playerIds.filter(
    (id) =>
      !(existing ?? []).some((r) => r.player_id === id) && !lateJoiners.has(id),
  );

  if (toAdd.length > 0) {
    const { error } = await supabase.from("session_players").insert(
      toAdd.map((player_id) => ({
        schedule_session_id: sessionId,
        player_id,
        joined_after_round: 0,
      })),
    );
    if (error) throw new Error(error.message);
  }

  const { error: dayError } = await supabase
    .from("match_days")
    .update({ selected_player_ids: playerIds })
    .eq("id", matchDayId);
  if (dayError) throw new Error(dayError.message);
}

async function insertPairings(
  sessionId: string,
  matchDayId: string,
  pairings: MatchPairing[],
  scoreType: ScoreType,
): Promise<void> {
  const supabase = await createClient();

  for (const pairing of pairings) {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        match_day_id: matchDayId,
        schedule_session_id: sessionId,
        round_number: pairing.round_number,
        status: "scheduled",
        score_type: scoreType,
      })
      .select()
      .single();

    if (matchError) throw new Error(matchError.message);

    const { error: playersError } = await supabase.from("match_players").insert([
      { match_id: match.id, player_id: pairing.team1[0], team: 1, position: 1 },
      { match_id: match.id, player_id: pairing.team1[1], team: 1, position: 2 },
      { match_id: match.id, player_id: pairing.team2[0], team: 2, position: 1 },
      { match_id: match.id, player_id: pairing.team2[1], team: 2, position: 2 },
    ]);
    if (playersError) throw new Error(playersError.message);
  }
}

export async function ensureXsMatchDay(
  venueId: string,
  matchDate: string,
): Promise<MatchDay> {
  return getOrCreateMatchDay(venueId, matchDate);
}

export async function getXsMatchesForDate(
  venueId: string,
  matchDate: string,
): Promise<MatchWithPlayers[]> {
  const sessionIds = await getSessionIdsForDate(venueId, matchDate);
  if (sessionIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .in("schedule_session_id", sessionIds)
    .order("round_number", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MatchWithPlayers[];
}

export async function createXsMatchWithScore(
  venueId: string,
  matchDate: string,
  team1PlayerIds: [string, string],
  team2PlayerIds: [string, string],
  team1Score: number,
  team2Score: number,
  scoreType: ScoreType = "sideout",
): Promise<void> {
  const allIds = [...team1PlayerIds, ...team2PlayerIds];
  if (new Set(allIds).size !== 4) {
    throw new Error("四位球員不可重複");
  }
  if (team1Score < 0 || team2Score < 0) {
    throw new Error("請輸入有效比分");
  }

  const supabase = await createClient();
  const sessionId = await getOrCreateDailySession(venueId, matchDate);
  const day = await getOrCreateMatchDay(venueId, matchDate);
  await syncSessionRoster(sessionId, day.id, allIds);

  const existingPairings = await getSessionPairings(sessionId);
  const key = matchupKey(team1PlayerIds, team2PlayerIds);
  if (existingPairings.some((p) => matchupKey(p.team1, p.team2) === key)) {
    throw new Error("此 2v2 對戰組合今日已存在");
  }

  const roundNumber = await getNextRoundNumber(sessionId);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      match_day_id: day.id,
      schedule_session_id: sessionId,
      round_number: roundNumber,
      team1_score: team1Score,
      team2_score: team2Score,
      status: "completed",
      score_type: scoreType,
    })
    .select()
    .single();

  if (matchError) throw new Error(matchError.message);

  const { error: playersError } = await supabase.from("match_players").insert([
    { match_id: match.id, player_id: team1PlayerIds[0], team: 1, position: 1 },
    { match_id: match.id, player_id: team1PlayerIds[1], team: 1, position: 2 },
    { match_id: match.id, player_id: team2PlayerIds[0], team: 2, position: 1 },
    { match_id: match.id, player_id: team2PlayerIds[1], team: 2, position: 2 },
  ]);

  if (playersError) throw new Error(playersError.message);

  await supabase
    .from("schedule_sessions")
    .update({ score_type: scoreType })
    .eq("id", sessionId);

  revalidateXs();
}

export async function generateXsAutoMatches(
  venueId: string,
  matchDate: string,
  playerIds: string[],
  matchCount: number,
  scoreType: ScoreType = "sideout",
): Promise<void> {
  const uniqueIds = [...new Set(playerIds)];
  if (uniqueIds.length < 4) {
    throw new Error("自動排列至少需要 4 位球員");
  }
  if (matchCount < 1 || matchCount > 30) {
    throw new Error("場數請介於 1～30");
  }

  const sessionId = await getOrCreateDailySession(venueId, matchDate);
  const day = await getOrCreateMatchDay(venueId, matchDate);
  await syncSessionRoster(sessionId, day.id, uniqueIds);

  const supabase = await createClient();
  await supabase
    .from("schedule_sessions")
    .update({ score_type: scoreType })
    .eq("id", sessionId);

  const roster: SessionRosterEntry[] = uniqueIds.map((player_id) => ({
    player_id,
    joined_after_round: 0,
  }));

  const startRound = await getNextRoundNumber(sessionId);
  const history = await getSessionTeammateHistory(sessionId, uniqueIds);
  const existingPairings = await getSessionPairings(sessionId);
  const priorPlayCount = buildPlayCountFromPairings(existingPairings);

  const pairings = generateMatchPairings(
    roster,
    matchCount,
    startRound,
    history,
    priorPlayCount,
    existingPairings,
  );

  await insertPairings(sessionId, day.id, pairings, scoreType);
  revalidateXs();
}

export async function updateXsMatchScore(
  matchId: string,
  team1Score: number,
  team2Score: number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({
      team1_score: team1Score,
      team2_score: team2Score,
      status: "completed",
    })
    .eq("id", matchId);
  if (error) throw new Error(error.message);
  revalidateXs();
}

export async function deleteXsMatch(matchId: string): Promise<void> {
  const email = await getCurrentUserEmail();
  if (!canDeleteMatches(email)) {
    throw new Error("僅系統管理員可刪除對戰紀錄");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) throw new Error(error.message);
  revalidateXs();
}

export async function getXsCanDelete(): Promise<boolean> {
  const email = await getCurrentUserEmail();
  return isAdminRole(email);
}

export async function clearXsScheduledMatches(
  venueId: string,
  matchDate: string,
): Promise<void> {
  const sessionId = await getOrCreateDailySession(venueId, matchDate);
  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("schedule_session_id", sessionId)
    .eq("status", "scheduled");
  if (error) throw new Error(error.message);
  revalidateXs();
}
