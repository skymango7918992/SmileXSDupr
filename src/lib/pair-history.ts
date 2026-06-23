export type TeammateHistory = Map<string, number>;

export function pairKey(playerA: string, playerB: string): string {
  return [playerA, playerB].sort().join("|");
}

export function getTeammateCount(
  history: TeammateHistory,
  playerA: string,
  playerB: string,
): number {
  return history.get(pairKey(playerA, playerB)) ?? 0;
}

export function recordTeammates(
  history: TeammateHistory,
  playerA: string,
  playerB: string,
): void {
  const key = pairKey(playerA, playerB);
  history.set(key, (history.get(key) ?? 0) + 1);
}

/** 完整對戰 key（主客隊互換視為同一場） */
export function matchupKey(
  team1: [string, string],
  team2: [string, string],
): string {
  const t1 = pairKey(team1[0], team1[1]);
  const t2 = pairKey(team2[0], team2[1]);
  return [t1, t2].sort().join(" vs ");
}

export function buildMatchupSet(
  pairings: Array<{
    team1: [string, string];
    team2: [string, string];
  }>,
): Set<string> {
  return new Set(pairings.map((p) => matchupKey(p.team1, p.team2)));
}

type MatchPlayerRow = {
  match_id: string;
  player_id: string;
  team: number;
};

export function buildTeammateHistory(rows: MatchPlayerRow[]): TeammateHistory {
  const history: TeammateHistory = new Map();
  const byMatch = new Map<string, MatchPlayerRow[]>();

  for (const row of rows) {
    const list = byMatch.get(row.match_id) ?? [];
    list.push(row);
    byMatch.set(row.match_id, list);
  }

  for (const players of byMatch.values()) {
    const teams = new Map<number, string[]>();
    for (const row of players) {
      const team = teams.get(row.team) ?? [];
      team.push(row.player_id);
      teams.set(row.team, team);
    }

    for (const teamPlayers of teams.values()) {
      if (teamPlayers.length === 2) {
        recordTeammates(history, teamPlayers[0], teamPlayers[1]);
      }
    }
  }

  return history;
}
