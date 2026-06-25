import { redirect } from "next/navigation";
import { KhpaHomeContent } from "@/components/khpa/khpa-home-content";
import { LeaderboardTop3 } from "@/components/leaderboard/leaderboard-top3";
import { XsMatchCenter } from "@/components/xs/xs-match-center";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getLeaderboard, getLeaderboardTop3 } from "@/lib/actions/leaderboard";
import { getPlayers } from "@/lib/actions/players";
import {
  ensureXsMatchDay,
  getXsCanDelete,
  getXsMatchesForDate,
} from "@/lib/actions/xs/match-flow";
import { getXsVenues } from "@/lib/actions/xs/venues";
import { getRoleFromEmail } from "@/lib/auth/roles";
import { hasSupabaseEnv } from "@/lib/env";
import { isKhpaPortal } from "@/lib/khpa/paths";
import { xsHomePath } from "@/lib/xs/paths";
import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/leaderboard";

type Props = {
  searchParams: Promise<{
    portal?: string;
    tab?: string;
    venue?: string;
  }>;
};

export default async function HomePage({ searchParams }: Props) {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = getRoleFromEmail(user?.email) ?? null;

  if (isKhpaPortal(params.portal, role)) {
    return (
      <KhpaHomeContent
        searchParams={{ tab: params.tab, venue: params.venue }}
      />
    );
  }

  const today = toISODate(new Date());

  try {
    const [players, venues] = await Promise.all([
      getPlayers(true),
      getXsVenues(),
    ]);

    if (venues.length === 0) {
      return (
        <SetupGuide error="尚未設定星鑽活動場地，請至設定頁新增或執行 migration 019。" />
      );
    }

    const venueSlug = params.venue ?? "yuyi";
    let activeVenue = venues.find((v) => v.slug === venueSlug) ?? venues[0]!;

    if (params.venue && !venues.some((v) => v.slug === params.venue)) {
      redirect(xsHomePath({ venue: activeVenue.slug }));
    }

    let top3: LeaderboardEntry[] = [];
    let leaderboardError: string | null = null;
    let playerStats: Record<string, { wins: number; winRate: number }> = {};

    try {
      const [top3List, leaderboard] = await Promise.all([
        getLeaderboardTop3(),
        getLeaderboard(),
      ]);
      top3 = top3List;
      playerStats = Object.fromEntries(
        leaderboard.map((e) => [
          e.playerId,
          { wins: e.wins, winRate: e.winRate },
        ]),
      );
    } catch (e) {
      leaderboardError =
        e instanceof Error ? e.message : "獲勝榜資料讀取失敗";
    }

    await ensureXsMatchDay(activeVenue.id, today);
    const [matches, canDelete] = await Promise.all([
      getXsMatchesForDate(activeVenue.id, today),
      getXsCanDelete(),
    ]);

    return (
      <div className="space-y-6">
        <LeaderboardTop3 entries={top3} error={leaderboardError} />
        <XsMatchCenter
          venues={venues}
          initialVenueId={activeVenue.id}
          players={players}
          initialMatchDate={today}
          initialMatches={matches}
          playerStats={playerStats}
          canDelete={canDelete}
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
