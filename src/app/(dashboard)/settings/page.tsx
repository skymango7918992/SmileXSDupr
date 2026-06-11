import { SettingsForm } from "@/components/settings/settings-form";
import { SetupGuide } from "@/components/setup/setup-guide";
import { hasSupabaseEnv } from "@/lib/env";
import { getSettings } from "@/lib/actions/settings";

export default async function SettingsPage() {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  try {
    const settings = await getSettings();
    return <SettingsForm initialSettings={settings} />;
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法載入設定"}
      />
    );
  }
}
