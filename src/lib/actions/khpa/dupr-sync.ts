"use server";

import { revalidatePath } from "next/cache";
import { getRoleFromEmail } from "@/lib/auth/roles";
import { fetchAllClubMembers, type DuprClubMember } from "@/lib/dupr/client";
import { getKhpaDuprClubId } from "@/lib/dupr/club-ids";
import { areDuprIdsEquivalent, normalizeDuprId } from "@/lib/dupr-id";
import { createClient } from "@/lib/supabase/server";
import type { KhpaPlayer } from "@/types/khpa";

export type KhpaDuprSyncResult = {
  clubTotal: number;
  added: number;
  updated: number;
  converted: number;
  deactivated: number;
};

async function requireKhpaSyncAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = getRoleFromEmail(user?.email);
  if (role !== "admin" && role !== "khpa") {
    throw new Error("僅協會或系統管理員可同步 DUPR 名單");
  }
}

function clubPlayerPayload(
  member: DuprClubMember,
  current?: KhpaPlayer,
): Partial<KhpaPlayer> {
  const customized = current?.display_name_customized ?? false;
  return {
    name: member.fullName,
    dupr_rating: member.doublesRating,
    source: "club",
    active: true,
    ...(customized
      ? {}
      : { display_name: member.fullName, display_name_customized: false }),
  };
}

export async function applyKhpaClubMembersSync(
  members: DuprClubMember[],
): Promise<KhpaDuprSyncResult> {
  const clubIds = new Set(members.map((m) => m.duprId));
  const supabase = await createClient();

  const { data: existingRaw, error: loadError } = await supabase
    .from("khpa_players")
    .select("*");

  if (loadError) throw new Error(loadError.message);

  const existing = (existingRaw ?? []) as KhpaPlayer[];
  const byDuprId = new Map(
    existing.map((p) => [normalizeDuprId(p.dupr_id), p]),
  );

  const findExisting = (duprId: string): KhpaPlayer | undefined => {
    const exact = byDuprId.get(normalizeDuprId(duprId));
    if (exact) return exact;
    return existing.find((p) => areDuprIdsEquivalent(p.dupr_id, duprId));
  };

  let added = 0;
  let updated = 0;
  let converted = 0;

  for (const member of members) {
    const current = findExisting(member.duprId);

    if (!current) {
      const { error } = await supabase.from("khpa_players").insert({
        name: member.fullName,
        display_name: member.fullName,
        display_name_customized: false,
        dupr_id: member.duprId,
        dupr_rating: member.doublesRating,
        source: "club",
        active: true,
      });
      if (error) throw new Error(error.message);
      added += 1;
      continue;
    }

    const wasManual = (current.source ?? "manual") !== "club";
    const { error } = await supabase
      .from("khpa_players")
      .update({
        ...clubPlayerPayload(member, current),
        dupr_id: member.duprId,
      })
      .eq("id", current.id);

    if (error) throw new Error(error.message);

    if (wasManual) converted += 1;
    else updated += 1;
  }

  let deactivated = 0;
  const { data: afterSync } = await supabase.from("khpa_players").select("*");
  for (const player of (afterSync ?? []) as KhpaPlayer[]) {
    if ((player.source ?? "manual") !== "club") continue;
    const stillInClub = [...clubIds].some((id) =>
      areDuprIdsEquivalent(id, player.dupr_id),
    );
    if (stillInClub) continue;

    const { error } = await supabase
      .from("khpa_players")
      .update({ active: false })
      .eq("id", player.id);
    if (error) throw new Error(error.message);
    deactivated += 1;
  }

  revalidatePath("/");
  return {
    clubTotal: members.length,
    added,
    updated,
    converted,
    deactivated,
  };
}

export async function syncKhpaDuprClubMembers(): Promise<KhpaDuprSyncResult> {
  await requireKhpaSyncAccess();
  const clubId = await getKhpaDuprClubId();
  const members = await fetchAllClubMembers(clubId);
  return applyKhpaClubMembersSync(members);
}
