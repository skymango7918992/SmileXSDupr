import { CheckInHub } from "@/components/checkin/checkin-hub";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getCheckInEvents } from "@/lib/actions/checkin";
import { hasSupabaseEnv } from "@/lib/env";

export default async function CheckInPage() {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  try {
    const events = await getCheckInEvents();
    return <CheckInHub events={events} />;
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法載入報到活動"}
      />
    );
  }
}
