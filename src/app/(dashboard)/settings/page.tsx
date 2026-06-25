import { SettingsForm } from "@/components/settings/settings-form";
import { KhpaSettingsCard } from "@/components/settings/khpa-settings-card";
import { KhpaVenuesSettings } from "@/components/settings/khpa-venues-settings";
import { XsVenuesSettings } from "@/components/settings/xs-venues-settings";
import { XsStaffSettingsCard } from "@/components/settings/xs-staff-settings-card";
import { SetupGuide } from "@/components/setup/setup-guide";
import { hasSupabaseEnv, getServiceRoleKey } from "@/lib/env";
import { getSettings } from "@/lib/actions/settings";
import { getKhpaAccountStatus } from "@/lib/actions/khpa-auth";
import { getXsStaffAccountStatus } from "@/lib/actions/xs-staff-auth";
import { getKhpaAllVenuesAdmin } from "@/lib/actions/khpa/venues";
import { getXsAllVenuesAdmin } from "@/lib/actions/xs/venues";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isAdmin = isAdminRole(user?.email);
    const hasServiceKey = Boolean(getServiceRoleKey());

    const [settings, khpaVenues, xsVenues] = await Promise.all([
      getSettings(),
      isAdmin && hasServiceKey
        ? getKhpaAllVenuesAdmin().catch(() => [])
        : Promise.resolve([]),
      isAdmin && hasServiceKey
        ? getXsAllVenuesAdmin().catch(() => [])
        : Promise.resolve([]),
    ]);

    let khpaAccount: Awaited<ReturnType<typeof getKhpaAccountStatus>> | null =
      null;
    let xsStaffAccount: Awaited<
      ReturnType<typeof getXsStaffAccountStatus>
    > | null = null;
    let accountSetupHint: string | null = null;

    if (isAdmin && !hasServiceKey) {
      accountSetupHint =
        "缺少 SUPABASE_SERVICE_ROLE_KEY。請至 Cloudflare Dashboard → Workers → Variables and Secrets 新增此 Secret（值取自 Supabase → Project Settings → API → service_role），儲存後重新部署，帳號管理區塊才會出現。";
    } else if (isAdmin && hasServiceKey) {
      try {
        [khpaAccount, xsStaffAccount] = await Promise.all([
          getKhpaAccountStatus(),
          getXsStaffAccountStatus(),
        ]);
      } catch (error) {
        accountSetupHint =
          error instanceof Error
            ? error.message
            : "無法載入協會／一般使用者帳號狀態";
      }
    }

    return (
      <div className="space-y-6">
        <SettingsForm initialSettings={settings} />
        {accountSetupHint && (
          <div className="max-w-lg rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950">
            {accountSetupHint}
          </div>
        )}
        {xsStaffAccount && <XsStaffSettingsCard account={xsStaffAccount} />}
        {isAdmin && hasServiceKey && (
          <XsVenuesSettings initialVenues={xsVenues} />
        )}
        {khpaAccount && <KhpaSettingsCard account={khpaAccount} />}
        {khpaAccount && <KhpaVenuesSettings initialVenues={khpaVenues} />}
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
