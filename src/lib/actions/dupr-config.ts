"use server";

import { getDuprConfig, getDuprConfigMode } from "@/lib/env";
import type { DuprEnvStatus } from "@/types/dupr";

/** 執行期讀取 DUPR 設定（Vercel 環境變數在 Server Action 內讀取） */
export async function getDuprConfigModeAction() {
  return getDuprConfigMode();
}

/** 診斷用：只回傳「有無設定」，不回傳密碼或 Token 內容 */
export async function getDuprEnvStatusAction(): Promise<DuprEnvStatus> {
  const { clubId } = getDuprConfig();
  return {
    mode: getDuprConfigMode(),
    hasToken: Boolean(process.env.DUPR_API_TOKEN?.trim()),
    hasEmail: Boolean(process.env.DUPR_EMAIL?.trim()),
    hasPassword: Boolean(process.env.DUPR_PASSWORD?.trim()),
    clubId,
  };
}
