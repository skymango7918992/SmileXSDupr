import type { DuprConfigMode } from "@/types/dupr";

export type { DuprConfigMode };

/**
 * 環境變數由 Next.js 從 `process.env` 讀取：
 * - 本機：專案根目錄 `.env`
 * - Vercel：Dashboard → Settings → Environment Variables（需勾選 Production 並重新部署）
 */

const ENV_FILE_HINT =
  "請在本機 .env 或 Vercel → Settings → Environment Variables 設定（變更後請重新部署）";

export function hasSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

/** Supabase 連線（前後端共用，僅 NEXT_PUBLIC_ 變數） */
export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `缺少 Supabase 設定。${ENV_FILE_HINT}（NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY）`,
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/** 登入帳號對照（帳號 Smile → ADMIN_EMAIL） */
export function getAdminEnv() {
  return {
    username: process.env.ADMIN_USERNAME?.trim() || "Smile",
    email: process.env.ADMIN_EMAIL?.trim() || "smile@xingzuan-xs.local",
    password: process.env.ADMIN_PASSWORD?.trim(),
  };
}

/** 僅伺服器腳本使用（create-admin） */
export function getServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

/** 是否已設定 DUPR 同步（Token 或帳密擇一） */
export function getDuprConfigMode(): DuprConfigMode {
  if (process.env.DUPR_API_TOKEN?.trim()) return "token";
  if (
    process.env.DUPR_EMAIL?.trim() &&
    process.env.DUPR_PASSWORD?.trim()
  ) {
    return "credentials";
  }
  return "none";
}

export function hasDuprEnv(): boolean {
  return getDuprConfigMode() !== "none";
}

/** DUPR Club 同步設定（不含 token，token 請用 resolveDuprAccessToken） */
export function getDuprConfig() {
  return {
    apiBase: process.env.DUPR_API_BASE?.trim() || "https://api.dupr.gg",
    clubId: process.env.DUPR_CLUB_ID?.trim() || "4668804565",
    apiVersion: process.env.DUPR_API_VERSION?.trim() || "v1.0",
    mode: getDuprConfigMode(),
  };
}

export function getEnvSetupHint(): string {
  return ENV_FILE_HINT;
}
