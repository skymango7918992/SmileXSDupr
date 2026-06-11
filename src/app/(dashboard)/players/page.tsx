import { PlayerManagement } from "@/components/players/player-management";
import { SetupGuide } from "@/components/setup/setup-guide";
import { hasSupabaseEnv } from "@/lib/env";
import { getPlayers } from "@/lib/actions/players";

export default async function PlayersPage() {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  try {
    const players = await getPlayers();
    return <PlayerManagement initialPlayers={players} />;
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法載入球員資料"}
      />
    );
  }
}
