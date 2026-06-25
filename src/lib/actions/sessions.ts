"use server";

import { getCurrentUserEmail, requireXsAdmin } from "@/lib/auth/require-xs-admin";
import { isStaffRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  buildPlayCountFromPairings,
  generateMatchPairings,
  type MatchPairing,
  type SessionRosterEntry,
} from "@/lib/scheduler";
import { buildTeammateHistory, matchupKey } from "@/lib/pair-history";
import { getDefaultXsVenueId } from "@/lib/actions/xs/venues";
import type {
  MatchDay,
  MatchWithPlayers,
  ScheduleSession,
  ScheduleSessionWithStats,
  ScoreType,
  SessionPlayer,
} from "@/types/database";

function normalizeScoreType(value: unknown): ScoreType {
  return value === "rally" ? "rally" : "sideout";
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

async function getInheritedScoreType(matchDate: string): Promise<ScoreType> {
  const supabase = await createClient();

  const { data: prevDay, error: dayError } = await supabase
    .from("match_days")
    .select("id")
    .lt("match_date", matchDate)
    .order("match_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dayError) throw new Error(dayError.message);
  if (!prevDay) return "rally";

  const { data: session, error: sessionError } = await supabase
    .from("schedule_sessions")
    .select("score_type")
    .eq("match_day_id", prevDay.id)
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  if (sessionError) throw new Error(sessionError.message);
  return normalizeScoreType(session?.score_type);
}

async function seedSessionPlayers(
  sessionId: string,
  playerIds: string[],
): Promise<void> {
  if (playerIds.length === 0) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("session_players")
    .select("player_id")
    .eq("schedule_session_id", sessionId);

  if ((existing ?? []).length > 0) return;

  const { error } = await supabase.from("session_players").insert(
    playerIds.map((player_id) => ({
      schedule_session_id: sessionId,
      player_id,
      joined_after_round: 0,
    })),
  );
  if (error) throw new Error(error.message);
}

async function getOrCreateMatchDay(matchDate: string): Promise<MatchDay> {
  const venueId = await getDefaultXsVenueId();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("match_days")
    .select("*")
    .eq("venue_id", venueId)
    .eq("match_date", matchDate)
    .maybeSingle();

  if (existing) return existing;

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
  return data;
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

  const matchIds = (sessionMatches ?? []).map((m) => m.id);
  if (matchIds.length === 0) {
    return getGlobalTeammateHistory(playerIds);
  }

  const { data, error } = await supabase
    .from("match_players")
    .select("match_id, player_id, team")
    .in("match_id", matchIds);

  if (error) throw new Error(error.message);

  const sessionHistory = buildTeammateHistory(data ?? []);
  const globalHistory = await getGlobalTeammateHistory(playerIds);

  const merged = new Map(globalHistory);
  for (const [key, count] of sessionHistory) {
    merged.set(key, (merged.get(key) ?? 0) + count * 2);
  }
  return merged;
}

async function getGlobalTeammateHistory(playerIds: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_players")
    .select("match_id, player_id, team")
    .in("player_id", playerIds);

  if (error) throw new Error(error.message);
  return buildTeammateHistory(data ?? []);
}

async function getRoster(sessionId: string): Promise<SessionRosterEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_players")
    .select("player_id, joined_after_round")
    .eq("schedule_session_id", sessionId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    player_id: r.player_id,
    joined_after_round: r.joined_after_round,
  }));
}

async function insertPairings(
  sessionId: string,
  matchDayId: string,
  pairings: MatchPairing[],
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
      })
      .select()
      .single();

    if (matchError) throw new Error(matchError.message);

    await supabase.from("match_players").insert([
      { match_id: match.id, player_id: pairing.team1[0], team: 1, position: 1 },
      { match_id: match.id, player_id: pairing.team1[1], team: 1, position: 2 },
      { match_id: match.id, player_id: pairing.team2[0], team: 2, position: 1 },
      { match_id: match.id, player_id: pairing.team2[1], team: 2, position: 2 },
    ]);
  }
}

