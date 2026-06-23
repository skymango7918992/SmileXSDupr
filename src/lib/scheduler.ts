import {
  buildMatchupSet,
  getTeammateCount,
  matchupKey,
  recordTeammates,
  type TeammateHistory,
} from "@/lib/pair-history";

export type MatchPairing = {
  round_number: number;
  team1: [string, string];
  team2: [string, string];
};

export type SessionRosterEntry = {
  player_id: string;
  joined_after_round: number;
};

/** 搭檔重複懲罰權重：數值越大越避免重複同隊 */
const TEAMMATE_PENALTY = 100;
const MAX_PAIRING_ATTEMPTS = 300;

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getEligibleForRound(
  roster: SessionRosterEntry[],
  roundNumber: number,
): string[] {
  return roster
    .filter((r) => r.joined_after_round < roundNumber)
    .map((r) => r.player_id);
}

function splitScore(
  players: [string, string, string, string],
  history: TeammateHistory,
  blockedMatchups: Set<string>,
): { team1: [string, string]; team2: [string, string] } | null {
  const [a, b, c, d] = players;
  const options: Array<{
    team1: [string, string];
    team2: [string, string];
  }> = [
    { team1: [a, b], team2: [c, d] },
    { team1: [a, c], team2: [b, d] },
    { team1: [a, d], team2: [b, c] },
  ];

  let best: (typeof options)[number] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const option of options) {
    if (blockedMatchups.has(matchupKey(option.team1, option.team2))) {
      continue;
    }
    const score =
      getTeammateCount(history, option.team1[0], option.team1[1]) *
        TEAMMATE_PENALTY +
      getTeammateCount(history, option.team2[0], option.team2[1]) *
        TEAMMATE_PENALTY;
    if (score < bestScore) {
      bestScore = score;
      best = option;
    }
  }

  return best;
}

function pickFourPlayers(
  eligibleIds: string[],
  sessionPlayCount: Map<string, number>,
  randomize = false,
): [string, string, string, string] {
  const sorted = [...eligibleIds].sort((a, b) => {
    const diff =
      (sessionPlayCount.get(a) ?? 0) - (sessionPlayCount.get(b) ?? 0);
    if (diff !== 0) return diff;
    return randomize ? Math.random() - 0.5 : 0;
  });

  if (randomize) {
    const pool = sorted.slice(0, Math.min(12, sorted.length));
    return shuffle(pool).slice(0, 4) as [string, string, string, string];
  }

  return sorted.slice(0, 4) as [string, string, string, string];
}

function findUniquePairing(
  eligibleIds: string[],
  sessionPlayCount: Map<string, number>,
  history: TeammateHistory,
  blockedMatchups: Set<string>,
): { team1: [string, string]; team2: [string, string] } | null {
  for (let attempt = 0; attempt < MAX_PAIRING_ATTEMPTS; attempt++) {
    const four = pickFourPlayers(eligibleIds, sessionPlayCount, attempt > 0);
    const split = splitScore(four, history, blockedMatchups);
    if (split) return split;
  }
  return null;
}

function countPlaysFromPairings(
  pairings: MatchPairing[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of pairings) {
    for (const id of [...p.team1, ...p.team2]) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

export function generateMatchPairings(
  roster: SessionRosterEntry[],
  courtCount: number,
  startRound: number,
  history: TeammateHistory = new Map(),
  priorPlayCount: Map<string, number> = new Map(),
  existingPairings: MatchPairing[] = [],
): MatchPairing[] {
  if (courtCount < 1) {
    throw new Error("場數至少為 1");
  }

  const workingHistory: TeammateHistory = new Map(history);
  const sessionPlayCount = new Map(priorPlayCount);
  const blockedMatchups = buildMatchupSet(existingPairings);
  const matches: MatchPairing[] = [];

  for (let i = 0; i < courtCount; i++) {
    const roundNumber = startRound + i;
    const eligible = getEligibleForRound(roster, roundNumber);

    if (eligible.length < 4) {
      throw new Error(
        `第 ${roundNumber} 場僅有 ${eligible.length} 位可上場球員，至少需要 4 人`,
      );
    }

    const split = findUniquePairing(
      eligible,
      sessionPlayCount,
      workingHistory,
      blockedMatchups,
    );

    if (!split) {
      throw new Error(
        `無法排第 ${roundNumber} 場：本組已無不重複的 2v2 對戰組合`,
      );
    }

    const { team1, team2 } = split;
    matches.push({ round_number: roundNumber, team1, team2 });
    blockedMatchups.add(matchupKey(team1, team2));

    for (const playerId of [...team1, ...team2]) {
      sessionPlayCount.set(
        playerId,
        (sessionPlayCount.get(playerId) ?? 0) + 1,
      );
    }

    recordTeammates(workingHistory, team1[0], team1[1]);
    recordTeammates(workingHistory, team2[0], team2[1]);
  }

  return matches;
}

/** 從已完成場次建立上場次數（用於晚到重排） */
export function buildPlayCountFromCompleted(
  completedPairings: MatchPairing[],
): Map<string, number> {
  return countPlaysFromPairings(completedPairings);
}

/** 從所有場次（含待進行）建立上場次數 */
export function buildPlayCountFromPairings(
  pairings: MatchPairing[],
): Map<string, number> {
  return countPlaysFromPairings(pairings);
}
