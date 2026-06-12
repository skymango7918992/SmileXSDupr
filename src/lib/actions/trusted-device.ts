"use server";

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/actions/settings";
import { createClient } from "@/lib/supabase/server";
import {
  TRUSTED_DEVICE_COOKIE,
  clampTrustedDeviceDays,
  createDeviceToken,
  hashDeviceToken,
} from "@/lib/trusted-device";

export async function getTrustedDeviceDays(): Promise<number> {
  try {
    const settings = await getSettings();
    return clampTrustedDeviceDays(settings?.trusted_device_days ?? 7);
  } catch {
    return 7;
  }
}

export type RegisterTrustedDeviceResult =
  | { ok: true }
  | { ok: false; message: string };

/** OTP 驗證成功後註冊信任裝置（依後台設定天數） */
export async function registerTrustedDevice(): Promise<RegisterTrustedDeviceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "登入狀態尚未同步，請先進入系統後再試" };
  }

  const days = await getTrustedDeviceDays();
  const token = createDeviceToken();
  const tokenHash = await hashDeviceToken(token);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent")?.slice(0, 500) ?? null;

  await supabase
    .from("trusted_devices")
    .delete()
    .eq("user_id", user.id)
    .lt("expires_at", new Date().toISOString());

  const { error } = await supabase.from("trusted_devices").insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    user_agent: userAgent,
  });

  if (error) {
    const hint = error.message.includes("trusted_devices")
      ? "請在 Supabase 執行 migration 008_trusted_devices.sql"
      : error.message;
    return { ok: false, message: hint };
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(TRUSTED_DEVICE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: days * 24 * 60 * 60,
    });
  } catch {
    return { ok: false, message: "無法寫入信任裝置 Cookie" };
  }

  return { ok: true };
}

export async function isCurrentDeviceTrusted(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (!token) return false;

  const tokenHash = await hashDeviceToken(token);
  const { data } = await supabase
    .from("trusted_devices")
    .select("id")
    .eq("user_id", user.id)
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return Boolean(data);
}

export async function revokeTrustedDevices(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("trusted_devices").delete().eq("user_id", user.id);

  const cookieStore = await cookies();
  cookieStore.delete(TRUSTED_DEVICE_COOKIE);
}
