"use server";

import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/auth/roles";
import { computeRecordXp } from "@/lib/cultivation-journey-xp";
import {
  calculateTechniqueExp,
  getProficiencyLevel,
  getProficiencyLevelName,
  getTechniqueById,
  PICKLEBALL_TECHNIQUES,
  TECHNIQUE_IDS,
} from "@/lib/pickleball-techniques";
import { createClient } from "@/lib/supabase/server";
import type {
  CreatePracticeSessionResult,
  PracticeLocationOption,
  PracticeSession,
  PracticeTechniqueLog,
  TechniqueLogWithSession,
  TechniqueProgress,
} from "@/types/technique-practice";

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

export async function getPracticeLocations(): Promise<PracticeLocationOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xs_venues")
    .select("id, name, slug")
    .eq("active", true)
    .order("sort_order");

  if (error) return [{ id: "custom", name: "其他地點" }];
  const venues = (data ?? []).map((v) => ({
    id: v.slug as string,
    name: v.name as string,
  }));
  return [...venues, { id: "custom", name: "其他地點" }];
}

export async function getTechniqueProgressList(): Promise<TechniqueProgress[]> {
  const { supabase, user } = await requireAdminUser();
  const { data, error } = await supabase
    .from("technique_progress")
    .select("*")
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  const map = new Map(
    (data ?? []).map((row) => [row.technique_id as string, row as TechniqueProgress]),
  );

  return TECHNIQUE_IDS.map((techniqueId) => {
    const existing = map.get(techniqueId);
    if (existing) return existing;
    return {
      user_id: user.id,
      technique_id: techniqueId,
      proficiency_score: 0,
      proficiency_level: "minor_success",
      total_practice_count: 0,
      total_practice_minutes: 0,
      last_practiced_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

export async function getTechniqueLogs(
  techniqueId: string,
): Promise<TechniqueLogWithSession[]> {
  const { supabase, user } = await requireAdminUser();

  const { data: logs, error } = await supabase
    .from("practice_technique_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("technique_id", techniqueId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  if (!logs?.length) return [];

  const sessionIds = [...new Set(logs.map((l) => l.practice_session_id as string))];
  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("id, practice_date, location_name, duration_minutes, note")
    .in("id", sessionIds);

  const sessionMap = new Map(
    (sessions ?? []).map((s) => [s.id as string, s]),
  );

  return (logs as PracticeTechniqueLog[]).map((log) => {
    const session = sessionMap.get(log.practice_session_id);
    return {
      ...log,
      practice_date: session?.practice_date ?? "",
      location_name: session?.location_name ?? "",
      duration_minutes: session?.duration_minutes ?? 0,
      session_note: session?.note ?? "",
    };
  });
}

export async function createPracticeSession(input: {
  practiceDate: string;
  locationId: string;
  locationName: string;
  durationMinutes: number;
  techniqueIds: string[];
  selfRating?: number;
  hasImprovement?: boolean;
  note?: string;
  mood?: string;
}): Promise<CreatePracticeSessionResult> {
  const { supabase, user } = await requireAdminUser();

  const techniqueIds = [...new Set(input.techniqueIds)];
  if (techniqueIds.length < 1) {
    throw new Error("請至少選擇 1 項本次閉關功法。");
  }
  if (techniqueIds.length > 3) {
    throw new Error("每次閉關最多選擇 3 項功法，請專心修煉，切勿貪多。");
  }
  if (input.durationMinutes <= 0) {
    throw new Error("請輸入有效練習時間");
  }
  for (const id of techniqueIds) {
    if (!TECHNIQUE_IDS.includes(id)) {
      throw new Error(`未知功法：${id}`);
    }
  }
  if (
    input.selfRating != null &&
    (input.selfRating < 1 || input.selfRating > 5)
  ) {
    throw new Error("自我評分請介於 1～5");
  }

  const gainedExp = calculateTechniqueExp({
    durationMinutes: input.durationMinutes,
    hasNote: Boolean(input.note?.trim()),
    hasImprovement: Boolean(input.hasImprovement),
    selfRating: input.selfRating,
  });

  const { total: realmXp, breakdown } = computeRecordXp("retreat", {
    durationMinutes: input.durationMinutes,
  });

  const { data: cultivationRecord, error: cultError } = await supabase
    .from("cultivation_records")
    .insert({
      user_id: user.id,
      record_type: "retreat",
      occurred_on: input.practiceDate,
      venue_name: input.locationName.trim(),
      duration_minutes: input.durationMinutes,
      practice_skills: techniqueIds,
      self_rating: input.selfRating ?? null,
      notes: input.note?.trim() ?? "",
      xp_earned: realmXp,
      xp_breakdown: breakdown,
    })
    .select("id")
    .single();

  if (cultError) throw new Error(cultError.message);

  const { data: session, error: sessionError } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      practice_date: input.practiceDate,
      location_id: input.locationId,
      location_name: input.locationName.trim(),
      duration_minutes: input.durationMinutes,
      technique_ids: techniqueIds,
      self_rating: input.selfRating ?? null,
      has_improvement: Boolean(input.hasImprovement),
      note: input.note?.trim() ?? "",
      mood: input.mood ?? null,
      cultivation_record_id: cultivationRecord.id,
    })
    .select("*")
    .single();

  if (sessionError) throw new Error(sessionError.message);

  const techniqueLogs: PracticeTechniqueLog[] = [];
  const levelUps: CreatePracticeSessionResult["levelUps"] = [];
  const gainedPerTechnique: CreatePracticeSessionResult["gainedPerTechnique"] =
    [];
  const now = new Date().toISOString();

  for (const techniqueId of techniqueIds) {
    const { data: existing } = await supabase
      .from("technique_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("technique_id", techniqueId)
      .maybeSingle();

    const beforeScore = (existing?.proficiency_score as number) ?? 0;
    const beforeLevel = getProficiencyLevel(beforeScore);
    const afterScore = Math.min(100, beforeScore + gainedExp);
    const afterLevel = getProficiencyLevel(afterScore);
    const isLevelUp = beforeLevel !== afterLevel;

    const technique = getTechniqueById(techniqueId)!;

    const { data: log, error: logError } = await supabase
      .from("practice_technique_logs")
      .insert({
        practice_session_id: session.id,
        user_id: user.id,
        technique_id: techniqueId,
        gained_exp: gainedExp,
        before_score: beforeScore,
        after_score: afterScore,
        before_level: beforeLevel,
        after_level: afterLevel,
        is_level_up: isLevelUp,
        note: input.note?.trim() || null,
      })
      .select("*")
      .single();

    if (logError) throw new Error(logError.message);
    techniqueLogs.push(log as PracticeTechniqueLog);

    gainedPerTechnique.push({
      techniqueId,
      techniqueName: technique.name,
      gainedExp,
    });

    if (isLevelUp) {
      levelUps.push({
        techniqueId,
        techniqueName: technique.name,
        beforeLevel: getProficiencyLevelName(beforeLevel),
        afterLevel: getProficiencyLevelName(afterLevel),
        afterScore,
      });
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("technique_progress")
        .update({
          proficiency_score: afterScore,
          proficiency_level: afterLevel,
          total_practice_count: (existing.total_practice_count as number) + 1,
          total_practice_minutes:
            (existing.total_practice_minutes as number) + input.durationMinutes,
          last_practiced_at: now,
        })
        .eq("user_id", user.id)
        .eq("technique_id", techniqueId);
      if (updateError) throw new Error(updateError.message);
    } else {
      const { error: insertError } = await supabase
        .from("technique_progress")
        .insert({
          user_id: user.id,
          technique_id: techniqueId,
          proficiency_score: afterScore,
          proficiency_level: afterLevel,
          total_practice_count: 1,
          total_practice_minutes: input.durationMinutes,
          last_practiced_at: now,
        });
      if (insertError) throw new Error(insertError.message);
    }
  }

  revalidate();

  return {
    practiceSession: session as PracticeSession,
    techniqueLogs,
    levelUps,
    gainedPerTechnique,
    realmXpEarned: realmXp,
  };
}
