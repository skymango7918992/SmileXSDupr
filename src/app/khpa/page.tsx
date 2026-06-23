import { redirect } from "next/navigation";
import { KhpaDashboard } from "@/components/khpa/khpa-dashboard";
import {
  getKhpaAvailableYears,
  getKhpaLeaderboardTop10,
  getKhpaLeaderboardTop3,
} from "@/lib/actions/khpa/leaderboard";
import { getKhpaAllPlayers, getKhpaPlayers } from "@/lib/actions/khpa/players";
import {
  ensureKhpaMatchDay,
  getKhpaCanDelete,
  getKhpaMatchesForDate,
} from "@/lib/actions/khpa/sessions";
import { getKhpaVenues } from "@/lib/actions/khpa/venues";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ tab?: string; venue?: string }>;
};

export default async function KhpaHomePage({ searchParams }: Props) {
  const params = await searchParams;
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
    venues.find((v) => v.slug === params.venue) ?? venues[0]!;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = toISODate(new Date());
  const currentYear = new Date().getFullYear();

  await ensureKhpaMatchDay(activeVenue.id, today);

  const [allPlayers, activePlayers, matches, availableYears, leaderboardTop10, canDelete] =
    await Promise.all([
      getKhpaAllPlayers(),
      getKhpaPlayers(true),
      getKhpaMatchesForDate(activeVenue.id, today),
      getKhpaAvailableYears(),
      getKhpaLeaderboardTop10(currentYear),
      getKhpaCanDelete(),
    ]);

  const leaderboardTop3 = await getKhpaLeaderboardTop3(currentYear);

  if (params.venue && !venues.some((v) => v.slug === params.venue)) {
    redirect("/khpa");
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
