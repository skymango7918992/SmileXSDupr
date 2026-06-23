import { connection } from "next/server";
import { PlayerManagement } from "@/components/players/player-management";
import { SetupGuide } from "@/components/setup/setup-guide";
import { hasSupabaseEnv } from "@/lib/env";
import { getPlayers } from "@/lib/actions/players";
import { isStaffRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PlayersPage() {
  await connection();
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const players = await getPlayers();
    return (
      <PlayerManagement
        initialPlayers={players}
        readOnly={isStaffRole(user?.email)}
      />
    );
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法載入球員資料"}
      />
    );
  }
}
