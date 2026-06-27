import type {
  CultivationMatchResult,
  CultivationRecord,
  CultivationRecordSource,
  CultivationRecordType,
  XpBreakdownItem,
} from "@/types/cultivation-journey";

function isDuprSource(source: CultivationRecordSource | undefined): boolean {
  return source === "xs_dupr" || source === "khpa_dupr";
}

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

export function computeSparringXp(
  result: CultivationMatchResult,
  source?: CultivationRecordSource,
): {
  total: number;
  breakdown: XpBreakdownItem[];
} {
  if (isDuprSource(source)) {
    const breakdown: XpBreakdownItem[] = [
      { label: "DUPR 天榜對戰", points: 15 },
    ];
    if (result === "win") {
      breakdown.push({ label: "DUPR 勝場（關鍵修為）", points: 40 });
    } else if (result === "loss") {
      breakdown.push({ label: "DUPR 落敗（渡劫修心）", points: 12 });
    } else {
      breakdown.push({ label: "DUPR 平局", points: 5 });
    }
    return {
      total: breakdown.reduce((sum, item) => sum + item.points, 0),
      breakdown,
    };
  }

  const breakdown: XpBreakdownItem[] = [
    { label: "友誼切磋", points: 8 },
  ];
  if (result === "win") {
    breakdown.push({ label: "切磋勝利", points: 2 });
  } else if (result === "loss") {
    breakdown.push({ label: "切磋落敗（修心）", points: 3 });
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
    source?: CultivationRecordSource;
  },
): { total: number; breakdown: XpBreakdownItem[] } {
  if (recordType === "retreat") {
    return computeRetreatXp(input.durationMinutes ?? 0);
  }
  if (recordType === "sparring") {
    return computeSparringXp(input.result ?? "draw", input.source);
  }
  return computeTrialXp(input.trialWins ?? 0, input.trialLosses ?? 0);
}

export function computeRecordXpFromRow(
  record: Pick<
    CultivationRecord,
    | "record_type"
    | "duration_minutes"
    | "result"
    | "trial_wins"
    | "trial_losses"
    | "source"
  >,
): { total: number; breakdown: XpBreakdownItem[] } {
  return computeRecordXp(record.record_type, {
    durationMinutes: record.duration_minutes ?? undefined,
    result: record.result,
    trialWins: record.trial_wins ?? undefined,
    trialLosses: record.trial_losses ?? undefined,
    source: record.source,
  });
}
