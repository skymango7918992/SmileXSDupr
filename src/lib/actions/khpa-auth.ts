"use server";

import { revalidatePath } from "next/cache";
import { getKhpaEmail, getKhpaUsername, usernameToEmail } from "@/lib/auth/config";
import { isAdminRole } from "@/lib/auth/roles";
import {
  createImageCaptchaChallenge,
  verifyImageCaptcha,
  type ImageCaptchaChallenge,
} from "@/lib/captcha/image-captcha";
import { getKhpaEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminRole(user?.email)) {
    throw new Error("僅系統管理員可執行此操作");
  }
}

export type KhpaAccountStatus = {
  exists: boolean;
  email: string;
  username: string;
};

export async function getKhpaAccountStatus(): Promise<KhpaAccountStatus> {
  await requireAdmin();
  const email = getKhpaEmail();
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  const found = data?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  return {
    exists: Boolean(found),
    email,
    username: getKhpaUsername(),
  };
}

export async function ensureKhpaUser(password: string): Promise<void> {
  await requireAdmin();
  const trimmed = password.trim();
  if (trimmed.length < 6) {
    throw new Error("密碼至少 6 個字元");
  }

  const email = getKhpaEmail();
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  const found = data?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (found) {
    const { error } = await admin.auth.admin.updateUserById(found.id, {
      password: trimmed,
    });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.auth.admin.createUser({
      email,
      password: trimmed,
      email_confirm: true,
      user_metadata: { role: "khpa", portal: "khpa" },
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/settings");
}

export async function updateKhpaPassword(password: string): Promise<void> {
  const envPassword = getKhpaEnv().password;
  if (!envPassword && !password.trim()) {
    throw new Error("請輸入新密碼");
  }
  await ensureKhpaUser(password.trim() || envPassword!);
}

export type KhpaSignInResult =
  | { ok: true }
  | { ok: false; message: string };

export async function getKhpaCaptchaChallenge(): Promise<ImageCaptchaChallenge> {
  return createImageCaptchaChallenge();
}

/** 協會登入：帳密 + 圖形驗證碼（不使用 Google Authenticator） */
export async function khpaSignIn(input: {
  username: string;
  password: string;
  captchaToken: string;
  captchaAnswer: string;
}): Promise<KhpaSignInResult> {
  const captcha = verifyImageCaptcha(input.captchaToken, input.captchaAnswer);
  if (!captcha.ok) {
    return { ok: false, message: captcha.error };
  }

  const email = usernameToEmail(input.username, "khpa");
  if (!email) {
    return { ok: false, message: "帳號或密碼錯誤" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    return { ok: false, message: "帳號或密碼錯誤" };
  }

  return { ok: true };
}
