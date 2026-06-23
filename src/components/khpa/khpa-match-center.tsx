"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Download, Plus } from "lucide-react";
import { KhpaManualMatchDialog } from "@/components/khpa/khpa-manual-match-dialog";
import { KhpaMatchCard } from "@/components/khpa/khpa-match-card";
import { KhpaVenueTabs } from "@/components/khpa/khpa-venue-tabs";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  createKhpaMatchWithScore,
  deleteKhpaMatch,
  ensureKhpaMatchDay,
  getKhpaMatchesForDate,
} from "@/lib/actions/khpa/sessions";
import { getKhpaLeaderboardTop10 } from "@/lib/actions/khpa/leaderboard";
import { exportKhpaMatchesToDuprCsv } from "@/lib/khpa/export-csv";
import { khpaHomePath } from "@/lib/khpa/paths";
import type { KhpaLeaderboardEntry } from "@/types/khpa";
import type { KhpaMatchWithPlayers, KhpaPlayer, KhpaVenue } from "@/types/khpa";
import type { ScoreType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  venues: KhpaVenue[];
  initialVenueId: string;
  players: KhpaPlayer[];
  initialMatchDate: string;
  initialMatches: KhpaMatchWithPlayers[];
  leaderboard: KhpaLeaderboardEntry[];
  canDelete: boolean;
};

export function KhpaMatchCenter({
  venues,
  initialVenueId,
  players,
  initialMatchDate,
  initialMatches,
  leaderboard,
  canDelete,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeVenue, setActiveVenue] = useState(
    () => venues.find((v) => v.id === initialVenueId) ?? venues[0]!,
  );
  const [matchDate, setMatchDate] = useState(initialMatchDate);
  const [matchesByVenue, setMatchesByVenue] = useState<Record<string, KhpaMatchWithPlayers[]>>({
    [initialVenueId]: initialMatches,
  });
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState(leaderboard);
  const [isPending, startTransition] = useTransition();
  const { error: toastError, success } = useAppUi();

  const matches = matchesByVenue[activeVenue.id] ?? [];

  const playerWins = useMemo(
    () => Object.fromEntries(leaderboardEntries.map((e) => [e.playerId, e.wins])),
    [leaderboardEntries],
  );

  const matchCounts = useMemo(
    () =>
      Object.fromEntries(
        venues.map((v) => [v.id, (matchesByVenue[v.id] ?? []).length]),
      ),
    [venues, matchesByVenue],
  );

  const syncVenueUrl = useCallback(
    (venue: KhpaVenue) => {
      const tab = searchParams.get("tab");
      router.replace(
        khpaHomePath({
          venue: venue.slug,
          tab: tab ?? undefined,
        }),
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const loadMatches = useCallback(async (venueId: string, date: string) => {
    await ensureKhpaMatchDay(venueId, date);
    const list = await getKhpaMatchesForDate(venueId, date);
    setMatchesByVenue((prev) => ({ ...prev, [venueId]: list }));
    return list;
  }, []);

  const handleVenueChange = (venue: KhpaVenue) => {
    setActiveVenue(venue);
    syncVenueUrl(venue);
    startTransition(async () => {
      try {
        setError(null);
        await loadMatches(venue.id, matchDate);
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      }
    });
  };

  const handleDateChange = (date: string) => {
    setMatchDate(date);
    startTransition(async () => {
      try {
        setError(null);
        await loadMatches(activeVenue.id, date);
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      }
    });
  };

  const handleAddMatch = async (input: {
    team1: [string, string];
    team2: [string, string];
    team1Score: number;
    team2Score: number;
    scoreType: ScoreType;
  }) => {
    await createKhpaMatchWithScore(
      activeVenue.id,
      matchDate,
      input.team1,
      input.team2,
      input.team1Score,
      input.team2Score,
      input.scoreType,
    );
    await loadMatches(activeVenue.id, matchDate);
    const year = Number(matchDate.slice(0, 4)) || new Date().getFullYear();
    const top10 = await getKhpaLeaderboardTop10(year);
    setLeaderboardEntries(top10);
  };

  const handleDelete = async (matchId: string) => {
    await deleteKhpaMatch(matchId);
    await loadMatches(activeVenue.id, matchDate);
    const year = Number(matchDate.slice(0, 4)) || new Date().getFullYear();
    const top10 = await getKhpaLeaderboardTop10(year);
    setLeaderboardEntries(top10);
  };

  const handleExport = () => {
    try {
      const result = exportKhpaMatchesToDuprCsv(matchDate, matches, {
        venueName: activeVenue.name,
      });
      success(`已匯出 ${result.exported} 場`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "匯出失敗");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="khpa-scoreboard mb-1 flex items-center gap-2">
          <span className="khpa-live-dot" aria-hidden />
          <span className="khpa-section-label">賽事紀錄</span>
        </div>
        <h2 className="text-lg font-semibold">今日對戰</h2>
        <p className="text-sm text-muted">依地點與日期分開記錄 · 最新在最上方</p>
      </div>

      <KhpaVenueTabs
        venues={venues}
        activeVenueId={activeVenue.id}
        onChange={handleVenueChange}
        matchCounts={matchCounts}
        disabled={isPending}
      />

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <label className="mb-1 flex items-center gap-1 text-xs text-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            日期
          </label>
          <Input
            type="date"
            value={matchDate}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={isPending}
            className="h-11"
          />
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-baseline justify-between gap-3 border-b border-divider px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {activeVenue.name}
            </h3>
            <p className="text-xs text-muted">
              {matchDate} · {matches.length} 場
            </p>
          </div>
          {matches.length > 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              最新在上
            </span>
          )}
        </div>

        {matches.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            此地點尚無對戰紀錄，請按「新增成績」
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 p-2 sm:gap-2 sm:p-3">
            {matches.map((match, index) => (
              <KhpaMatchCard
                key={match.id}
                match={match}
                displayIndex={matches.length - index}
                playerWins={playerWins}
                canDelete={canDelete}
                onDelete={canDelete ? handleDelete : undefined}
                disabled={isPending}
              />
            ))}
          </div>
        )}
      </section>

      <div className="sticky bottom-3 z-10 flex gap-2 rounded-xl border border-border bg-surface/95 p-1.5 shadow-lg backdrop-blur-sm sm:bottom-4">
        <Button
          onClick={() => setShowManual(true)}
          className="btn-touch h-11 flex-1"
          disabled={isPending || players.length < 4}
        >
          <Plus className="h-4 w-4" />
          新增成績
        </Button>
        <Button
          variant="secondary"
          onClick={handleExport}
          className="btn-touch h-11 shrink-0 px-3"
          disabled={isPending || matches.length === 0}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">匯出</span>
        </Button>
      </div>

      {showManual && (
        <KhpaManualMatchDialog
          players={players}
          playerWins={playerWins}
          onSubmit={handleAddMatch}
          onClose={() => setShowManual(false)}
        />
      )}
    </div>
  );
}
