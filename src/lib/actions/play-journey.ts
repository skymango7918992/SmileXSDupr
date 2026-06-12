"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JourneySport, PlaySession } from "@/types/play-journey";

const PATH = "/play-map";

function revalidate() {
  revalidatePath(PATH);
}

export async function getPlaySessions(limit = 500): Promise<PlaySession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_sessions")
    .select("*")
    .order("played_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as PlaySession[];
}

export async function createPlaySession(input: {
  played_on: string;
  sport_type: JourneySport;
  start_time?: string;
  duration_minutes: number;
  venue_name: string;
  team_name?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<PlaySession> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_sessions")
    .insert({
      played_on: input.played_on,
      sport_type: input.sport_type,
      start_time: input.start_time || null,
      duration_minutes: input.duration_minutes,
      venue_name: input.venue_name.trim(),
      team_name: input.team_name?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidate();
  return data as PlaySession;
}

export async function deletePlaySession(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("play_sessions").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidate();
}
