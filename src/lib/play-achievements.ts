import { countDistinctVenues, countMappedVenues } from "@/lib/play-map-markers";
import type {
  Achievement,
  AchievementId,
  JourneyStats,
  PlaySession,
} from "@/types/play-journey";

const DEFINITIONS: Record<
  AchievementId,
  Omit<Achievement, "unlocked" | "progress">
> = {
  first_step: {
    id: "first_step",
    title: "第一步",
    description: "寫下第一筆打球紀錄",
    emoji: "👟",
  },
  hours_10: {
    id: "hours_10",
    title: "十小時選手",
    description: "累積打球 10 小時",
    emoji: "⏱️",
  },
  hours_50: {
    id: "hours_50",
    title: "五十小時達人",
    description: "累積打球 50 小時",
    emoji: "🔥",
  },
  hours_100: {
    id: "hours_100",
    title: "百小時傳說",
    description: "累積打球 100 小時",
    emoji: "👑",
  },
  sessions_10: {
    id: "sessions_10",
    title: "十場起步",
    description: "完成 10 次打球紀錄",
    emoji: "🎯",
  },
  sessions_30: {
    id: "sessions_30",
    title: "三十場老手",
    description: "完成 30 次打球紀錄",
    emoji: "🏅",
  },
  venues_3: {
    id: "venues_3",
    title: "球館新手",
    description: "踩過 3 個不同地點",
    emoji: "📍",
  },
  venues_5: {
    id: "venues_5",
    title: "足跡收集家",
    description: "踩過 5 個不同地點",
    emoji: "🗺️",
  },
  venues_10: {
    id: "venues_10",
    title: "巡迴選手",
    description: "踩過 10 個不同地點",
    emoji: "🌍",
  },
  dual_sport: {
    id: "dual_sport",
    title: "雙棲球員",
    description: "羽球與匹克球都有紀錄",
    emoji: "🎾",
  },
  early_bird: {
    id: "early_bird",
    title: "早鳥選手",
    description: "有一場早上 9 點前開打",
    emoji: "🌅",
  },
  night_owl: {
    id: "night_owl",
    title: "夜貓選手",
    description: "有一場晚上 9 點後開打",
    emoji: "🌙",
  },
  streak_4w: {
    id: "streak_4w",
    title: "四週不斷線",
    description: "連續 4 週都有打球紀錄",
    emoji: "💫",
  },
  marathon_day: {
    id: "marathon_day",
    title: "激戰一日",
    description: "單日累積打球 3 小時以上",
    emoji: "⚡",
  },
  map_pin_5: {
    id: "map_pin_5",
    title: "地圖探險家",
    description: "地圖上標記 5 個不同球館",
    emoji: "🧭",
  },
};

function parseTimeMinutes(time: string | null): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function hasEarlyBird(sessions: PlaySession[]): boolean {
  return sessions.some((s) => {
    const mins = parseTimeMinutes(s.start_time);
    return mins !== null && mins < 9 * 60;
  });
}

function hasNightOwl(sessions: PlaySession[]): boolean {
  return sessions.some((s) => {
    const mins = parseTimeMinutes(s.start_time);
    return mins !== null && mins >= 21 * 60;
  });
}

function hasMarathonDay(sessions: PlaySession[]): boolean {
  const byDate = new Map<string, number>();
  for (const s of sessions) {
    byDate.set(s.played_on, (byDate.get(s.played_on) ?? 0) + s.duration_minutes);
  }
  return [...byDate.values()].some((mins) => mins >= 180);
}

function withProgress(
  id: AchievementId,
  unlocked: boolean,
  current: number,
  target: number,
): Achievement {
  return {
    ...DEFINITIONS[id],
    unlocked,
    progress: unlocked ? undefined : { current, target },
  };
}

export function computeJourneyStats(sessions: PlaySession[]): JourneyStats {
  const total_minutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const pickleball_sessions = sessions.filter(
    (s) => s.sport_type === "pickleball",
  ).length;
  const badminton_sessions = sessions.filter(
    (s) => s.sport_type === "badminton",
  ).length;

  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() + mondayOffset);
  const weekStartIso = weekStart.toISOString().slice(0, 10);

  const thisWeek = sessions.filter((s) => s.played_on >= weekStartIso);

  const weekSet = new Set(
    sessions.map((s) => {
      const d = new Date(`${s.played_on}T12:00:00`);
      const dow = d.getDay();
      const offset = dow === 0 ? -6 : 1 - dow;
      const mon = new Date(d);
      mon.setDate(d.getDate() + offset);
      return mon.toISOString().slice(0, 10);
    }),
  );

  let week_streak = 0;
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  const cdow = cursor.getDay();
  const coff = cdow === 0 ? -6 : 1 - cdow;
  cursor.setDate(cursor.getDate() + coff);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!weekSet.has(key)) break;
    week_streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  return {
    total_minutes,
    total_sessions: sessions.length,
    venue_count: countDistinctVenues(sessions),
    mapped_venue_count: countMappedVenues(sessions),
    pickleball_sessions,
    badminton_sessions,
    this_week_sessions: thisWeek.length,
    this_week_minutes: thisWeek.reduce((sum, s) => sum + s.duration_minutes, 0),
    week_streak,
  };
}

export function computeAchievements(
  sessions: PlaySession[],
  stats: JourneyStats,
): Achievement[] {
  const hours = stats.total_minutes / 60;
  const dual =
    stats.pickleball_sessions > 0 && stats.badminton_sessions > 0;

  return [
    withProgress(
      "first_step",
      stats.total_sessions >= 1,
      stats.total_sessions,
      1,
    ),
    withProgress("hours_10", hours >= 10, Math.floor(hours), 10),
    withProgress("hours_50", hours >= 50, Math.floor(hours), 50),
    withProgress("hours_100", hours >= 100, Math.floor(hours), 100),
    withProgress(
      "sessions_10",
      stats.total_sessions >= 10,
      stats.total_sessions,
      10,
    ),
    withProgress(
      "sessions_30",
      stats.total_sessions >= 30,
      stats.total_sessions,
      30,
    ),
    withProgress(
      "venues_3",
      stats.venue_count >= 3,
      stats.venue_count,
      3,
    ),
    withProgress(
      "venues_5",
      stats.venue_count >= 5,
      stats.venue_count,
      5,
    ),
    withProgress(
      "venues_10",
      stats.venue_count >= 10,
      stats.venue_count,
      10,
    ),
    { ...DEFINITIONS.dual_sport, unlocked: dual },
    { ...DEFINITIONS.early_bird, unlocked: hasEarlyBird(sessions) },
    { ...DEFINITIONS.night_owl, unlocked: hasNightOwl(sessions) },
    withProgress(
      "streak_4w",
      stats.week_streak >= 4,
      stats.week_streak,
      4,
    ),
    { ...DEFINITIONS.marathon_day, unlocked: hasMarathonDay(sessions) },
    withProgress(
      "map_pin_5",
      stats.mapped_venue_count >= 5,
      stats.mapped_venue_count,
      5,
    ),
  ];
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} 分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} 小時`;
  return `${h} 小時 ${m} 分`;
}

export function formatHoursDecimal(minutes: number): string {
  const h = minutes / 60;
  if (h < 10) return h.toFixed(1);
  return Math.round(h).toString();
}

export function formatTimeLabel(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}
