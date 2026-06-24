"use server";

import { getDuprConfigMode } from "@/lib/env";
import {
  getKhpaDuprClubIdOrEmpty,
  getXsDuprClubId,
} from "@/lib/dupr/club-ids";
import { readRuntimeEnv } from "@/lib/runtime-env";
import type { DuprEnvStatus } from "@/types/dupr";

/** 執行期讀取 DUPR 設定（Cloudflare Worker Variables / Secrets） */
export async function getDuprConfigModeAction() {
  return getDuprConfigMode();
}

/** 診斷伺服器是否讀到 DUPR 環境變數（不含密碼內容） */
export async function getDuprEnvStatusAction(): Promise<DuprEnvStatus> {
  const [xsClubId, khpaClubId, hasToken, hasEmail, hasPassword] =
    await Promise.all([
      getXsDuprClubId(),
      getKhpaDuprClubIdOrEmpty(),
      readRuntimeEnv("DUPR_API_TOKEN").then(Boolean),
      readRuntimeEnv("DUPR_EMAIL").then(Boolean),
      readRuntimeEnv("DUPR_PASSWORD").then(Boolean),
    ]);

  return {
    mode: await getDuprConfigMode(),
    hasToken,
    hasEmail,
    hasPassword,
    clubId: xsClubId,
    xsClubId,
    khpaClubId,
  };
}
