"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/types/database";

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
  dupr_id: string;
  dupr_rating?: number | null;
}): Promise<Player> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .insert({
      name: formData.name.trim(),
      dupr_id: formData.dupr_id.trim().toUpperCase(),
      dupr_rating: formData.dupr_rating ?? null,
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
    dupr_id?: string;
    active?: boolean;
    dupr_rating?: number | null;
  },
): Promise<void> {
  const supabase = await createClient();
  const payload: Record<string, unknown> = { ...formData };
  if (formData.dupr_id) {
    payload.dupr_id = formData.dupr_id.trim().toUpperCase();
  }
  if (formData.name) {
    payload.name = formData.name.trim();
  }

  const { error } = await supabase.from("players").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/players");
}

export async function deletePlayer(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/players");
}
