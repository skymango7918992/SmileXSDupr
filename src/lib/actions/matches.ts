"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateMatchPairings } from "@/lib/scheduler";
import type { MatchDay, MatchWithPlayers } from "@/types/database";

async function getOrCreateMatchDay(matchDate: string): Promise<MatchDay> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("match_days")
    .select("*")
    .eq("match_date", matchDate)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("match_days")
    .insert({ match_date: matchDate, selected_player_ids: [] })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
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

export async function updateSelectedPlayers(
  matchDate: string,
  playerIds: string[],
): Promise<void> {
  const matchDay = await getOrCreateMatchDay(matchDate);
  const supabase = await createClient();

  const { error } = await supabase
    .from("match_days")
    .update({ selected_player_ids: playerIds })
    .eq("id", matchDay.id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function getMatchesForDate(
  matchDate: string,
): Promise<MatchWithPlayers[]> {
  const supabase = await createClient();
  const matchDay = await getMatchDay(matchDate);
  if (!matchDay) return [];

  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      *,
      match_players (
        *,
        player:players (*)
      )
    `,
    )
    .eq("match_day_id", matchDay.id)
    .order("round_number");

  if (error) throw new Error(error.message);
  return (data ?? []) as MatchWithPlayers[];
}

export async function generateMatches(
  matchDate: string,
  playerIds: string[],
  courtCount: number,
): Promise<void> {
  if (playerIds.length < 4) {
    throw new Error("至少需要 4 位球員才能排場");
  }

  const matchDay = await getOrCreateMatchDay(matchDate);
  const supabase = await createClient();

  const { data: existingMatches } = await supabase
    .from("matches")
    .select("round_number")
    .eq("match_day_id", matchDay.id)
    .order("round_number", { ascending: false })
    .limit(1);

  const startRound =
    existingMatches && existingMatches.length > 0
      ? existingMatches[0].round_number + 1
      : 1;

  const pairings = generateMatchPairings(playerIds, courtCount, startRound);

  for (const pairing of pairings) {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        match_day_id: matchDay.id,
        round_number: pairing.round_number,
        status: "scheduled",
      })
      .select()
      .single();

    if (matchError) throw new Error(matchError.message);

    const matchPlayers = [
      { match_id: match.id, player_id: pairing.team1[0], team: 1, position: 1 },
      { match_id: match.id, player_id: pairing.team1[1], team: 1, position: 2 },
      { match_id: match.id, player_id: pairing.team2[0], team: 2, position: 1 },
      { match_id: match.id, player_id: pairing.team2[1], team: 2, position: 2 },
    ];

    const { error: playersError } = await supabase
      .from("match_players")
      .insert(matchPlayers);

    if (playersError) throw new Error(playersError.message);
  }

  await supabase
    .from("match_days")
    .update({ selected_player_ids: playerIds })
    .eq("id", matchDay.id);

  revalidatePath("/");
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
  revalidatePath("/");
}

export async function deleteMatch(matchId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function clearMatchesForDate(matchDate: string): Promise<void> {
  const matchDay = await getMatchDay(matchDate);
  if (!matchDay) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("match_day_id", matchDay.id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function createManualMatch(
  matchDate: string,
  team1PlayerIds: [string, string],
  team2PlayerIds: [string, string],
): Promise<void> {
  const matchDay = await getOrCreateMatchDay(matchDate);
  const supabase = await createClient();

  const { data: existingMatches } = await supabase
    .from("matches")
    .select("round_number")
    .eq("match_day_id", matchDay.id)
    .order("round_number", { ascending: false })
    .limit(1);

  const roundNumber =
    existingMatches && existingMatches.length > 0
      ? existingMatches[0].round_number + 1
      : 1;

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      match_day_id: matchDay.id,
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
  revalidatePath("/");
}
