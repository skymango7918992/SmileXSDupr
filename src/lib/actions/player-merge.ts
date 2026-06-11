import type { SupabaseClient } from "@supabase/supabase-js";
import { areDuprIdsEquivalent, normalizeDuprId } from "@/lib/dupr-id";
import type { Player } from "@/types/database";

async function countMatchAppearances(
  supabase: SupabaseClient,
  playerId: string,
): Promise<number> {
  const { count } = await supabase
    .from("match_players")
    .select("id", { count: "exact", head: true })
    .eq("player_id", playerId);
  return count ?? 0;
}

function keeperScore(source: Player["source"], matchCount: number): number {
  let score = matchCount;
  if (source === "club") score += 10_000;
  return score;
}

async function pickKeeper(
  supabase: SupabaseClient,
  group: Player[],
): Promise<Player> {
  let keeper = group[0];
  let best = keeperScore(
    keeper.source ?? "manual",
    await countMatchAppearances(supabase, keeper.id),
  );

  for (const candidate of group.slice(1)) {
    const score = keeperScore(
      candidate.source ?? "manual",
      await countMatchAppearances(supabase, candidate.id),
    );
    if (
      score > best ||
      (score === best && candidate.created_at < keeper.created_at)
    ) {
      keeper = candidate;
      best = score;
    }
  }

  return keeper;
}

export async function reassignPlayerReferences(
  supabase: SupabaseClient,
  fromId: string,
  toId: string,
): Promise<void> {
  const { data: matchRows, error: mpLoadError } = await supabase
    .from("match_players")
    .select("id, match_id")
    .eq("player_id", fromId);
  if (mpLoadError) throw new Error(mpLoadError.message);

  for (const row of matchRows ?? []) {
    const { data: conflict } = await supabase
      .from("match_players")
      .select("id")
      .eq("match_id", row.match_id)
      .eq("player_id", toId)
      .maybeSingle();

    if (conflict) {
      const { error } = await supabase
        .from("match_players")
        .delete()
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("match_players")
        .update({ player_id: toId })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    }
  }

  const { data: sessionRows, error: spLoadError } = await supabase
    .from("session_players")
    .select("id, schedule_session_id")
    .eq("player_id", fromId);
  if (spLoadError) throw new Error(spLoadError.message);

  for (const row of sessionRows ?? []) {
    const { data: conflict } = await supabase
      .from("session_players")
      .select("id")
      .eq("schedule_session_id", row.schedule_session_id)
      .eq("player_id", toId)
      .maybeSingle();

    if (conflict) {
      const { error } = await supabase
        .from("session_players")
        .delete()
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("session_players")
        .update({ player_id: toId })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    }
  }

  const { data: matchDays, error: mdLoadError } = await supabase
    .from("match_days")
    .select("id, selected_player_ids");
  if (mdLoadError) throw new Error(mdLoadError.message);

  for (const day of matchDays ?? []) {
    const ids = day.selected_player_ids as string[];
    if (!ids.includes(fromId)) continue;

    const next = [...new Set(ids.map((id) => (id === fromId ? toId : id)))];
    const { error } = await supabase
      .from("match_days")
      .update({ selected_player_ids: next })
      .eq("id", day.id);
    if (error) throw new Error(error.message);
  }
}

export async function mergePlayers(
  supabase: SupabaseClient,
  duplicate: Player,
  keeper: Player,
): Promise<void> {
  await reassignPlayerReferences(supabase, duplicate.id, keeper.id);

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", duplicate.id);
  if (error) throw new Error(error.message);
}

function findConfusableGroups(players: Player[]): Player[][] {
  const groups: Player[][] = [];
  const used = new Set<string>();

  for (const player of players) {
    if (used.has(player.id)) continue;

    const group = [player];
    used.add(player.id);

    for (const other of players) {
      if (used.has(other.id)) continue;
      if (areDuprIdsEquivalent(player.dupr_id, other.dupr_id)) {
        group.push(other);
        used.add(other.id);
      }
    }

    if (group.length > 1) groups.push(group);
  }

  return groups;
}

async function mergeDuplicateGroups(
  supabase: SupabaseClient,
  players: Player[],
): Promise<{ players: Player[]; merged: number }> {
  const removeIds = new Set<string>();
  let merged = 0;

  for (const group of findConfusableGroups(players)) {
    const keeper = await pickKeeper(supabase, group);
    for (const duplicate of group) {
      if (duplicate.id === keeper.id) continue;
      await mergePlayers(supabase, duplicate, keeper);
      removeIds.add(duplicate.id);
      merged += 1;
    }
  }

  return {
    players: players.filter((p) => !removeIds.has(p.id)),
    merged,
  };
}

/** 合併相同或易混淆 DUPR ID 的重複球員，保留 Club / 有戰績者 */
export async function deduplicatePlayersByDuprId(
  supabase: SupabaseClient,
  players: Player[],
): Promise<{ players: Player[]; merged: number }> {
  let current = [...players];
  let merged = 0;

  const exactGroups = new Map<string, Player[]>();
  for (const player of current) {
    const key = normalizeDuprId(player.dupr_id);
    const group = exactGroups.get(key) ?? [];
    group.push(player);
    exactGroups.set(key, group);
  }

  for (const group of exactGroups.values()) {
    if (group.length <= 1) continue;
    const keeper = await pickKeeper(supabase, group);
    for (const duplicate of group) {
      if (duplicate.id === keeper.id) continue;
      await mergePlayers(supabase, duplicate, keeper);
      current = current.filter((p) => p.id !== duplicate.id);
      merged += 1;
    }
  }

  const confusable = await mergeDuplicateGroups(supabase, current);
  return {
    players: confusable.players,
    merged: merged + confusable.merged,
  };
}

export type PlayerRemovalResult = "deleted" | "merged" | "deactivated";

export async function removePlayerRecord(
  supabase: SupabaseClient,
  player: Player,
  allPlayers?: Player[],
): Promise<PlayerRemovalResult> {
  const roster =
    allPlayers ??
    ((
      await supabase.from("players").select("*")
    ).data as Player[] | null) ??
    [];

  const clubTwin = roster.find(
    (p) =>
      p.id !== player.id &&
      p.source === "club" &&
      areDuprIdsEquivalent(p.dupr_id, player.dupr_id),
  );

  if (clubTwin) {
    await mergePlayers(supabase, player, clubTwin);
    return "merged";
  }

  const { error: spError } = await supabase
    .from("session_players")
    .delete()
    .eq("player_id", player.id);
  if (spError) throw new Error(spError.message);

  const matchCount = await countMatchAppearances(supabase, player.id);
  if (matchCount > 0) {
    const { error } = await supabase
      .from("players")
      .update({ active: false })
      .eq("id", player.id);
    if (error) throw new Error(error.message);
    return "deactivated";
  }

  const { error } = await supabase.from("players").delete().eq("id", player.id);
  if (error) throw new Error(error.message);
  return "deleted";
}
