import { redirect } from "next/navigation";
import { CultivationJourneyHub } from "@/components/cultivation-journey/cultivation-journey-hub";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getCultivationJourney } from "@/lib/actions/cultivation-journey";
import {
  getPracticeLocations,
  getTechniqueProgressList,
} from "@/lib/actions/technique-practice";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function CultivationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminRole(user?.email)) {
    redirect("/");
  }

  try {
    const [bundle, techniqueProgress, practiceLocations] = await Promise.all([
      getCultivationJourney(),
      getTechniqueProgressList(),
      getPracticeLocations(),
    ]);

    return (
      <CultivationJourneyHub
        {...bundle}
        techniqueProgress={techniqueProgress}
        practiceLocations={practiceLocations}
      />
    );
  } catch (error) {
    return (
      <SetupGuide
        error={
          error instanceof Error
            ? `${error.message}（請執行 020、021 migration）`
            : "無法載入修行軌跡"
        }
      />
    );
  }
}
