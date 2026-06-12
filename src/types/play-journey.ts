export type JourneySport = "pickleball" | "badminton";

export type PlaySavedPlace = {
  id: string;
  label: string;
  venue_name: string;
  address: string;
  team_name: string;
  sport_type: JourneySport | null;
  latitude: number | null;
  longitude: number | null;
  default_duration_minutes: number | null;
  use_count: number;
  last_used_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PlaySession = {
  id: string;
  played_on: string;
  sport_type: JourneySport;
  start_time: string | null;
  duration_minutes: number;
  venue_name: string;
  team_name: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type MapMarker = {
  id: string;
  venue_name: string;
  latitude: number;
  longitude: number;
  session_count: number;
  total_minutes: number;
  sports: JourneySport[];
  last_played_on: string;
};

export type JourneyStats = {
  total_minutes: number;
  total_sessions: number;
  venue_count: number;
  mapped_venue_count: number;
  pickleball_sessions: number;
  badminton_sessions: number;
  this_week_sessions: number;
  this_week_minutes: number;
  week_streak: number;
};

export type ChartBucket = {
  key: string;
  label: string;
  minutes: number;
  sessions: number;
};

export type AchievementId =
  | "first_step"
  | "hours_10"
  | "hours_50"
  | "hours_100"
  | "sessions_10"
  | "sessions_30"
  | "venues_3"
  | "venues_5"
  | "venues_10"
  | "dual_sport"
  | "early_bird"
  | "night_owl"
  | "streak_4w"
  | "marathon_day"
  | "map_pin_5";

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress?: { current: number; target: number };
};

export const JOURNEY_SPORT_LABELS: Record<JourneySport, string> = {
  pickleball: "匹克球",
  badminton: "羽球",
};
