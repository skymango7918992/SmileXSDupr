"use server";

import { revalidatePath } from "next/cache";
import { canDeleteMatches } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  normalizePlayerAvatarGender,
  type PlayerAvatarGender,
} from "@/lib/cultivation-tiers";
import type { KhpaPlayer } from "@/types/khpa";

function revalidateKhpaPlayers() {
  revalidatePath("/");
}

function validateDuprId(duprId: string): string {
  const trimmed = duprId.trim();
  if (!trimmed) throw new Error("請輸入 DUPR ID");
  return trimmed;
}

function normalizePlayer(row: KhpaPlayer): KhpaPlayer {
  return {
    ...row,
    name: row.name?.trim() || row.display_name,
    source: row.source ?? "manual",
    display_name_customized: row.display_name_customized ?? false,
    dupr_rating: row.dupr_rating ?? null,
    avatar_gender: normalizePlayerAvatarGender(row.avatar_gender),
  };
}

export async function getKhpaPlayers(activeOnly = true): Promise<KhpaPlayer[]> {
  const supabase = await createClient();
  let query = supabase
    .from("khpa_players")
    .select("*")
    .order("active", { ascending: false })
    .order("display_name");

  if (activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as KhpaPlayer[]).map(normalizePlayer);
}

/** 球員管理頁：含停用球員 */
export async function getKhpaAllPlayers(): Promise<KhpaPlayer[]> {
  return getKhpaPlayers(false);
}

export async function createKhpaPlayer(formData: {
  name?: string;
  display_name: string;
  dupr_id: string;
  active?: boolean;
  dupr_rating?: number | null;
  avatar_gender?: PlayerAvatarGender | null;
}): Promise<KhpaPlayer> {
  const supabase = await createClient();
  const displayName = formData.display_name.trim();
  const name = formData.name?.trim() || displayName;
  if (!name) throw new Error("請輸入球員姓名");
  const duprId = validateDuprId(formData.dupr_id);

  const { data, error } = await supabase
    .from("khpa_players")
    .insert({
      name,
      display_name: displayName || name,
      display_name_customized: (displayName || name) !== name,
      dupr_id: duprId,
      dupr_rating: formData.dupr_rating ?? null,
      ...(formData.avatar_gender
        ? { avatar_gender: formData.avatar_gender }
        : {}),
      source: "manual",
      active: formData.active !== false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateKhpaPlayers();
  return normalizePlayer(data as KhpaPlayer);
}

export async function updateKhpaPlayer(
  id: string,
  formData: {
    display_name?: string;
    name?: string;
    dupr_id?: string;
    active?: boolean;
    dupr_rating?: number | null;
    display_name_customized?: boolean;
    avatar_gender?: PlayerAvatarGender | null;
  },
): Promise<void> {
  const supabase = await createClient();

  const { data: current, error: loadError } = await supabase
    .from("khpa_players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!current) throw new Error("找不到球員");

  const player = normalizePlayer(current as KhpaPlayer);
  const isClub = player.source === "club";
  const patch: Record<string, unknown> = {};

  if (formData.active != null) patch.active = formData.active;
  if (formData.avatar_gender !== undefined) {
    patch.avatar_gender = normalizePlayerAvatarGender(formData.avatar_gender);
  }

  if (isClub) {
    if (formData.display_name != null) {
      const displayName = formData.display_name.trim();
      if (!displayName) throw new Error("請輸入顯示名稱");
      patch.display_name = displayName;
      patch.display_name_customized =
        formData.display_name_customized ??
        displayName !== player.name;
    }
  } else {
    const name = (formData.name ?? formData.display_name)?.trim();
    if (name != null) {
      if (!name) throw new Error("請輸入球員姓名");
      patch.name = name;
      patch.display_name = formData.display_name?.trim() || name;
      patch.display_name_customized =
        patch.display_name !== patch.name;
    }
    if (formData.dupr_id != null) {
      patch.dupr_id = validateDuprId(formData.dupr_id);
    }
    if (formData.dupr_rating !== undefined) {
      patch.dupr_rating = formData.dupr_rating;
    }
  }

  const { error } = await supabase.from("khpa_players").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateKhpaPlayers();
}

export async function deleteKhpaPlayer(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!canDeleteMatches(user?.email)) {
    throw new Error("僅系統管理員可刪除球員");
  }

  const { error } = await supabase.from("khpa_players").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateKhpaPlayers();
}
