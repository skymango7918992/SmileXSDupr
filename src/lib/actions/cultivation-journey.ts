"use server";

import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/auth/roles";
import { computeRecordXp, computeRecordXpFromRow } from "@/lib/cultivation-journey-xp";
import { normalizePlayerAvatarGender } from "@/lib/cultivation-tiers";
import { ADMIN_MANAGER_DUPR_ID } from "@/types/cultivation-journey";
import { createClient } from "@/lib/supabase/server";
import type {
  CultivationDemonId,
  CultivationJourneyBundle,
  CultivationMatchResult,
  CultivationProfile,
  CultivationRecord,
} from "@/types/cultivation-journey";

const PATH = "/cultivation";

function revalidate() {
  revalidatePath(PATH);
  revalidatePath("/play-map");
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminRole(user.email)) {
    throw new Error("僅管理員可使用修行軌跡");
  }
  return { supabase, user };
}

async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<CultivationProfile> {
  const { data: existing } = await supabase
    .from("cultivation_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing as CultivationProfile;

  const { data, error } = await supabase
    .from("cultivation_profiles")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as CultivationProfile;
}

function deriveResult(
  myTeam: 1 | 2,
  team1Score: number,
  team2Score: number,
): CultivationMatchResult {
  if (team1Score === team2Score) return "draw";
  const myScore = myTeam === 1 ? team1Score : team2Score;
  const oppScore = myTeam === 1 ? team2Score : team1Score;
  return myScore > oppScore ? "win" : "loss";
}

async function refreshCultivationRecordXp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  records: CultivationRecord[],
): Promise<{ records: CultivationRecord[]; totalXp: number }> {
  let totalXp = 0;
  const refreshed: CultivationRecord[] = [];

  for (const record of records) {
    const { total, breakdown } = computeRecordXpFromRow(record);
    totalXp += total;

    const breakdownJson = breakdown as CultivationRecord["xp_breakdown"];
    const needsUpdate =
      total !== record.xp_earned ||
      JSON.stringify(record.xp_breakdown) !== JSON.stringify(breakdownJson);

    if (needsUpdate) {
      const { error } = await supabase
        .from("cultivation_records")
        .update({ xp_earned: total, xp_breakdown: breakdownJson })
        .eq("id", record.id);
      if (error) throw new Error(error.message);
      refreshed.push({ ...record, xp_earned: total, xp_breakdown: breakdownJson });
    } else {
      refreshed.push(record);
    }
  }

  return { records: refreshed, totalXp };
}

export async function getCultivationJourney(): Promise<CultivationJourneyBundle> {
  const { supabase, user } = await requireAdminUser();
  const profile = await ensureProfile(supabase, user.id);

  const { data, error } = await supabase
    .from("cultivation_records")
    .select("*")
    .eq("user_id", user.id)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(error.message);
  const rawRecords = (data ?? []) as CultivationRecord[];
  const { records, totalXp } = await refreshCultivationRecordXp(supabase, rawRecords);

  const { data: playerRow } = await supabase
    .from("xs_players")
    .select("avatar_gender, dupr_rating")
    .eq("dupr_id", ADMIN_MANAGER_DUPR_ID)
    .maybeSingle();

  const avatarGender = normalizePlayerAvatarGender(playerRow?.avatar_gender);
  const duprRating =
    playerRow?.dupr_rating != null ? Number(playerRow.dupr_rating) : null;

  return { profile, records, totalXp, avatarGender, duprRating };
}

export async function createSparringRecord(input: {
  occurred_on: string;
  venue_name: string;
  team1_score: number;
  team2_score: number;
  my_team: 1 | 2;
  notes?: string;
}): Promise<void> {
  const { supabase, user } = await requireAdminUser();
  const result = deriveResult(
    input.my_team,
    input.team1_score,
    input.team2_score,
  );
  const { total, breakdown } = computeRecordXp("sparring", {
    result,
    source: "manual",
  });

  const { error } = await supabase.from("cultivation_records").insert({
    user_id: user.id,
    record_type: "sparring",
    occurred_on: input.occurred_on,
    venue_name: input.venue_name.trim(),
    team1_score: input.team1_score,
    team2_score: input.team2_score,
    my_team: input.my_team,
    result,
    notes: input.notes?.trim() ?? "",
    xp_earned: total,
    xp_breakdown: breakdown,
    source: "manual",
  });

  if (error) throw new Error(error.message);
  revalidate();
}

export async function createTrialRecord(input: {
  occurred_on: string;
  venue_name: string;
  trial_wins: number;
  trial_losses: number;
  notes?: string;
}): Promise<void> {
  const { supabase, user } = await requireAdminUser();
  const { total, breakdown } = computeRecordXp("trial", {
    trialWins: input.trial_wins,
    trialLosses: input.trial_losses,
  });

  const { error } = await supabase.from("cultivation_records").insert({
    user_id: user.id,
    record_type: "trial",
    occurred_on: input.occurred_on,
    venue_name: input.venue_name.trim(),
    trial_wins: input.trial_wins,
    trial_losses: input.trial_losses,
    notes: input.notes?.trim() ?? "",
    xp_earned: total,
    xp_breakdown: breakdown,
    source: "manual",
  });

  if (error) throw new Error(error.message);
  revalidate();
}

