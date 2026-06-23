import { redirect } from "next/navigation";
import { KhpaDashboard } from "@/components/khpa/khpa-dashboard";
import {
  getKhpaAvailableYears,
  getKhpaLeaderboardBundle,
} from "@/lib/actions/khpa/leaderboard";
import { getKhpaAllPlayers } from "@/lib/actions/khpa/players";
import {
  ensureKhpaMatchDay,
  getKhpaMatchesForDate,
} from "@/lib/actions/khpa/sessions";
import { getKhpaVenues } from "@/lib/actions/khpa/venues";
import { isAdminRole } from "@/lib/auth/roles";
import { khpaHomePath } from "@/lib/khpa/paths";
import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/utils";

type Search = { tab?: string; venue?: string };

export async function KhpaHomeContent({ searchParams }: { searchParams: Search }) {
  const venues = await getKhpaVenues();

  if (venues.length === 0) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-semibold">尚未設定活動地點</p>
        <p className="mt-2 text-sm text-muted">
          請在 Supabase 執行 013_khpa.sql migration。
        </p>
      </div>
    );
  }

  const activeVenue =
    venues.find((v) => v.slug === searchParams.venue) ?? venues[0]!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = toISODate(new Date());
  const currentYear = new Date().getFullYear();

  await ensureKhpaMatchDay(activeVenue.id, today);

  const [allPlayers, matches, availableYears, leaderboard, canDelete] =
    await Promise.all([
      getKhpaAllPlayers(),
      getKhpaMatchesForDate(activeVenue.id, today),
      getKhpaAvailableYears(),
      getKhpaLeaderboardBundle(currentYear),
      Promise.resolve(isAdminRole(user?.email)),
    ]);

  const activePlayers = allPlayers.filter((p) => p.active);
  const { top3: leaderboardTop3, top10: leaderboardTop10 } = leaderboard;

  if (searchParams.venue && !venues.some((v) => v.slug === searchParams.venue)) {
    redirect(khpaHomePath());
  }

  return (
    <KhpaDashboard
      venues={venues}
      activeVenue={activeVenue}
      currentYear={currentYear}
      availableYears={availableYears}
      allPlayers={allPlayers}
      activePlayers={activePlayers}
      leaderboardTop10={leaderboardTop10}
      leaderboardTop3={leaderboardTop3}
      initialMatchDate={today}
      initialMatches={matches}
      canDelete={canDelete}
      isAdmin={isAdminRole(user?.email)}
    />
  );
}
