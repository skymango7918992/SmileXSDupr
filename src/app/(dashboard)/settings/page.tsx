import { Suspense } from "react";
import { SettingsForm } from "@/components/settings/settings-form";
import { KhpaSettingsCard } from "@/components/settings/khpa-settings-card";
import { KhpaVenuesSettings } from "@/components/settings/khpa-venues-settings";
import { XsVenuesSettings } from "@/components/settings/xs-venues-settings";
import { XsStaffSettingsCard } from "@/components/settings/xs-staff-settings-card";
import {
  SettingsHub,
  type SettingsSection,
} from "@/components/settings/settings-hub";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { SetupGuide } from "@/components/setup/setup-guide";
import { hasSupabaseEnv, getServiceRoleKey } from "@/lib/env";
import { getSettings } from "@/lib/actions/settings";
import { getKhpaAccountStatus } from "@/lib/actions/khpa-auth";
import { getXsStaffAccountStatus } from "@/lib/actions/xs-staff-auth";
import { getKhpaAllVenuesAdmin } from "@/lib/actions/khpa/venues";
import { getXsAllVenuesAdmin } from "@/lib/actions/xs/venues";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  try {
    const params = await searchParams;
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

    const showAccounts = Boolean(xsStaffAccount || khpaAccount);
    const showVenues = isAdmin && hasServiceKey;

    const availableSections: SettingsSection[] = ["general"];
    if (showAccounts) availableSections.push("accounts");
    if (showVenues) availableSections.push("venues");

    const cardClass = "max-w-none";

    const defaultSection: SettingsSection | undefined =
      params.tab === "accounts" ||
      params.tab === "venues" ||
      params.tab === "general"
        ? params.tab
        : undefined;

    return (
      <Suspense fallback={<div className="text-sm text-muted">載入設定…</div>}>
        <SettingsHub
          availableSections={availableSections}
          defaultSection={defaultSection}
          accountSetupHint={accountSetupHint}
          general={
            <SettingsForm
              initialSettings={settings}
              className={cardClass}
            />
          }
          accounts={
            showAccounts ? (
              <SettingsPanel columns={xsStaffAccount && khpaAccount ? 2 : 1}>
                {xsStaffAccount && (
                  <XsStaffSettingsCard
                    account={xsStaffAccount}
                    className={cardClass}
                  />
                )}
                {khpaAccount && (
                  <KhpaSettingsCard
                    account={khpaAccount}
                    className={cardClass}
                  />
                )}
              </SettingsPanel>
            ) : undefined
          }
          venues={
            isAdmin && hasServiceKey ? (
              <SettingsPanel
                columns={
                  xsVenues.length > 0 && khpaVenues.length > 0 ? 2 : 1
                }
              >
                <XsVenuesSettings
                  initialVenues={xsVenues}
                  className={cardClass}
                />
                <KhpaVenuesSettings
                  initialVenues={khpaVenues}
                  className={cardClass}
                />
              </SettingsPanel>
            ) : undefined
          }
        />
      </Suspense>
    );
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法載入設定"}
      />
    );
  }
}
