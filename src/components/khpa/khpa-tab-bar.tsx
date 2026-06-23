"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Swords, Trophy, Users } from "lucide-react";
import { khpaHomePath } from "@/lib/khpa/paths";
import { cn } from "@/lib/utils";

export type KhpaTab = "matches" | "players" | "leaderboard";

const TABS: { id: KhpaTab; label: string; shortLabel: string; icon: typeof Swords }[] = [
  { id: "matches", label: "今日對戰", shortLabel: "對戰", icon: Swords },
  { id: "players", label: "球員", shortLabel: "球員", icon: Users },
  { id: "leaderboard", label: "獲勝榜", shortLabel: "獲勝榜", icon: Trophy },
];

export function KhpaTabBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as KhpaTab) || "matches";

  const go = (tab: KhpaTab) => {
    const venue = searchParams.get("venue");
    router.replace(
      khpaHomePath({ tab, venue: venue ?? undefined }),
      { scroll: false },
    );
  };

  return (
    <nav
      className="khpa-tab-bar border-b border-divider bg-surface/95 backdrop-blur-md"
      role="tablist"
      aria-label="協會功能選單"
    >
      <div className="mx-auto flex max-w-3xl gap-1 px-2 py-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => go(tab.id)}
              className={cn(
                "btn-touch flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center transition-colors sm:flex-row sm:gap-2 sm:px-3",
                isActive
                  ? "glass-nav-active text-primary"
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[11px] font-semibold leading-tight sm:text-sm">
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
