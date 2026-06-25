"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, MapPin, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsSection = "general" | "accounts" | "venues";

type SectionConfig = {
  id: SettingsSection;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

const SECTION_META: Record<SettingsSection, Omit<SectionConfig, "id">> = {
  general: {
    label: "應用設定",
    shortLabel: "應用",
    description: "球隊名稱、DUPR、登入信任裝置",
    icon: Settings,
  },
  accounts: {
    label: "帳號管理",
    shortLabel: "帳號",
    description: "星鑽與協會共用登入帳號",
    icon: KeyRound,
  },
  venues: {
    label: "活動場地",
    shortLabel: "場地",
    description: "星鑽與協會對戰地點",
    icon: MapPin,
  },
};

type Props = {
  availableSections: SettingsSection[];
  defaultSection?: SettingsSection;
  accountSetupHint?: string | null;
  general: React.ReactNode;
  accounts?: React.ReactNode;
  venues?: React.ReactNode;
};

function isSettingsSection(value: string | null): value is SettingsSection {
  return value === "general" || value === "accounts" || value === "venues";
}

export function SettingsHub({
  availableSections,
  defaultSection,
  accountSetupHint,
  general,
  accounts,
  venues,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const initialSection =
    tabParam && isSettingsSection(tabParam) && availableSections.includes(tabParam)
      ? tabParam
      : defaultSection && availableSections.includes(defaultSection)
        ? defaultSection
        : availableSections[0] ?? "general";

  const [active, setActive] = useState<SettingsSection>(initialSection);

  const sections = useMemo(
    () =>
      availableSections.map((id) => ({
        id,
        ...SECTION_META[id],
      })),
    [availableSections],
  );

  const syncUrl = useCallback(
    (section: SettingsSection) => {
      const params = new URLSearchParams(searchParams.toString());
      if (section === "general") {
        params.delete("tab");
      } else {
        params.set("tab", section);
      }
      const query = params.toString();
      router.replace(query ? `/settings?${query}` : "/settings", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const selectSection = (section: SettingsSection) => {
    setActive(section);
    syncUrl(section);
  };

  const content =
    active === "accounts"
      ? accounts
      : active === "venues"
        ? venues
        : general;

  if (sections.length <= 1) {
    return (
      <div className="space-y-4">
        {accountSetupHint && <SettingsHint message={accountSetupHint} />}
        {general}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-foreground">設定</h1>
        <p className="mt-1 text-sm text-muted">
          依類別管理應用、帳號與活動場地
        </p>
      </header>

      {accountSetupHint && <SettingsHint message={accountSetupHint} />}

      {/* 手機：橫向分類分頁 */}
      <nav
        className="overflow-x-auto pb-1 lg:hidden"
        role="tablist"
        aria-label="設定分類"
      >
        <div className="flex min-w-min gap-2 px-0.5">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectSection(section.id)}
                className={cn(
                  "btn-touch flex min-w-[5.5rem] shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2.5 transition-colors",
                  isActive
                    ? "glass-nav-active"
                    : "border border-border bg-surface hover:bg-surface-muted",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary" : "text-muted",
                  )}
                />
                <span className="text-xs font-semibold leading-tight">
                  {section.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(12rem,14rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* 桌面：左側分類導覽 */}
        <nav
          className="hidden lg:block lg:sticky lg:top-20"
          role="tablist"
          aria-label="設定分類"
        >
          <ul className="space-y-1.5">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = active === section.id;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => selectSection(section.id)}
                    className={cn(
                      "btn-touch flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                      isActive
                        ? "glass-nav-active"
                        : "border border-transparent hover:border-border hover:bg-surface-muted",
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 h-5 w-5 shrink-0",
                        isActive ? "text-primary" : "text-muted",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {section.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">
                        {section.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className="min-w-0 space-y-4"
          role="tabpanel"
          aria-label={SECTION_META[active].label}
        >
          {/* 手機：顯示目前分類標題 */}
          <div className="rounded-xl border border-border bg-surface-muted/40 px-3 py-2 lg:hidden">
            <p className="text-sm font-semibold text-foreground">
              {SECTION_META[active].label}
            </p>
            <p className="text-xs text-muted">{SECTION_META[active].description}</p>
          </div>

          {content}
        </div>
      </div>
    </div>
  );
}

function SettingsHint({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950">
      {message}
    </div>
  );
}
