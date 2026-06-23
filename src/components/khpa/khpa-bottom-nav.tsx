"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Swords, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type KhpaTab = "matches" | "players" | "leaderboard";

const TABS: { id: KhpaTab; label: string; icon: typeof Swords }[] = [
  { id: "matches", label: "今日對戰", icon: Swords },
  { id: "players", label: "球員", icon: Users },
  { id: "leaderboard", label: "獲勝榜", icon: Trophy },
];

export function KhpaBottomNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as KhpaTab) || "matches";

  const go = (tab: KhpaTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/khpa?${params.toString()}`, { scroll: false });
  };

  return (
    <nav className="glass-header fixed inset-x-0 bottom-0 z-50 border-t border-divider pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-3xl px-2 pt-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => go(tab.id)}
              className={cn(
                "btn-touch flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  isActive && "glass-nav-active",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
