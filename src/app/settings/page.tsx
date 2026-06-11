import { SettingsForm } from "@/components/settings/settings-form";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getSettings } from "@/lib/actions/settings";

export default async function SettingsPage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
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