export async function deleteCultivationRecord(id: string): Promise<void> {
  const { supabase, user } = await requireAdminUser();
  const { error } = await supabase
    .from("cultivation_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidate();
}

export async function updateCultivationDemons(input: {
  active_demons: CultivationDemonId[];
  conquered_demons: CultivationDemonId[];
}): Promise<void> {
  const { supabase, user } = await requireAdminUser();
  await ensureProfile(supabase, user.id);
  const { error } = await supabase
    .from("cultivation_profiles")
    .update({
      active_demons: input.active_demons,
      conquered_demons: input.conquered_demons,
    })
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidate();
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function syncDuprSparringRecords(): Promise<{
  imported: number;
  skipped: number;
}> {
  const { supabase, user } = await requireAdminUser();

  const { data: existing } = await supabase
    .from("cultivation_records")
    .select("source_match_id, source")
    .eq("user_id", user.id)
    .not("source_match_id", "is", null);

  const importedKeys = new Set(
    (existing ?? []).map((r) => `${r.source}:${r.source_match_id}`),
  );

  let imported = 0;
  let skipped = 0;

  const { data: xsMatches, error: xsError } = await supabase
    .from("matches")
    .select(
      `
      id, team1_score, team2_score, status, created_at,
      match_day:match_days (match_date),
      match_players (team, player:players (dupr_id))
    `,
    )
    .eq("status", "completed");

  if (xsError) throw new Error(xsError.message);

  for (const match of xsMatches ?? []) {
    const key = `xs_dupr:${match.id}`;
    if (importedKeys.has(key)) {
      skipped++;
      continue;
    }
    const players = (match.match_players ?? []) as unknown as {
      team: number;
      player: { dupr_id: string } | { dupr_id: string }[] | null;
    }[];
    const myRow = players.find((p) => {
      const player = unwrapRelation(p.player);
      return player?.dupr_id?.toUpperCase() === ADMIN_MANAGER_DUPR_ID;
    });
    if (!myRow) continue;

    const team1 = match.team1_score as number;
    const team2 = match.team2_score as number;
    if (team1 == null || team2 == null) continue;

    const myTeam = myRow.team as 1 | 2;
    const result = deriveResult(myTeam, team1, team2);
    const { total, breakdown } = computeRecordXp("sparring", {
      result,
      source: "xs_dupr",
    });
    const matchDay = unwrapRelation(
      match.match_day as { match_date: string } | { match_date: string }[] | null,
    );

    const { error } = await supabase.from("cultivation_records").insert({
      user_id: user.id,
      record_type: "sparring",
      occurred_on: matchDay?.match_date ?? match.created_at.slice(0, 10),
      venue_name: "星鑽 XS",
      team1_score: team1,
      team2_score: team2,
      my_team: myTeam,
      result,
      notes: "自動匯入 DUPR 對戰",
      source: "xs_dupr",
      source_match_id: match.id,
      source_platform: "xs",
      xp_earned: total,
      xp_breakdown: breakdown,
    });

    if (error) {
      if (error.message.includes("cultivation_records_import_unique")) {
        skipped++;
        continue;
      }
      throw new Error(error.message);
    }
    imported++;
    importedKeys.add(key);
  }

  const { data: khpaMatches, error: khpaError } = await supabase
    .from("khpa_matches")
    .select(
      `
      id, team1_score, team2_score, status, created_at,
      session:khpa_schedule_sessions (
        match_day:khpa_match_days (match_date),
        venue:khpa_venues (name)
      ),
      khpa_match_players (team, player:khpa_players (dupr_id))
    `,
    )
    .eq("status", "completed");

  if (khpaError) throw new Error(khpaError.message);

  for (const match of khpaMatches ?? []) {
    const key = `khpa_dupr:${match.id}`;
    if (importedKeys.has(key)) {
      skipped++;
      continue;
    }
    const players = (match.khpa_match_players ?? []) as unknown as {
      team: number;
      player: { dupr_id: string } | { dupr_id: string }[] | null;
    }[];
    const myRow = players.find((p) => {
      const player = unwrapRelation(p.player);
      return player?.dupr_id?.toUpperCase() === ADMIN_MANAGER_DUPR_ID;
    });
    if (!myRow) continue;

    const team1 = match.team1_score as number;
    const team2 = match.team2_score as number;
    if (team1 == null || team2 == null) continue;

    const myTeam = myRow.team as 1 | 2;
    const result = deriveResult(myTeam, team1, team2);
    const { total, breakdown } = computeRecordXp("sparring", {
      result,
      source: "khpa_dupr",
    });

    const session = unwrapRelation(
      match.session as
        | {
            match_day: { match_date: string } | { match_date: string }[] | null;
            venue: { name: string } | { name: string }[] | null;
          }
        | {
            match_day: { match_date: string } | { match_date: string }[] | null;
            venue: { name: string } | { name: string }[] | null;
          }[]
        | null,
    );
    const matchDay = unwrapRelation(session?.match_day ?? null);
    const venue = unwrapRelation(session?.venue ?? null);

    const { error } = await supabase.from("cultivation_records").insert({
      user_id: user.id,
      record_type: "sparring",
      occurred_on:
        matchDay?.match_date ?? match.created_at.slice(0, 10),
      venue_name: venue?.name ?? "協會",
      team1_score: team1,
      team2_score: team2,
      my_team: myTeam,
      result,
      notes: "自動匯入 DUPR 對戰（協會）",
      source: "khpa_dupr",
      source_match_id: match.id,
      source_platform: "khpa",
      xp_earned: total,
      xp_breakdown: breakdown,
    });

    if (error) {
      if (error.message.includes("cultivation_records_import_unique")) {
        skipped++;
        continue;
      }
      throw new Error(error.message);
    }
    imported++;
    importedKeys.add(key);
  }

  revalidate();
  return { imported, skipped };
}
