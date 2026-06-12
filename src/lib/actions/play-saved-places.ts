"use server";

import { revalidatePath } from "next/cache";
import { resolveBestPlace } from "@/lib/play-geocode";
import { readRuntimeEnv } from "@/lib/runtime-env";
import { createClient } from "@/lib/supabase/server";
import type { JourneySport, PlaySavedPlace } from "@/types/play-journey";

const PATH = "/play-map";

function revalidate() {
  revalidatePath(PATH);
}

export async function getSavedPlaces(): Promise<PlaySavedPlace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_saved_places")
    .select("*")
    .order("sort_order")
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("use_count", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PlaySavedPlace[];
}

export async function createSavedPlace(input: {
  label?: string;
  venue_name: string;
  address?: string;
  team_name?: string;
  sport_type?: JourneySport | null;
  latitude?: number | null;
  longitude?: number | null;
  default_duration_minutes?: number | null;
}): Promise<PlaySavedPlace> {
  const venue = input.venue_name.trim();
  if (!venue) throw new Error("請填寫地點名稱");

  const label =
    input.label?.trim() ||
    [venue, input.team_name?.trim()].filter(Boolean).join(" · ");

  let latitude = input.latitude ?? null;
  let longitude = input.longitude ?? null;
  const address = input.address?.trim() ?? "";

  if ((latitude == null || longitude == null) && address) {
    const googleApiKey = (
      await readRuntimeEnv("GOOGLE_GEOCODING_API_KEY")
    )?.trim();
    const resolved = await resolveBestPlace(address, { googleApiKey });
    if (resolved) {
      latitude = resolved.latitude;
      longitude = resolved.longitude;
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("play_saved_places")
    .insert({
      label,
      venue_name: venue,
      address,
      team_name: input.team_name?.trim() ?? "",
      sport_type: input.sport_type ?? null,
      latitude,
      longitude,
      default_duration_minutes: input.default_duration_minutes ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidate();
  return data as PlaySavedPlace;
}

export async function updateSavedPlace(
  id: string,
  input: Partial<{
    label: string;
    venue_name: string;
    address: string;
    team_name: string;
    sport_type: JourneySport | null;
    latitude: number | null;
    longitude: number | null;
    default_duration_minutes: number | null;
    sort_order: number;
  }>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("play_saved_places")
    .update(input)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidate();
}

export async function deleteSavedPlace(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("play_saved_places")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidate();
}

export async function touchSavedPlace(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("play_saved_places")
    .select("use_count")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return;

  await supabase
    .from("play_saved_places")
    .update({
      use_count: (existing.use_count ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidate();
}
