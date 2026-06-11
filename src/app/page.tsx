import { MatchCenter } from "@/components/match/match-center";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getMatchDay, getMatchesForDate } from "@/lib/actions/matches";
import { getPlayers } from "@/lib/actions/players";
import { getSettings } from "@/lib/actions/settings";
import { toISODate } from "@/lib/utils";

export default async function HomePage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <SetupGuide />;
  }

  const today = toISODate(new Date());

  try {
    const [players, matchDay, matches, settings] = await Promise.all([
      getPlayers(true),
      getMatchDay(today),
      getMatchesForDate(today),
      getSettings(),
    ]);

    return (
      <MatchCenter
        players={players}
        initialMatchDate={today}
        initialMatchDay={matchDay}
        initialMatches={matches}
        settings={settings}
      />
    );
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法連線至 Supabase"}
      />
    );
  }
}
