export type MatchPairing = {
  round_number: number;
  team1: [string, string];
  team2: [string, string];
};

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateMatchPairings(
  playerIds: string[],
  courtCount: number,
  startRound: number,
): MatchPairing[] {
  if (playerIds.length < 4) {
    throw new Error("至少需要 4 位球員才能排場");
  }
  if (courtCount < 1) {
    throw new Error("場數至少為 1");
  }

  const matches: MatchPairing[] = [];

  for (let i = 0; i < courtCount; i++) {
    const shuffled = shuffle(playerIds);
    const selected = shuffled.slice(0, 4);
    matches.push({
      round_number: startRound + i,
      team1: [selected[0], selected[1]],
      team2: [selected[2], selected[3]],
    });
  }

  return matches;
}
