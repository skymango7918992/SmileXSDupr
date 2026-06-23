"use server";

import { revalidatePath } from "next/cache";
import { canDeleteMatches, isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { ScoreType } from "@/types/database";
import type { KhpaMatchDay, KhpaMatchWithPlayers } from "@/types/khpa";

const DAILY_SESSION_NAME = "今日對戰";

const MATCH_SELECT = `
  *,
  khpa_match_players(
    *,
    player:khpa_players(*)
  )
`;

async function getAuthEmail(): Promise<string | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email;
}

async function getOrCreateMatchDay(
  venueId: string,
  matchDate: string,
): Promise<KhpaMatchDay> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("khpa_match_days")
    .select("*")
    .eq("venue_id", venueId)
    .eq("match_date", matchDate)
    .maybeSingle();

  if (existing) return existing as KhpaMatchDay;

  const { data, error } = await supabase
    .from("khpa_match_days")
    .insert({ venue_id: venueId, match_date: matchDate })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as KhpaMatchDay;
}

/** 每日隱藏一個賽程容器，不在 UI 顯示 */
async function getOrCreateDailySession(
  venueId: string,
  matchDate: string,
): Promise<string> {
  const supabase = await createClient();
  const day = await getOrCreateMatchDay(venueId, matchDate);

  const { data: existing } = await supabase
    .from("khpa_schedule_sessions")
    .select("id")
    .eq("match_day_id", day.id)
    .eq("name", DAILY_SESSION_NAME)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from("khpa_schedule_sessions")
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
    .from("khpa_match_days")
    .select("id")
    .eq("venue_id", venueId)
    .eq("match_date", matchDate)
    .maybeSingle();

  if (!day) return [];

  const { data: sessions, error } = await supabase
    .from("khpa_schedule_sessions")
    .select("id")
    .eq("match_day_id", day.id);

  if (error) throw new Error(error.message);
  return (sessions ?? []).map((s) => s.id as string);
}

async function getNextRoundNumber(sessionId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("khpa_matches")
    .select("round_number")
    .eq("schedule_session_id", sessionId)
    .order("round_number", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.[0]?.round_number ?? 0) + 1;
}

export async function getKhpaMatchesForDate(
  venueId: string,
  matchDate: string,
): Promise<KhpaMatchWithPlayers[]> {
  const sessionIds = await getSessionIdsForDate(venueId, matchDate);
  if (sessionIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("khpa_matches")
    .select(MATCH_SELECT)
    .in("schedule_session_id", sessionIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as KhpaMatchWithPlayers[];
}

export async function createKhpaMatchWithScore(
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
  const roundNumber = await getNextRoundNumber(sessionId);

  const { data: match, error: matchError } = await supabase
    .from("khpa_matches")
    .insert({
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

  const { error: playersError } = await supabase
    .from("khpa_match_players")
    .insert([
      { match_id: match.id, player_id: team1PlayerIds[0], team: 1, position: 1 },
      { match_id: match.id, player_id: team1PlayerIds[1], team: 1, position: 2 },
      { match_id: match.id, player_id: team2PlayerIds[0], team: 2, position: 1 },
      { match_id: match.id, player_id: team2PlayerIds[1], team: 2, position: 2 },
    ]);

  if (playersError) throw new Error(playersError.message);
}

export async function deleteKhpaMatch(matchId: string): Promise<void> {
  const email = await getAuthEmail();
  if (!canDeleteMatches(email)) {
    throw new Error("僅系統管理員可刪除對戰紀錄");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("khpa_matches").delete().eq("id", matchId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function getKhpaCanDelete(): Promise<boolean> {
  const email = await getAuthEmail();
  return isAdminRole(email);
}

export async function ensureKhpaMatchDay(
  venueId: string,
  matchDate: string,
): Promise<KhpaMatchDay> {
  return getOrCreateMatchDay(venueId, matchDate);
}
