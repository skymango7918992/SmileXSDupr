import type { SupabaseClient } from "@supabase/supabase-js";
import { areDuprIdsEquivalent, normalizeDuprId } from "@/lib/dupr-id";
import type { Player } from "@/types/database";

const IN_CHUNK = 200;

function chunk<T>(items: T[], size = IN_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

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

async function countMatchAppearancesBatch(
  supabase: SupabaseClient,
  playerIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const id of playerIds) counts.set(id, 0);
  if (!playerIds.length) return counts;

  for (const ids of chunk(playerIds)) {
    const { data, error } = await supabase
      .from("match_players")
      .select("player_id")
      .in("player_id", ids);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const id = row.player_id as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  return counts;
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
  const counts = await countMatchAppearancesBatch(
    supabase,
    group.map((p) => p.id),
  );

  let keeper = group[0];
  let best = keeperScore(keeper.source ?? "manual", counts.get(keeper.id) ?? 0);

  for (const candidate of group.slice(1)) {
    const score = keeperScore(
      candidate.source ?? "manual",
      counts.get(candidate.id) ?? 0,
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

async function findClubTwin(
  supabase: SupabaseClient,
  player: Player,
): Promise<Player | undefined> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("source", "club")
    .neq("id", player.id);
  if (error) throw new Error(error.message);

  return ((data ?? []) as Player[]).find((p) =>
    areDuprIdsEquivalent(p.dupr_id, player.dupr_id),
  );
}

async function reassignMatchPlayers(
  supabase: SupabaseClient,
  fromId: string,
  toId: string,
): Promise<void> {
  const { data: matchRows, error: loadError } = await supabase
    .from("match_players")
    .select("id, match_id")
    .eq("player_id", fromId);
  if (loadError) throw new Error(loadError.message);
  if (!matchRows?.length) return;

  const matchIds = [...new Set(matchRows.map((row) => row.match_id as string))];
  const conflictMatchIds = new Set<string>();

  for (const ids of chunk(matchIds)) {
    const { data: conflicts, error } = await supabase
      .from("match_players")
      .select("match_id")
      .eq("player_id", toId)
      .in("match_id", ids);
    if (error) throw new Error(error.message);
    for (const row of conflicts ?? []) {
      conflictMatchIds.add(row.match_id as string);
    }
  }

  const deleteIds = matchRows
    .filter((row) => conflictMatchIds.has(row.match_id as string))
    .map((row) => row.id as string);
  const updateIds = matchRows
    .filter((row) => !conflictMatchIds.has(row.match_id as string))
    .map((row) => row.id as string);

  for (const ids of chunk(deleteIds)) {
    const { error } = await supabase.from("match_players").delete().in("id", ids);
    if (error) throw new Error(error.message);
  }

  for (const ids of chunk(updateIds)) {
    const { error } = await supabase
      .from("match_players")
      .update({ player_id: toId })
      .in("id", ids);
    if (error) throw new Error(error.message);
  }
}

async function reassignSessionPlayers(
  supabase: SupabaseClient,
  fromId: string,
  toId: string,
): Promise<void> {
  const { data: sessionRows, error: loadError } = await supabase
    .from("session_players")
    .select("id, schedule_session_id")
    .eq("player_id", fromId);
  if (loadError) throw new Error(loadError.message);
  if (!sessionRows?.length) return;

  const sessionIds = [
    ...new Set(sessionRows.map((row) => row.schedule_session_id as string)),
  ];
  const conflictSessionIds = new Set<string>();

  for (const ids of chunk(sessionIds)) {
    const { data: conflicts, error } = await supabase
      .from("session_players")
      .select("schedule_session_id")
      .eq("player_id", toId)
      .in("schedule_session_id", ids);
    if (error) throw new Error(error.message);
    for (const row of conflicts ?? []) {
      conflictSessionIds.add(row.schedule_session_id as string);
    }
  }

  const deleteIds = sessionRows
    .filter((row) =>
      conflictSessionIds.has(row.schedule_session_id as string),
    )
    .map((row) => row.id as string);
  const updateIds = sessionRows
    .filter(
      (row) => !conflictSessionIds.has(row.schedule_session_id as string),
    )
    .map((row) => row.id as string);

  for (const ids of chunk(deleteIds)) {
    const { error } = await supabase.from("session_players").delete().in("id", ids);
    if (error) throw new Error(error.message);
  }

  for (const ids of chunk(updateIds)) {
    const { error } = await supabase
      .from("session_players")
      .update({ player_id: toId })
      .in("id", ids);
    if (error) throw new Error(error.message);
  }
}

async function reassignMatchDaySelections(
  supabase: SupabaseClient,
  fromId: string,
  toId: string,
): Promise<void> {
  const { data: matchDays, error: loadError } = await supabase
    .from("match_days")
    .select("id, selected_player_ids")
    .contains("selected_player_ids", [fromId]);
  if (loadError) throw new Error(loadError.message);
  if (!matchDays?.length) return;

  for (const day of matchDays) {
    const ids = day.selected_player_ids as string[];
    const next = [...new Set(ids.map((id) => (id === fromId ? toId : id)))];
    const { error } = await supabase
      .from("match_days")
      .update({ selected_player_ids: next })
      .eq("id", day.id);
    if (error) throw new Error(error.message);
  }
}

export async function reassignPlayerReferences(
  supabase: SupabaseClient,
  fromId: string,
  toId: string,
): Promise<void> {
  await Promise.all([
    reassignMatchPlayers(supabase, fromId, toId),
    reassignSessionPlayers(supabase, fromId, toId),
  ]);
  await reassignMatchDaySelections(supabase, fromId, toId);
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
  const clubTwin =
    allPlayers?.find(
      (p) =>
        p.id !== player.id &&
        p.source === "club" &&
        areDuprIdsEquivalent(p.dupr_id, player.dupr_id),
    ) ?? (await findClubTwin(supabase, player));

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
