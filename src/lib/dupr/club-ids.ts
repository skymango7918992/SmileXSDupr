"use server";

import { getSettings } from "@/lib/actions/settings";
import { readRuntimeEnv } from "@/lib/runtime-env";

const XS_DEFAULT_CLUB_ID = "4668804565";

export async function getXsDuprClubId(): Promise<string> {
  const settings = await getSettings();
  const fromDb = settings?.xs_dupr_club_id?.trim();
  if (fromDb) return fromDb;

  const fromEnv = (await readRuntimeEnv("DUPR_CLUB_ID"))?.trim();
  if (fromEnv) return fromEnv;

  return XS_DEFAULT_CLUB_ID;
}

export async function getKhpaDuprClubId(): Promise<string> {
  const settings = await getSettings();
  const fromDb = settings?.khpa_dupr_club_id?.trim();
  if (fromDb) return fromDb;

  throw new Error("請先在「設定」頁填入協會 DUPR Club ID");
}

export async function getKhpaDuprClubIdOrEmpty(): Promise<string> {
  const settings = await getSettings();
  return settings?.khpa_dupr_club_id?.trim() ?? "";
}
