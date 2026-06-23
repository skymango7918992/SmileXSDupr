"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { KhpaTabBar, type KhpaTab } from "@/components/khpa/khpa-tab-bar";
import { KhpaHeader } from "@/components/khpa/khpa-header";
import { KhpaLeaderboardPanel } from "@/components/khpa/khpa-leaderboard-panel";
import { KhpaMatchCenter } from "@/components/khpa/khpa-match-center";
import { KhpaPlayersManager } from "@/components/khpa/khpa-players-manager";
import type { KhpaLeaderboardEntry } from "@/types/khpa";
import type {
  KhpaMatchWithPlayers,
  KhpaPlayer,
  KhpaVenue,
} from "@/types/khpa";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { khpaHomePath } from "@/lib/khpa/paths";

type Props = {
  venues: KhpaVenue[];
  activeVenue: KhpaVenue;
  currentYear: number;
  availableYears: number[];
  allPlayers: KhpaPlayer[];
  activePlayers: KhpaPlayer[];
  leaderboardTop10: KhpaLeaderboardEntry[];
  leaderboardTop3: KhpaLeaderboardEntry[];
  initialMatchDate: string;
  initialMatches: KhpaMatchWithPlayers[];
  canDelete: boolean;
  isAdmin: boolean;
};

function parseTab(value: string | null): KhpaTab {
  if (value === "players" || value === "leaderboard") return value;
  return "matches";
}

function KhpaDashboardInner({
  venues,
  activeVenue,
  currentYear,
  availableYears,
  allPlayers,
  activePlayers,
  leaderboardTop10,
  leaderboardTop3,
  initialMatchDate,
  initialMatches,
  canDelete,
  isAdmin,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const goTab = useCallback(
    (next: KhpaTab) => {
      const venue = searchParams.get("venue");
      router.replace(
        khpaHomePath({ tab: next, venue: venue ?? undefined }),
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const showGuide = allPlayers.length === 0 && tab === "matches";

  return (
    <>
      <div className="khpa-sticky-shell sticky top-0 z-40">
        <KhpaHeader venues={venues} isAdmin={isAdmin} />
        <KhpaTabBar />
      </div>

      <main className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-3 pb-6 pt-3 sm:px-6 sm:pb-8 sm:pt-4">
        {showGuide && (
          <Card className="mb-4 border-primary/25 bg-gradient-to-br from-primary/5 to-white p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              第一次使用？照這三步驟
            </div>
            <ol className="space-y-2 text-sm text-foreground/90">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  1
                </span>
                先到「球員」新增球員（DUPR ID 必填）
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  2
                </span>
                回到「今日對戰」，按「新增成績」
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  3
                </span>
                選四位不同球員、輸入比分（預設發球得分）
              </li>
            </ol>
            <Button className="btn-touch mt-3 w-full" onClick={() => goTab("players")}>
              前往新增球員
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        )}

        {tab === "matches" && (
          <div className="space-y-4">
            <KhpaLeaderboardPanel
              availableYears={availableYears}
              initialYear={currentYear}
              initialTop3={leaderboardTop3}
              initialTop10={leaderboardTop10}
              compact
              onViewAll={() => goTab("leaderboard")}
            />
            <KhpaMatchCenter
              venues={venues}
              initialVenueId={activeVenue.id}
              players={activePlayers}
              initialMatchDate={initialMatchDate}
              initialMatches={initialMatches}
              leaderboard={leaderboardTop10}
              canDelete={canDelete}
            />
          </div>
        )}

        {tab === "players" && (
          <KhpaPlayersManager
            players={allPlayers}
            leaderboard={leaderboardTop10}
            canDelete={canDelete}
          />
        )}

        {tab === "leaderboard" && (
          <KhpaLeaderboardPanel
            availableYears={availableYears}
            initialYear={currentYear}
            initialTop3={leaderboardTop3}
            initialTop10={leaderboardTop10}
            showFull
          />
        )}
      </main>
    </>
  );
}

export function KhpaDashboard(props: Props) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">載入中…</div>}>
      <KhpaDashboardInner {...props} />
    </Suspense>
  );
}
