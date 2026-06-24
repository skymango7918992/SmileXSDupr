export type LeaderboardEntry = {
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
