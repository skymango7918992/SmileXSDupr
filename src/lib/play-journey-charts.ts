import type { ChartBucket, PlaySession } from "@/types/play-journey";

const MONTH_LABELS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
] as const;

export function getSessionYears(sessions: PlaySession[]): number[] {
  const years = new Set<number>();
  for (const s of sessions) {
    years.add(Number(s.played_on.slice(0, 4)));
  }
  const current = new Date().getFullYear();
  years.add(current);
  return [...years].sort((a, b) => a - b);
}

export function computeMonthlyChart(
  sessions: PlaySession[],
  year: number,
): ChartBucket[] {
  const buckets = MONTH_LABELS.map((label, i) => ({
    key: `${year}-${String(i + 1).padStart(2, "0")}`,
    label,
    minutes: 0,
    sessions: 0,
  }));

  for (const s of sessions) {
    const y = Number(s.played_on.slice(0, 4));
    const m = Number(s.played_on.slice(5, 7));
    if (y !== year || m < 1 || m > 12) continue;
    const bucket = buckets[m - 1];
    bucket.minutes += s.duration_minutes;
    bucket.sessions += 1;
  }

  return buckets;
}

export function computeYearlyChart(sessions: PlaySession[]): ChartBucket[] {
  const map = new Map<number, ChartBucket>();

  for (const s of sessions) {
    const year = Number(s.played_on.slice(0, 4));
    const existing = map.get(year);
    if (!existing) {
      map.set(year, {
        key: String(year),
        label: `${year}`,
        minutes: s.duration_minutes,
        sessions: 1,
      });
      continue;
    }
    existing.minutes += s.duration_minutes;
    existing.sessions += 1;
  }

  return [...map.values()].sort((a, b) => Number(a.key) - Number(b.key));
}

export function minutesToChartHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}
