import {
  getTeammateCount,
  recordTeammates,
  type TeammateHistory,
} from "@/lib/pair-history";

export type MatchPairing = {
  round_number: number;
  team1: [string, string];
  team2: [string, string];
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function splitScore(
  players: [string, string, string, string],
  history: TeammateHistory,
): { team1: [string, string]; team2: [string, string]; score: number } {
  const [a, b, c, d] = players;
  const options: Array<{
    team1: [string, string];
    team2: [string, string];
  }> = [
    { team1: [a, b], team2: [c, d] },
    { team1: [a, c], team2: [b, d] },
    { team1: [a, d], team2: [b, c] },
  ];

  let best = options[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const option of options) {
    const score =
      getTeammateCount(history, option.team1[0], option.team1[1]) +
      getTeammateCount(history, option.team2[0], option.team2[1]);
    if (score < bestScore) {
      bestScore = score;
      best = option;
    }
  }

  return { ...best, score: bestScore };
}

function pickFourPlayers(
  playerIds: string[],
  sessionPlayCount: Map<string, number>,
): [string, string, string, string] {
  const sorted = [...playerIds].sort((a, b) => {
    const diff = (sessionPlayCount.get(a) ?? 0) - (sessionPlayCount.get(b) ?? 0);
    if (diff !== 0) return diff;
    return Math.random() - 0.5;
  });

  const picked = sorted.slice(0, 4);
  return picked as [string, string, string, string];
}

export function generateMatchPairings(
  playerIds: string[],
  courtCount: number,
  startRound: number,
  history: TeammateHistory = new Map(),
): MatchPairing[] {
  if (playerIds.length < 4) {
    throw new Error("至少需要 4 位球員才能排場");
  }
  if (courtCount < 1) {
    throw new Error("場數至少為 1");
  }

  const workingHistory: TeammateHistory = new Map(history);
  const sessionPlayCount = new Map<string, number>();
  const matches: MatchPairing[] = [];

  for (let i = 0; i < courtCount; i++) {
    const four = pickFourPlayers(playerIds, sessionPlayCount);
    const { team1, team2 } = splitScore(four, workingHistory);

    matches.push({
      round_number: startRound + i,
      team1,
      team2,
    });

    for (const playerId of four) {
      sessionPlayCount.set(playerId, (sessionPlayCount.get(playerId) ?? 0) + 1);
    }

    recordTeammates(workingHistory, team1[0], team1[1]);
    recordTeammates(workingHistory, team2[0], team2[1]);
  }

  return matches;
}

export function shufflePlayers(playerIds: string[]): string[] {
  return shuffle(playerIds);
}
