import type {
  CultivationMatchResult,
  CultivationRecordType,
  XpBreakdownItem,
} from "@/types/cultivation-journey";

export function computeRetreatXp(durationMinutes: number): {
  total: number;
  breakdown: XpBreakdownItem[];
} {
  const breakdown: XpBreakdownItem[] = [
    { label: "完成閉關練球", points: 10 },
  ];
  if (durationMinutes >= 60) {
    breakdown.push({ label: "閉關滿 60 分鐘", points: 15 });
  }
  return {
    total: breakdown.reduce((sum, item) => sum + item.points, 0),
    breakdown,
  };
}

export function computeSparringXp(result: CultivationMatchResult): {
  total: number;
  breakdown: XpBreakdownItem[];
} {
  const breakdown: XpBreakdownItem[] = [
    { label: "完成同門切磋", points: 10 },
  ];
  if (result === "win") {
    breakdown.push({ label: "切磋勝利", points: 3 });
  } else if (result === "loss") {
    breakdown.push({ label: "切磋落敗（修心）", points: 5 });
  }
  return {
    total: breakdown.reduce((sum, item) => sum + item.points, 0),
    breakdown,
  };
}

export function computeTrialXp(wins: number, losses: number): {
  total: number;
  breakdown: XpBreakdownItem[];
} {
  const breakdown: XpBreakdownItem[] = [
    { label: "完成天榜試煉", points: 15 },
  ];
  if (wins > 0) {
    breakdown.push({
      label: `試煉勝場 ×${wins}`,
      points: wins * 5,
    });
  }
  return {
    total: breakdown.reduce((sum, item) => sum + item.points, 0),
    breakdown,
  };
}

export function computeRecordXp(
  recordType: CultivationRecordType,
  input: {
    durationMinutes?: number;
    result?: CultivationMatchResult | null;
    trialWins?: number;
    trialLosses?: number;
  },
): { total: number; breakdown: XpBreakdownItem[] } {
  if (recordType === "retreat") {
    return computeRetreatXp(input.durationMinutes ?? 0);
  }
  if (recordType === "sparring") {
    return computeSparringXp(input.result ?? "draw");
  }
  return computeTrialXp(input.trialWins ?? 0, input.trialLosses ?? 0);
}
