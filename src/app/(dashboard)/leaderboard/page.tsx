import { SetupGuide } from "@/components/setup/setup-guide";
import { LeaderboardFull } from "@/components/leaderboard/leaderboard-full";
import { getLeaderboard } from "@/lib/actions/leaderboard";
import { hasSupabaseEnv } from "@/lib/env";

export default async function LeaderboardPage() {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  try {
    const entries = await getLeaderboard();
    return <LeaderboardFull entries={entries} />;
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法載入獲勝榜"}
      />
    );
  }
}
