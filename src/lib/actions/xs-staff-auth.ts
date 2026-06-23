"use server";

import { revalidatePath } from "next/cache";
import {
  getStaffEmail,
  getStaffUsername,
  usernameToEmail,
} from "@/lib/auth/config";
import { isAdminRole } from "@/lib/auth/roles";
import { verifyImageCaptcha } from "@/lib/captcha/image-captcha";
import { getStaffEnv } from "@/lib/env";
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

export type XsStaffAccountStatus = {
  exists: boolean;
  email: string;
  username: string;
};

export async function getXsStaffAccountStatus(): Promise<XsStaffAccountStatus> {
  await requireAdmin();
  const email = getStaffEmail();
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  const found = data?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  return {
    exists: Boolean(found),
    email,
    username: getStaffUsername(),
  };
}

export async function ensureXsStaffUser(password: string): Promise<void> {
  await requireAdmin();
  const trimmed = password.trim();
  if (trimmed.length < 6) {
    throw new Error("密碼至少 6 個字元");
  }

  const email = getStaffEmail();
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
      user_metadata: { role: "staff", portal: "xs" },
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/settings");
}

export async function updateXsStaffPassword(password: string): Promise<void> {
  const envPassword = getStaffEnv().password;
  if (!envPassword && !password.trim()) {
    throw new Error("請輸入新密碼");
  }
  await ensureXsStaffUser(password.trim() || envPassword!);
}

export type XsStaffSignInResult =
  | { ok: true }
  | { ok: false; message: string };

/** 星鑽 XS 一般使用者：帳密 + 圖形驗證碼（不使用 Google Authenticator） */
export async function xsStaffSignIn(input: {
  username: string;
  password: string;
  captchaToken: string;
  captchaAnswer: string;
}): Promise<XsStaffSignInResult> {
  const captcha = verifyImageCaptcha(input.captchaToken, input.captchaAnswer);
  if (!captcha.ok) {
    return { ok: false, message: captcha.error };
  }

  const email = usernameToEmail(input.username, "xs");
  if (!email || email.toLowerCase() !== getStaffEmail().toLowerCase()) {
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
