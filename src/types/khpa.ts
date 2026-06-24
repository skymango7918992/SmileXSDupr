import type { ScoreType } from "@/types/database";

export type KhpaVenue = {
  id: string;
  name: string;
  slug: string;
  court_count: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type KhpaPlayer = {
  id: string;
  display_name: string;
  name: string;
  dupr_id: string;
  dupr_rating: number | null;
  source: "club" | "manual";
  display_name_customized: boolean;
  active: boolean;
  avatar_gender: import("@/lib/cultivation-tiers").PlayerAvatarGender | null;
  created_at: string;
  updated_at: string;
};

export type KhpaMatchDay = {
  id: string;
  venue_id: string;
  match_date: string;
  created_at: string;
  updated_at: string;
};

export type KhpaScheduleSession = {
  id: string;
  match_day_id: string;
  venue_id: string;
  name: string;
  score_type: ScoreType;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type KhpaScheduleSessionWithStats = KhpaScheduleSession & {
  match_count: number;
  completed_count: number;
};

export type KhpaMatch = {
  id: string;
  schedule_session_id: string;
  round_number: number;
  team1_score: number | null;
  team2_score: number | null;
  status: "scheduled" | "completed";
  score_type: ScoreType;
  created_at: string;
  updated_at: string;
};

export type KhpaMatchPlayer = {
  id: string;
  match_id: string;
  player_id: string;
  team: 1 | 2;
  position: 1 | 2;
  player?: KhpaPlayer;
};

export type KhpaMatchWithPlayers = KhpaMatch & {
  khpa_match_players: (KhpaMatchPlayer & { player: KhpaPlayer })[];
};

export type KhpaLeaderboardEntry = {
  playerId: string;
  name: string;
  duprId: string;
  duprRating: number | null;
  avatarGender: import("@/lib/cultivation-tiers").PlayerAvatarGender | null;
  wins: number;
  losses: number;
  matches: number;
  winRate: number;
  rank: number;
};