export async function getMatchDay(matchDate: string): Promise<MatchDay | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_days")
    .select("*")
    .eq("match_date", matchDate)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getMatchDates(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_days")
    .select("match_date")
    .order("match_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => d.match_date);
}

async function syncDayRosterToSession(
  matchDay: MatchDay,
  sessionId: string,
): Promise<void> {
  const rosterIds =
    matchDay.selected_player_ids.length > 0
      ? matchDay.selected_player_ids
      : await getInheritedRosterIds(matchDay.venue_id, matchDay.match_date);

  if (rosterIds.length === 0) return;

  await seedSessionPlayers(sessionId, rosterIds);

  if (matchDay.selected_player_ids.length === 0) {
    const supabase = await createClient();
    await supabase
      .from("match_days")
      .update({ selected_player_ids: rosterIds })
      .eq("id", matchDay.id);
  }
}

async function ensureDefaultSession(matchDay: MatchDay): Promise<void> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("schedule_sessions")
    .select("id")
    .eq("match_day_id", matchDay.id)
    .limit(1);

  if (existing && existing.length > 0) {
    await syncDayRosterToSession(matchDay, existing[0]!.id as string);
    return;
  }

  const scoreType = await getInheritedScoreType(matchDay.match_date);

  const { data: session, error } = await supabase
    .from("schedule_sessions")
    .insert({
      match_day_id: matchDay.id,
      name: "賽程 1",
      sort_order: 0,
      score_type: scoreType,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await syncDayRosterToSession(matchDay, session.id as string);
}

function mapDbError(message: string): string {
  if (message.includes("schedule_sessions") || message.includes("session_players")) {
    return "資料表尚未建立，請在 Supabase 執行 supabase/migrations/003_schedule_sessions.sql";
  }
  return message;
}

export async function getSessionsForDate(
  matchDate: string,
): Promise<ScheduleSessionWithStats[]> {
  const matchDay = await getOrCreateMatchDay(matchDate);

  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("schedule_sessions")
    .select("*")
    .eq("match_day_id", matchDay.id)
    .order("sort_order");

  if (error) throw new Error(mapDbError(error.message));

  if (!sessions?.length) {
    await ensureDefaultSession(matchDay);
    const { data: retry, error: retryError } = await supabase
      .from("schedule_sessions")
      .select("*")
      .eq("match_day_id", matchDay.id)
      .order("sort_order");
    if (retryError) throw new Error(mapDbError(retryError.message));
    if (!retry?.length) return [];
    return buildSessionStats(retry);
  }

  await syncDayRosterToSession(matchDay, sessions[0]!.id as string);

  return buildSessionStats(sessions);
}

async function buildSessionStats(
  sessions: ScheduleSession[],
): Promise<ScheduleSessionWithStats[]> {
  if (sessions.length === 0) return [];

  const supabase = await createClient();
  const sessionIds = sessions.map((s) => s.id);

  const [{ data: rosterRows }, { data: matchRows }] = await Promise.all([
    supabase
      .from("session_players")
      .select("schedule_session_id")
      .in("schedule_session_id", sessionIds),
    supabase
      .from("matches")
      .select("schedule_session_id, status")
      .in("schedule_session_id", sessionIds),
  ]);

  const playerCountBySession = new Map<string, number>();
  for (const row of rosterRows ?? []) {
    const id = row.schedule_session_id as string;
    playerCountBySession.set(id, (playerCountBySession.get(id) ?? 0) + 1);
  }

  const matchStatsBySession = new Map<
    string,
    { total: number; completed: number }
  >();
  for (const row of matchRows ?? []) {
    const id = row.schedule_session_id as string;
    const current = matchStatsBySession.get(id) ?? { total: 0, completed: 0 };
    current.total += 1;
    if (row.status === "completed") current.completed += 1;
    matchStatsBySession.set(id, current);
  }

  return sessions.map((session) => {
    const matchStats = matchStatsBySession.get(session.id) ?? {
      total: 0,
      completed: 0,
    };
    return {
      ...session,
      score_type: normalizeScoreType(
        (session as ScheduleSession & { score_type?: unknown }).score_type,
      ),
      player_count: playerCountBySession.get(session.id) ?? 0,
      match_count: matchStats.total,
      completed_count: matchStats.completed,
    };
  });
}

export async function createSession(
  matchDate: string,
  options?: {
    name?: string;
    scoreType?: ScoreType;
  },
): Promise<ScheduleSession> {
  const matchDay = await getOrCreateMatchDay(matchDate);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("schedule_sessions")
    .select("sort_order")
    .eq("match_day_id", matchDay.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder =
    existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
  const sessionName = options?.name?.trim() || `賽程 ${nextOrder + 1}`;
  const scoreType =
    options?.scoreType ?? (await getInheritedScoreType(matchDate));

  const { data, error } = await supabase
    .from("schedule_sessions")
    .insert({
      match_day_id: matchDay.id,
      name: sessionName,
      sort_order: nextOrder,
      score_type: scoreType,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const rosterIds =
    matchDay.selected_player_ids.length > 0
      ? matchDay.selected_player_ids
      : await getInheritedRosterIds(matchDay.venue_id, matchDate);
  if (rosterIds.length > 0) {
    await seedSessionPlayers(data.id as string, rosterIds);
  }

  return data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await requireXsAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_sessions")
    .delete()
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function updateSessionScoreType(
  sessionId: string,
  scoreType: ScoreType,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_sessions")
    .update({ score_type: scoreType })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function getSessionPlayers(
  sessionId: string,
): Promise<SessionPlayer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_players")
    .select("*, player:players(*)")
    .eq("schedule_session_id", sessionId)
    .order("joined_at");

  if (error) throw new Error(error.message);
  return (data ?? []) as SessionPlayer[];
}

export async function updateSessionRoster(
  sessionId: string,
  playerIds: string[],
): Promise<void> {
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("schedule_sessions")
    .select("match_day_id")
    .eq("id", sessionId)
    .single();
  if (sessionError) throw new Error(sessionError.message);

  const { data: existing } = await supabase
    .from("session_players")
    .select("player_id, joined_after_round")
    .eq("schedule_session_id", sessionId);

  const lateJoiners = new Set(
    (existing ?? [])
      .filter((r) => r.joined_after_round > 0)
      .map((r) => r.player_id),
  );

  const toRemove = (existing ?? [])
    .filter(
      (r) =>
        r.joined_after_round === 0 && !playerIds.includes(r.player_id),
    )
    .map((r) => r.player_id);

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
    .eq("id", session.match_day_id);
  if (dayError) throw new Error(dayError.message);
}

export async function getMatchesForSession(
  sessionId: string,
): Promise<MatchWithPlayers[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `*, match_players (*, player:players (*))`,
    )
    .eq("schedule_session_id", sessionId)
    .order("round_number");

  if (error) throw new Error(error.message);
  return (data ?? []) as MatchWithPlayers[];
}

async function getNextRoundNumber(sessionId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("round_number")
    .eq("schedule_session_id", sessionId)
    .order("round_number", { ascending: false })
    .limit(1);

  return data && data.length > 0 ? data[0].round_number + 1 : 1;
}

async function getMaxCompletedRound(sessionId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("round_number")
    .eq("schedule_session_id", sessionId)
    .eq("status", "completed")
    .order("round_number", { ascending: false })
    .limit(1);

  return data && data.length > 0 ? data[0].round_number : 0;
}

async function getSessionPairings(sessionId: string): Promise<MatchPairing[]> {
  const matches = await getMatchesForSession(sessionId);
  return matches.map((m) => {
    const t1 = m.match_players
      .filter((mp) => mp.team === 1)
      .sort((a, b) => a.position - b.position);
    const t2 = m.match_players
      .filter((mp) => mp.team === 2)
      .sort((a, b) => a.position - b.position);
    return {
      round_number: m.round_number,
      team1: [t1[0].player_id, t1[1].player_id] as [string, string],
      team2: [t2[0].player_id, t2[1].player_id] as [string, string],
    };
  });
}

export async function generateMatchesForSession(
  sessionId: string,
  courtCount: number,
): Promise<void> {
  const roster = await getRoster(sessionId);
  if (roster.length < 4) {
    throw new Error("至少需要 4 位球員才能排場");
  }

  const supabase = await createClient();
  const { data: session, error: sessionError } = await supabase
    .from("schedule_sessions")
    .select("match_day_id")
    .eq("id", sessionId)
    .single();

  if (sessionError) throw new Error(sessionError.message);

  const startRound = await getNextRoundNumber(sessionId);
  const playerIds = roster.map((r) => r.player_id);
  const history = await getSessionTeammateHistory(sessionId, playerIds);
  const existingPairings = await getSessionPairings(sessionId);
  const priorPlayCount = buildPlayCountFromPairings(existingPairings);

  const pairings = generateMatchPairings(
    roster,
    courtCount,
    startRound,
    history,
    priorPlayCount,
    existingPairings,
  );

  await insertPairings(sessionId, session.match_day_id, pairings);
}

export async function addLatePlayerAndReschedule(
  sessionId: string,
  playerId: string,
  courtCount: number,
): Promise<{ joinedAfterRound: number; deletedScheduled: number }> {
  const supabase = await createClient();

  const maxCompleted = await getMaxCompletedRound(sessionId);
  const joinedAfterRound = maxCompleted;

  const { data: existing } = await supabase
    .from("session_players")
    .select("id")
    .eq("schedule_session_id", sessionId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (existing) {
    throw new Error("此球員已在賽程組中");
  }

  const { error: insertError } = await supabase.from("session_players").insert({
    schedule_session_id: sessionId,
    player_id: playerId,
    joined_after_round: joinedAfterRound,
  });
  if (insertError) throw new Error(insertError.message);

  const { data: deletedRows, error: deleteError } = await supabase
    .from("matches")
    .delete()
    .eq("schedule_session_id", sessionId)
    .eq("status", "scheduled")
    .select("id");

  if (deleteError) throw new Error(deleteError.message);

  const deletedCount = deletedRows?.length ?? 0;

  if (courtCount > 0) {
    await generateMatchesForSession(sessionId, courtCount);
  }

  await supabase.from("session_events").insert({
    schedule_session_id: sessionId,
    event_type: "player_joined_late",
    payload: {
      player_id: playerId,
      joined_after_round: joinedAfterRound,
      deleted_scheduled_count: deletedCount,
      rescheduled_courts: courtCount,
    },
  });

  return { joinedAfterRound, deletedScheduled: deletedCount };
}

export async function updateMatchScore(
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
}

export async function deleteMatch(matchId: string): Promise<void> {
  const email = await getCurrentUserEmail();
  if (isStaffRole(email)) {
    throw new Error("一般使用者無法刪除單場，請使用「清空未打」");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) throw new Error(error.message);
}

export async function clearSessionMatches(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("schedule_session_id", sessionId)
    .eq("status", "scheduled");
  if (error) throw new Error(error.message);
}

export async function createManualMatch(
  sessionId: string,
  team1PlayerIds: [string, string],
  team2PlayerIds: [string, string],
): Promise<void> {
  const supabase = await createClient();
  const { data: session, error: sessionError } = await supabase
    .from("schedule_sessions")
    .select("match_day_id")
    .eq("id", sessionId)
    .single();
  if (sessionError) throw new Error(sessionError.message);

  const existingPairings = await getSessionPairings(sessionId);
  const key = matchupKey(team1PlayerIds, team2PlayerIds);
  const duplicate = existingPairings.some(
    (p) => matchupKey(p.team1, p.team2) === key,
  );
  if (duplicate) {
    throw new Error("此 2v2 對戰組合本組已存在，請換人配對");
  }

  const roundNumber = await getNextRoundNumber(sessionId);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      match_day_id: session.match_day_id,
      schedule_session_id: sessionId,
      round_number: roundNumber,
      status: "scheduled",
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
}
