"use server";

import { revalidatePath } from "next/cache";
import { canDeleteMatches } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { KhpaPlayer } from "@/types/khpa";

function revalidateKhpaPlayers() {
  revalidatePath("/khpa");
}

function validateDuprId(duprId: string): string {
  const trimmed = duprId.trim();
  if (!trimmed) throw new Error("請輸入 DUPR ID");
  return trimmed;
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
  return (data ?? []) as KhpaPlayer[];
}

/** 球員管理頁：含停用球員 */
export async function getKhpaAllPlayers(): Promise<KhpaPlayer[]> {
  return getKhpaPlayers(false);
}

export async function createKhpaPlayer(formData: {
  display_name: string;
  dupr_id: string;
  active?: boolean;
}): Promise<KhpaPlayer> {
  const supabase = await createClient();
  const name = formData.display_name.trim();
  if (!name) throw new Error("請輸入球員姓名");
  const duprId = validateDuprId(formData.dupr_id);

  const { data, error } = await supabase
    .from("khpa_players")
    .insert({
      display_name: name,
      dupr_id: duprId,
      active: formData.active !== false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateKhpaPlayers();
  return data as KhpaPlayer;
}

export async function updateKhpaPlayer(
  id: string,
  formData: { display_name: string; dupr_id: string; active: boolean },
): Promise<void> {
  const supabase = await createClient();
  const name = formData.display_name.trim();
  if (!name) throw new Error("請輸入球員姓名");
  const duprId = validateDuprId(formData.dupr_id);

  const { error } = await supabase
    .from("khpa_players")
    .update({
      display_name: name,
      dupr_id: duprId,
      active: formData.active,
    })
    .eq("id", id);

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
