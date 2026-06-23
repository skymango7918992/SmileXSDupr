import { SettingsForm } from "@/components/settings/settings-form";
import { KhpaSettingsCard } from "@/components/settings/khpa-settings-card";
import { KhpaVenuesSettings } from "@/components/settings/khpa-venues-settings";
import { SetupGuide } from "@/components/setup/setup-guide";
import { hasSupabaseEnv } from "@/lib/env";
import { getSettings } from "@/lib/actions/settings";
import { getKhpaAccountStatus } from "@/lib/actions/khpa-auth";
import { getKhpaAllVenuesAdmin } from "@/lib/actions/khpa/venues";

export default async function SettingsPage() {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  try {
    const [settings, khpaAccount, khpaVenues] = await Promise.all([
      getSettings(),
      getKhpaAccountStatus().catch(() => null),
      getKhpaAllVenuesAdmin().catch(() => []),
    ]);
    return (
      <div className="space-y-6">
        <SettingsForm initialSettings={settings} />
        {khpaAccount && <KhpaSettingsCard account={khpaAccount} />}
        {khpaAccount && (
          <KhpaVenuesSettings initialVenues={khpaVenues} />
        )}
      </div>
    );
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法載入設定"}
      />
    );
  }
}
