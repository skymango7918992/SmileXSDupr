import { redirect } from "next/navigation";
import { CultivationJourneyHub } from "@/components/cultivation-journey/cultivation-journey-hub";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getCultivationJourney } from "@/lib/actions/cultivation-journey";
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
    const bundle = await getCultivationJourney();
    return <CultivationJourneyHub {...bundle} />;
  } catch (error) {
    return (
      <SetupGuide
        error={
          error instanceof Error
            ? `${error.message}（若為首次使用，請執行 020_cultivation_journey.sql）`
            : "無法載入修行軌跡"
        }
      />
    );
  }
}
