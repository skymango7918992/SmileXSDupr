"use server";

import { revalidatePath } from "next/cache";
import { clampTrustedDeviceDays } from "@/lib/trusted-device";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/types/database";

export async function getSettings(): Promise<AppSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    ...data,
    xs_dupr_club_id: data.xs_dupr_club_id?.trim() || "4668804565",
    khpa_dupr_club_id: data.khpa_dupr_club_id?.trim() ?? "",
  };
}

export async function updateSettings(formData: {
  team_name: string;
  default_court_count: number;
  trusted_device_days: number;
  xs_dupr_club_id: string;
  khpa_dupr_club_id: string;
}): Promise<void> {
  const supabase = await createClient();
  const existing = await getSettings();
  const xsClubId = formData.xs_dupr_club_id.trim() || "4668804565";
  const khpaClubId = formData.khpa_dupr_club_id.trim();

  const payload = {
    team_name: formData.team_name.trim(),
    default_court_count: formData.default_court_count,
    trusted_device_days: clampTrustedDeviceDays(formData.trusted_device_days),
    xs_dupr_club_id: xsClubId,
    khpa_dupr_club_id: khpaClubId,
  };

  if (existing) {
    const { error } = await supabase
      .from("app_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("app_settings").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/players");
}
