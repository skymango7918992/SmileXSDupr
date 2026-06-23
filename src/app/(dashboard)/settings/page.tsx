import { SettingsForm } from "@/components/settings/settings-form";
import { KhpaSettingsCard } from "@/components/settings/khpa-settings-card";
import { KhpaVenuesSettings } from "@/components/settings/khpa-venues-settings";
import { XsStaffSettingsCard } from "@/components/settings/xs-staff-settings-card";
import { SetupGuide } from "@/components/setup/setup-guide";
import { hasSupabaseEnv } from "@/lib/env";
import { getSettings } from "@/lib/actions/settings";
import { getKhpaAccountStatus } from "@/lib/actions/khpa-auth";
import { getXsStaffAccountStatus } from "@/lib/actions/xs-staff-auth";
import { getKhpaAllVenuesAdmin } from "@/lib/actions/khpa/venues";

export default async function SettingsPage() {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  try {
    const [settings, khpaAccount, xsStaffAccount, khpaVenues] = await Promise.all([
      getSettings(),
      getKhpaAccountStatus().catch(() => null),
      getXsStaffAccountStatus().catch(() => null),
      getKhpaAllVenuesAdmin().catch(() => []),
    ]);
    return (
      <div className="space-y-6">
        <SettingsForm initialSettings={settings} />
        {xsStaffAccount && <XsStaffSettingsCard account={xsStaffAccount} />}
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
