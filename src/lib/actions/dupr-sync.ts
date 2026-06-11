"use server";

import { revalidatePath } from "next/cache";
import { fetchAllClubMembers } from "@/lib/dupr/client";
import {
  deduplicatePlayersByDuprId,
  removePlayerRecord,
} from "@/lib/actions/player-merge";
import { areDuprIdsEquivalent, normalizeDuprId } from "@/lib/dupr-id";
import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/types/database";

export type DuprSyncResult = {
  clubTotal: number;
  added: number;
  updated: number;
  converted: number;
  merged: number;
  removed: number;
  deactivated: number;
};

function clubPlayerPayload(member: {
  fullName: string;
  doublesRating: number | null;
}, current?: Player) {
  const customized = current?.display_name_customized ?? false;
  return {
    name: member.fullName,
    dupr_rating: member.doublesRating,
    source: "club" as const,
    active: true,
    ...(customized
      ? {}
      : { display_name: member.fullName, display_name_customized: false }),
  };
}

export async function syncDuprClubMembers(): Promise<DuprSyncResult> {
  const members = await fetchAllClubMembers();
  const clubIds = new Set(members.map((m) => m.duprId));

  const supabase = await createClient();
  const { data: existingRaw, error: loadError } = await supabase
    .from("players")
    .select("*");

  if (loadError) throw new Error(loadError.message);

  const { players: existing, merged } = await deduplicatePlayersByDuprId(
    supabase,
    (existingRaw ?? []) as Player[],
  );

  const byDuprId = new Map(
    existing.map((p) => [normalizeDuprId(p.dupr_id), p as Player]),
  );

  const findExisting = (duprId: string): Player | undefined => {
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
      const { error } = await supabase.from("players").insert({
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

    const wasManual = current.source !== "club";
    const { error } = await supabase
      .from("players")
      .update({
        ...clubPlayerPayload(member, current),
        dupr_id: member.duprId,
      })
      .eq("id", current.id);

    if (error) throw new Error(error.message);

    byDuprId.set(normalizeDuprId(member.duprId), {
      ...current,
      dupr_id: member.duprId,
      source: "club",
    });

    if (wasManual) converted += 1;
    else updated += 1;
  }

  let removed = 0;
  let deactivated = 0;

  const { data: afterSync } = await supabase.from("players").select("*");
  for (const player of (afterSync ?? []) as Player[]) {
    if (player.source !== "club") continue;
    const stillInClub = [...clubIds].some((id) =>
      areDuprIdsEquivalent(id, player.dupr_id),
    );
    if (stillInClub) continue;

    const result = await removePlayerRecord(supabase, player, afterSync as Player[]);
    if (result === "deleted" || result === "merged") removed += 1;
    else deactivated += 1;
  }

  revalidatePath("/players");
  revalidatePath("/");

  return {
    clubTotal: members.length,
    added,
    updated,
    converted,
    merged,
    removed,
    deactivated,
  };
}
