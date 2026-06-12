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
  return data;
}

export async function updateSettings(formData: {
  team_name: string;
  default_court_count: number;
  trusted_device_days: number;
}): Promise<void> {
  const supabase = await createClient();
  const existing = await getSettings();

  if (existing) {
    const { error } = await supabase
      .from("app_settings")
      .update({
        team_name: formData.team_name.trim(),
        default_court_count: formData.default_court_count,
        trusted_device_days: clampTrustedDeviceDays(formData.trusted_device_days),
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("app_settings").insert({
      team_name: formData.team_name.trim(),
      default_court_count: formData.default_court_count,
      trusted_device_days: clampTrustedDeviceDays(formData.trusted_device_days),
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/settings");
}
