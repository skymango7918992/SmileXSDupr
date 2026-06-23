import type { DuprConfigMode } from "@/types/dupr";
import { readRuntimeEnv } from "@/lib/runtime-env";

export type { DuprConfigMode };

/**
 * 環境變數讀取：
 * - 本機：專案根目錄 `.env`
 * - Cloudflare：Dashboard → Workers → Variables and Secrets（執行期）
 *   與 Build variables（NEXT_PUBLIC_* 建置時內嵌）
 */

export const ENV_SETUP_HINT =
  "請在本機 .env，或 Cloudflare Dashboard → Workers → Variables and Secrets 設定（變更後請重新部署）";

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
      `缺少 Supabase 設定。${ENV_SETUP_HINT}（NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY）`,
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/** 登入帳號對照（帳號 Smile → ADMIN_EMAIL，客戶端登入表單也會用到） */
export function getAdminEnv() {
  return {
    username: process.env.ADMIN_USERNAME?.trim() || "Smile",
    email: process.env.ADMIN_EMAIL?.trim() || "smile@xingzuan-xs.local",
    password: process.env.ADMIN_PASSWORD?.trim(),
  };
}

/** KHPA 協會共用帳號 */
export function getKhpaEnv() {
  return {
    username: process.env.KHPA_USERNAME?.trim() || "KHPA",
    email: process.env.KHPA_EMAIL?.trim() || "khpa@khpa.local",
    password: process.env.KHPA_PASSWORD?.trim(),
  };
}

/** 僅伺服器腳本使用（create-admin） */
export function getServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

/** 是否已設定 DUPR 同步（Token 或帳密擇一） */
export async function getDuprConfigMode(): Promise<DuprConfigMode> {
  const token = await readRuntimeEnv("DUPR_API_TOKEN");
  if (token) return "token";

  const email = await readRuntimeEnv("DUPR_EMAIL");
  const password = await readRuntimeEnv("DUPR_PASSWORD");
  if (email && password) return "credentials";

  return "none";
}

export async function hasDuprEnv(): Promise<boolean> {
  return (await getDuprConfigMode()) !== "none";
}

/** DUPR Club 同步設定（不含 token，token 請用 resolveDuprAccessToken） */
export async function getDuprConfig() {
  const [apiBase, clubId, apiVersion, mode] = await Promise.all([
    readRuntimeEnv("DUPR_API_BASE"),
    readRuntimeEnv("DUPR_CLUB_ID"),
    readRuntimeEnv("DUPR_API_VERSION"),
    getDuprConfigMode(),
  ]);

  return {
    apiBase: apiBase || "https://api.dupr.gg",
    clubId: clubId || "4668804565",
    apiVersion: apiVersion || "v1.0",
    mode,
  };
}

export function getEnvSetupHint(): string {
  return ENV_SETUP_HINT;
}
