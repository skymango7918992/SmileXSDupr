import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TRUSTED_DEVICE_COOKIE,
  hashDeviceToken,
} from "@/lib/trusted-device";

/** 檢查此瀏覽器是否為已信任裝置（middleware 用） */
export async function hasValidTrustedDevice(
  supabase: SupabaseClient,
  userId: string,
  deviceToken: string | undefined,
): Promise<boolean> {
  if (!deviceToken?.trim()) return false;

  const tokenHash = await hashDeviceToken(deviceToken);
  const { data, error } = await supabase
    .from("trusted_devices")
    .select("id")
    .eq("user_id", userId)
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

export function getTrustedDeviceCookie(
  cookies: { name: string; value: string }[],
): string | undefined {
  return cookies.find((c) => c.name === TRUSTED_DEVICE_COOKIE)?.value;
}
