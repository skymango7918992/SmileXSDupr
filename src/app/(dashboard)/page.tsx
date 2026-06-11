import { LeaderboardTop3 } from "@/components/leaderboard/leaderboard-top3";
import { MatchCenter } from "@/components/match/match-center";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getLeaderboardTop3 } from "@/lib/actions/leaderboard";
import type { LeaderboardEntry } from "@/types/leaderboard";
import {
  getMatchDay,
  getMatchesForSession,
  getSessionPlayers,
  getSessionsForDate,
} from "@/lib/actions/sessions";
import { getPlayers } from "@/lib/actions/players";
import { hasSupabaseEnv } from "@/lib/env";
import { getSettings } from "@/lib/actions/settings";
import { toISODate } from "@/lib/utils";

export default async function HomePage() {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  const today = toISODate(new Date());

  try {
    const [players, settings, sessions] = await Promise.all([
      getPlayers(true),
      getSettings(),
      getSessionsForDate(today),
    ]);

    let top3: LeaderboardEntry[] = [];
    let leaderboardError: string | null = null;
    try {
      top3 = await getLeaderboardTop3();
    } catch (e) {
      leaderboardError =
        e instanceof Error ? e.message : "獲勝榜資料讀取失敗";
    }

    const activeSessionId = sessions[0]?.id ?? null;

    let matches: Awaited<ReturnType<typeof getMatchesForSession>> = [];
    let selectedIds: string[] = [];

    if (activeSessionId) {
      const [matchList, roster] = await Promise.all([
        getMatchesForSession(activeSessionId),
        getSessionPlayers(activeSessionId),
      ]);
      matches = matchList;
      selectedIds = roster.map((r) => r.player_id);
    }

    await getMatchDay(today);

    return (
      <div className="space-y-6">
        <LeaderboardTop3 entries={top3} error={leaderboardError} />
        <MatchCenter
          players={players}
          initialMatchDate={today}
          initialSessions={sessions}
          initialSessionId={activeSessionId}
          initialMatches={matches}
          initialSelectedIds={selectedIds}
          settings={settings}
        />
      </div>
    );
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法連線至 Supabase"}
      />
    );
  }
}
