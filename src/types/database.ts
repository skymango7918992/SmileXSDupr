export type Player = {
  id: string;
  name: string;
  dupr_id: string;
  active: boolean;
  dupr_rating: number | null;
  created_at: string;
  updated_at: string;
};

export type MatchDay = {
  id: string;
  match_date: string;
  selected_player_ids: string[];
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  match_day_id: string;
  round_number: number;
  team1_score: number | null;
  team2_score: number | null;
  status: "scheduled" | "completed";
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
  updated_at: string;
};
