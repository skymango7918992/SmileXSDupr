"use server";

import { revalidatePath } from "next/cache";
import { requireXsAdmin } from "@/lib/auth/require-xs-admin";
import { isStaffRole } from "@/lib/auth/roles";
import { removePlayerRecord } from "@/lib/actions/player-merge";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/types/database";

export type DeletePlayerResult = {
  action: "deleted" | "merged" | "deactivated";
};

export async function getPlayers(activeOnly = false): Promise<Player[]> {
  const supabase = await createClient();
  let query = supabase.from("players").select("*").order("name");

  if (activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPlayer(formData: {
  name: string;
  display_name?: string;
  dupr_id: string;
  dupr_rating?: number | null;
}): Promise<Player> {
  await requireXsAdmin();
  const supabase = await createClient();
  const duprName = formData.name.trim();
  const displayName = formData.display_name?.trim() || duprName;
  const customized = displayName !== duprName;

  const { data, error } = await supabase
    .from("players")
    .insert({
      name: duprName,
      display_name: displayName,
      display_name_customized: customized,
      dupr_id: formData.dupr_id.trim().toUpperCase(),
      dupr_rating: formData.dupr_rating ?? null,
      source: "manual",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/players");
  return data;
}

export async function updatePlayer(
  id: string,
  formData: {
    name?: string;
    display_name?: string;
    display_name_customized?: boolean;
    dupr_id?: string;
    active?: boolean;
    dupr_rating?: number | null;
  },
): Promise<void> {
  await requireXsAdmin();
  const supabase = await createClient();
  const payload: Record<string, unknown> = { ...formData };
  if (formData.dupr_id) {
    payload.dupr_id = formData.dupr_id.trim().toUpperCase();
  }
  if (formData.name) {
    payload.name = formData.name.trim();
  }
  if (formData.display_name !== undefined) {
    payload.display_name = formData.display_name.trim();
  }

  const { error } = await supabase.from("players").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/players");
}

export async function deletePlayer(id: string): Promise<DeletePlayerResult> {
  await requireXsAdmin();
  const supabase = await createClient();

  const { data: player, error: loadError } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .single();

  if (loadError || !player) {
    throw new Error(loadError?.message ?? "找不到球員");
  }

  const { data: allPlayers } = await supabase.from("players").select("*");
  const action = await removePlayerRecord(
    supabase,
    player as Player,
    (allPlayers ?? []) as Player[],
  );

  revalidatePath("/");
  revalidatePath("/players");
  return { action };
}
