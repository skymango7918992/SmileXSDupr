export type ScoreType = "sideout" | "rally";

export type PlayerSource = "manual" | "club";

export type Player = {
  id: string;
  /** DUPR 官方名稱（Club 同步寫入） */
  name: string;
  /** 介面顯示用名稱，可自訂中文 */
  display_name: string;
  display_name_customized: boolean;
  dupr_id: string;
  active: boolean;
  dupr_rating: number | null;
  source: PlayerSource;
  /** 境界頭像性別 */
  avatar_gender: import("@/lib/cultivation-tiers").PlayerAvatarGender | null;
  created_at: string;
  updated_at: string;
};

export type MatchDay = {
  id: string;
  venue_id: string;
  match_date: string;
  selected_player_ids: string[];
  created_at: string;
  updated_at: string;
};

export type ScheduleSession = {
  id: string;
  match_day_id: string;
  venue_id?: string | null;
  name: string;
  sort_order: number;
  status: "draft" | "active" | "closed";
  score_type: ScoreType;
  created_at: string;
  updated_at: string;
};

export type SessionPlayer = {
  id: string;
  schedule_session_id: string;
  player_id: string;
  joined_after_round: number;
  joined_at: string;
  player?: Player;
};

export type ScheduleSessionWithStats = ScheduleSession & {
  player_count: number;
  match_count: number;
  completed_count: number;
};

export type Match = {
  id: string;
  match_day_id: string;
  schedule_session_id: string | null;
  round_number: number;
  team1_score: number | null;
  team2_score: number | null;
  status: "scheduled" | "completed";
  score_type?: ScoreType | null;
  created_at: string;
  updated_at: string;
};

export type MatchPlayer = {
  id: string;
  match_id: string;
  player_id: string;
  team: 1 | 2;
  position: 1 | 2;
  player?: Player;
};

export type MatchWithPlayers = Match & {
  match_players: (MatchPlayer & { player: Player })[];
};

export type AppSettings = {
  id: string;
  team_name: string;
  default_court_count: number;
  trusted_device_days: number;
  xs_dupr_club_id: string;
  khpa_dupr_club_id: string;
  updated_at: string;
};
